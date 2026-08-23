import { describe, expect, it } from 'vitest';

import { createVideo } from '../factories';
import type { DemoDataSnapshot } from '../types';
import { DEMO_DATA_VERSION } from '../types';
import { createTestContext, MemoryDemoDataStorage } from './testUtils';

describe('DefaultDemoDataRepository', () => {
  it('creates a validated Seed with succeeded, processing, failed, and upload-failed samples', async () => {
    const { repository, storage } = createTestContext();
    const snapshot = await repository.getSnapshot();

    expect(snapshot.version).toBe(DEMO_DATA_VERSION);
    expect(snapshot.analysisTasks.map(({ status }) => status)).toEqual(
      expect.arrayContaining(['succeeded', 'queued', 'failed']),
    );
    expect(snapshot.analysisResults).toHaveLength(1);
    expect(snapshot.videos.some(({ uploadStatus }) => uploadStatus === 'failed')).toBe(true);
    expect(storage.writes).toBe(1);
  });

  it('restores persisted data in a new repository instance', async () => {
    const storage = new MemoryDemoDataStorage();
    const first = createTestContext(storage);
    const initial = await first.repository.getSnapshot();
    const second = createTestContext(storage);

    expect(await second.repository.getSnapshot()).toEqual(initial);
    expect(storage.reads).toBe(2);
  });

  it('shares one initialization read across concurrent first calls', async () => {
    const { repository, storage } = createTestContext();

    const [first, second] = await Promise.all([repository.getSnapshot(), repository.getSnapshot()]);

    expect(first).toEqual(second);
    expect(storage.reads).toBe(1);
  });

  it('retries initialization after a transient storage read failure', async () => {
    const { repository, storage } = createTestContext();
    storage.failReads = 1;

    await expect(repository.getSnapshot()).rejects.toMatchObject({
      code: 'DEMO_DATA_LOAD_FAILED',
    });
    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 1 });
    expect(storage.reads).toBe(2);
  });

  it.each(['{broken json', JSON.stringify({ version: 2 })])(
    'recovers invalid stored content from %s',
    async (value) => {
      const storage = new MemoryDemoDataStorage();
      storage.value = value;
      const { repository } = createTestContext(storage);
      const snapshot = await repository.getSnapshot();

      expect(snapshot.version).toBe(1);
      expect(snapshot.videos.length).toBeGreaterThan(0);
      expect(JSON.parse(storage.value ?? '{}').version).toBe(1);
    },
  );

  it('uses in-memory Seed when invalid storage cannot be overwritten', async () => {
    const storage = new MemoryDemoDataStorage();
    storage.value = '{broken json';
    storage.failWrites = true;
    const { repository } = createTestContext(storage);

    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 1 });
    expect(storage.value).toBe('{broken json');
  });

  it('keeps the last durable in-memory snapshot when saving fails', async () => {
    const { repository, storage } = createTestContext();
    const before = await repository.getSnapshot();
    storage.failWrites = true;

    await expect(
      repository.update((snapshot) => ({
        ...snapshot,
        videos: snapshot.videos.map((video, index) =>
          index === 0 ? { ...video, note: 'not persisted' } : video,
        ),
      })),
    ).rejects.toMatchObject({ code: 'DEMO_DATA_SAVE_FAILED' });
    storage.failWrites = false;
    expect(await repository.getSnapshot()).toEqual(before);
  });

  it('serializes concurrent writes without losing either update', async () => {
    const { repository } = createTestContext();
    await repository.getSnapshot();
    await Promise.all([
      repository.update((snapshot) => ({
        ...snapshot,
        videos: snapshot.videos.map((video, index) =>
          index === 0 ? { ...video, note: 'first' } : video,
        ),
      })),
      repository.update((snapshot) => ({
        ...snapshot,
        videos: snapshot.videos.map((video, index) =>
          index === 1 ? { ...video, note: 'second' } : video,
        ),
      })),
    ]);

    const snapshot = await repository.getSnapshot();
    expect(snapshot.videos[0].note).toBe('first');
    expect(snapshot.videos[1].note).toBe('second');
  });

  it('orders reset after an already queued update without mixing snapshots', async () => {
    const { repository, clock } = createTestContext();
    await repository.getSnapshot();
    const now = clock.now().toISOString();

    await Promise.all([
      repository.update((snapshot) => ({
        ...snapshot,
        videos: [
          ...snapshot.videos,
          createVideo({ id: 'video-before-reset', createdAt: now, updatedAt: now }),
        ],
      })),
      repository.reset(),
    ]);

    expect(
      (await repository.getSnapshot()).videos.some(({ id }) => id === 'video-before-reset'),
    ).toBe(false);
  });

  it.each([
    {
      name: 'active task without runtime',
      mutate: (snapshot: DemoDataSnapshot) => ({
        ...snapshot,
        runtime: { ...snapshot.runtime, analyses: {} },
      }),
    },
    {
      name: 'result summary mismatch',
      mutate: (snapshot: DemoDataSnapshot) => ({
        ...snapshot,
        analysisResults: snapshot.analysisResults.map((result, index) =>
          index === 0
            ? { ...result, summary: { ...result.summary, totalShots: result.shots.length + 1 } }
            : result,
        ),
      }),
    },
    {
      name: 'result without succeeded task',
      mutate: (snapshot: DemoDataSnapshot) => ({
        ...snapshot,
        analysisTasks: snapshot.analysisTasks.map((task) =>
          task.videoId === snapshot.analysisResults[0].videoId
            ? {
                ...task,
                status: 'failed' as const,
                stage: 'ball_tracking' as const,
                progress: 45,
                errorCode: 'FAILED',
                errorMessage: 'Failed',
              }
            : task,
        ),
      }),
    },
    {
      name: 'duplicate video ID',
      mutate: (snapshot: DemoDataSnapshot) => ({
        ...snapshot,
        videos: [...snapshot.videos, { ...snapshot.videos[0] }],
      }),
    },
    {
      name: 'task status and progress mismatch',
      mutate: (snapshot: DemoDataSnapshot) => ({
        ...snapshot,
        analysisTasks: snapshot.analysisTasks.map((task) =>
          task.status === 'queued' ? { ...task, progress: 10 } : task,
        ),
      }),
    },
    {
      name: 'one-sided Point and Rally relation',
      mutate: (snapshot: DemoDataSnapshot) => ({
        ...snapshot,
        analysisResults: snapshot.analysisResults.map((result, index) =>
          index === 0
            ? {
                ...result,
                points: result.points?.map((point) => ({ ...point, rallyId: undefined })),
              }
            : result,
        ),
      }),
    },
  ])('maps invalid $name candidates to a repository AppError', async ({ mutate }) => {
    const { repository } = createTestContext();
    await repository.getSnapshot();

    await expect(repository.update(mutate)).rejects.toMatchObject({
      code: 'DEMO_DATA_SAVE_FAILED',
    });
  });

  it('returns defensive copies and reset restores deterministic Seed IDs', async () => {
    const { repository, storage } = createTestContext();
    const first = await repository.getSnapshot();
    first.videos.splice(0, first.videos.length);
    const unchanged = await repository.getSnapshot();
    const ids = unchanged.analysisResults[0].shots.map(({ id }) => id);
    await repository.update((snapshot) => ({
      ...snapshot,
      videos: snapshot.videos.map((video) => ({ ...video, title: 'changed' })),
    }));
    const reset = await repository.reset();

    expect(unchanged.videos.length).toBeGreaterThan(0);
    expect(reset.analysisResults[0].shots.map(({ id }) => id)).toEqual(ids);
    expect(storage.removes).toBe(0);
  });

  it('keeps the old snapshot when reset persistence fails', async () => {
    const { repository, storage } = createTestContext();
    await repository.update((snapshot) => ({
      ...snapshot,
      videos: snapshot.videos.map((video) => ({ ...video, note: 'durable change' })),
    }));
    const before = await repository.getSnapshot();
    storage.failWrites = true;

    await expect(repository.reset()).rejects.toMatchObject({ code: 'DEMO_DATA_SAVE_FAILED' });
    storage.failWrites = false;
    expect(await repository.getSnapshot()).toEqual(before);
  });
});
