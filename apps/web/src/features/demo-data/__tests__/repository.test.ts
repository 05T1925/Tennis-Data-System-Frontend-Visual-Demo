import { describe, expect, it } from 'vitest';

import { DefaultWebDemoDataRepository } from '../repository';
import { createWebDemoSeed } from '../seed';
import { MemoryWebDemoDataStorage } from './testUtils';

describe('DefaultWebDemoDataRepository', () => {
  it('creates and persists the 24-record Seed on first access', async () => {
    const storage = new MemoryWebDemoDataStorage();
    const repository = new DefaultWebDemoDataRepository(storage);
    const snapshot = await repository.getSnapshot();

    expect(snapshot.videos).toHaveLength(24);
    expect(storage.reads).toBe(1);
    expect(storage.writes).toBe(1);
  });

  it('shares one initialization read across concurrent first calls', async () => {
    const storage = new MemoryWebDemoDataStorage();
    const repository = new DefaultWebDemoDataRepository(storage);
    await Promise.all([repository.getSnapshot(), repository.getSnapshot()]);
    expect(storage.reads).toBe(1);
  });

  it('retries initialization after a transient read failure', async () => {
    const storage = new MemoryWebDemoDataStorage();
    storage.failReads = 1;
    const repository = new DefaultWebDemoDataRepository(storage);
    await expect(repository.getSnapshot()).rejects.toMatchObject({
      code: 'WEB_DEMO_DATA_LOAD_FAILED',
    });
    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 1 });
    expect(storage.reads).toBe(2);
  });

  it.each(['{broken', JSON.stringify({ version: 2 })])(
    'recovers invalid stored data: %s',
    async (value) => {
      const storage = new MemoryWebDemoDataStorage();
      storage.value = value;
      const repository = new DefaultWebDemoDataRepository(storage);
      expect((await repository.getSnapshot()).videos).toHaveLength(24);
      expect(JSON.parse(storage.value ?? '{}')).toMatchObject({ version: 1 });
    },
  );

  it('fails safely when invalid data cannot be replaced', async () => {
    const storage = new MemoryWebDemoDataStorage();
    storage.value = '{broken';
    storage.failWrites = true;
    const repository = new DefaultWebDemoDataRepository(storage);
    await expect(repository.getSnapshot()).rejects.toMatchObject({
      code: 'WEB_DEMO_DATA_SAVE_FAILED',
    });
  });

  it('returns defensive copies of videos and tasks', async () => {
    const repository = new DefaultWebDemoDataRepository(new MemoryWebDemoDataStorage());
    const first = await repository.getSnapshot();
    first.videos[0].title = 'mutated';
    first.analysisTasks.splice(0);
    const second = await repository.getSnapshot();
    expect(second.videos[0].title).not.toBe('mutated');
    expect(second.analysisTasks.length).toBeGreaterThan(0);
  });

  it('deletes one video and its task without affecting other records', async () => {
    const repository = new DefaultWebDemoDataRepository(new MemoryWebDemoDataStorage());
    const before = await repository.getSnapshot();
    await repository.deleteVideo('video-web-demo-01');
    const after = await repository.getSnapshot();
    expect(after.videos).toHaveLength(before.videos.length - 1);
    expect(after.videos.some((video) => video.id === 'video-web-demo-02')).toBe(true);
    expect(after.analysisTasks.some((task) => task.videoId === 'video-web-demo-01')).toBe(false);
  });

  it('rejects repeated deletion', async () => {
    const repository = new DefaultWebDemoDataRepository(new MemoryWebDemoDataStorage());
    await repository.deleteVideo('video-web-demo-01');
    await expect(repository.deleteVideo('video-web-demo-01')).rejects.toMatchObject({
      code: 'WEB_VIDEO_NOT_FOUND',
    });
  });

  it('serializes multiple deletions', async () => {
    const repository = new DefaultWebDemoDataRepository(new MemoryWebDemoDataStorage());
    await Promise.all([
      repository.deleteVideo('video-web-demo-01'),
      repository.deleteVideo('video-web-demo-02'),
    ]);
    const snapshot = await repository.getSnapshot();
    expect(snapshot.videos.map((video) => video.id)).not.toContain('video-web-demo-01');
    expect(snapshot.videos.map((video) => video.id)).not.toContain('video-web-demo-02');
  });

  it('keeps the old snapshot when deletion persistence fails', async () => {
    const storage = new MemoryWebDemoDataStorage();
    const repository = new DefaultWebDemoDataRepository(storage);
    const before = await repository.getSnapshot();
    storage.failWrites = true;
    await expect(repository.deleteVideo('video-web-demo-01')).rejects.toMatchObject({
      code: 'WEB_DEMO_DATA_SAVE_FAILED',
    });
    storage.failWrites = false;
    expect(await repository.getSnapshot()).toEqual(before);
  });

  it('cancels before the persistence boundary without writing', async () => {
    const storage = new MemoryWebDemoDataStorage();
    const repository = new DefaultWebDemoDataRepository(storage);
    await repository.getSnapshot();
    const writes = storage.writes;
    const controller = new AbortController();
    controller.abort();
    await expect(
      repository.deleteVideo('video-web-demo-01', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(storage.writes).toBe(writes);
  });

  it('returns success when Abort occurs during the synchronous durable write', async () => {
    const storage = new MemoryWebDemoDataStorage();
    const repository = new DefaultWebDemoDataRepository(storage);
    await repository.getSnapshot();
    const controller = new AbortController();
    storage.onWrite = () => controller.abort();
    await expect(
      repository.deleteVideo('video-web-demo-01', { signal: controller.signal }),
    ).resolves.toBeUndefined();
    expect(
      (await repository.getSnapshot()).videos.some((video) => video.id === 'video-web-demo-01'),
    ).toBe(false);
  });

  it('restores an explicitly persisted valid Snapshot without reseeding', async () => {
    const storage = new MemoryWebDemoDataStorage();
    storage.value = JSON.stringify(createWebDemoSeed());
    const repository = new DefaultWebDemoDataRepository(storage);
    await repository.getSnapshot();
    expect(storage.writes).toBe(0);
  });
});
