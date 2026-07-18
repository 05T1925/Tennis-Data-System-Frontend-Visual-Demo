import { describe, expect, it } from 'vitest';

import { DefaultWebDemoDataRepository } from '../repository';
import { webDemoDataSnapshotV2Schema } from '../schemas';
import { MutableWebClock, MemoryWebDemoDataStorage } from './testUtils';

function setup() {
  const storage = new MemoryWebDemoDataStorage();
  const clock = new MutableWebClock();
  const repository = new DefaultWebDemoDataRepository(storage, clock);
  return { storage, clock, repository };
}

describe('stage 14 Web repository controls', () => {
  it('resets only its storage value and returns a defensive 24-video Snapshot', async () => {
    const { repository, storage } = setup();
    await repository.deleteVideo('video-web-demo-01');
    const reset = await repository.resetDemoData();
    expect(reset.videos).toHaveLength(24);
    reset.videos.splice(0);
    expect((await repository.getSnapshot()).videos).toHaveLength(24);
    expect(storage.value).toContain('video-web-demo-01');
  });

  it('keeps the old Snapshot when reset persistence fails and supports Abort', async () => {
    const { repository, storage } = setup();
    const before = await repository.getSnapshot();
    storage.failWrites = true;
    await expect(repository.resetDemoData()).rejects.toMatchObject({
      code: 'WEB_DEMO_DATA_SAVE_FAILED',
    });
    storage.failWrites = false;
    expect(await repository.getSnapshot()).toEqual(before);
    const controller = new AbortController();
    controller.abort();
    await expect(repository.resetDemoData({ signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('creates complete success, static processing and retryable failed bundles', async () => {
    const { repository } = setup();
    const success = await repository.createDemoScenario('success');
    const processing = await repository.createDemoScenario('processing');
    const failed = await repository.createDemoScenario('failed');

    expect(success).toMatchObject({
      taskState: { task: { status: 'succeeded' }, runtimeActive: false },
      result: { videoId: success.videoRecord.video.id },
      cv: { output: { videoId: success.videoRecord.video.id } },
    });
    expect(processing).toMatchObject({
      taskState: { task: { status: 'processing' }, runtimeActive: false },
      result: null,
      cv: null,
    });
    expect(failed).toMatchObject({
      taskState: { task: { status: 'failed' }, runtimeActive: false },
      result: null,
      cv: null,
    });
    await expect(repository.retryAnalysis(failed.videoRecord.video.id)).resolves.toMatchObject({
      status: 'queued',
    });
    expect(webDemoDataSnapshotV2Schema.safeParse(await repository.getSnapshot()).success).toBe(
      true,
    );
  });

  it('uses stable suffixes for same-clock sequential and concurrent scenario IDs', async () => {
    const { repository } = setup();
    const sequential = await Promise.all([
      repository.createDemoScenario('success'),
      repository.createDemoScenario('processing'),
    ]);
    const concurrent = await Promise.all([
      repository.createDemoScenario('failed'),
      repository.createDemoScenario('success'),
    ]);
    const ids = [...sequential, ...concurrent].map(({ videoRecord }) => videoRecord.video.id);
    expect(new Set(ids).size).toBe(4);
    expect(ids).toEqual([
      'video-web-demo-created-20260718T120530123Z',
      'video-web-demo-created-20260718T120530123Z-2',
      'video-web-demo-created-20260718T120530123Z-3',
      'video-web-demo-created-20260718T120530123Z-4',
    ]);
  });

  it('does not reuse a same-clock scenario ID after deletion or reset', async () => {
    const { repository } = setup();
    const first = await repository.createDemoScenario('success');
    await repository.deleteVideo(first.videoRecord.video.id);
    const second = await repository.createDemoScenario('success');
    await repository.resetDemoData();
    const third = await repository.createDemoScenario('success');
    expect(second.videoRecord.video.id).toBe('video-web-demo-created-20260718T120530123Z-2');
    expect(third.videoRecord.video.id).toBe('video-web-demo-created-20260718T120530123Z-3');
  });

  it('uses current Clock time and preserves legal scenario time relations', async () => {
    const { repository, clock } = setup();
    const bundle = await repository.createDemoScenario('success');
    const video = bundle.videoRecord.video;
    const task = bundle.taskState.task;
    expect(video.createdAt).toBe(clock.now().toISOString());
    expect(task?.createdAt).toBe(video.createdAt);
    expect(Date.parse(task?.startedAt ?? '')).toBeLessThanOrEqual(
      Date.parse(task?.completedAt ?? ''),
    );
  });

  it.each(['video-web-demo-03', 'video-web-demo-02'])(
    'force completes active %s',
    async (videoId) => {
      const { repository } = setup();
      const completed = await repository.forceCompleteAnalysis(videoId);
      expect(completed).toMatchObject({
        videoRecord: { video: { id: videoId }, analysisTask: { status: 'succeeded' } },
        taskState: { task: { status: 'succeeded', stage: 'completed', progress: 100 } },
        result: { videoId },
        cv: { output: { videoId } },
      });
      expect(completed.logs.some(({ audience }) => audience === 'user')).toBe(true);
      expect(completed.logs.some(({ audience }) => audience === 'developer')).toBe(true);
      expect(webDemoDataSnapshotV2Schema.safeParse(await repository.getSnapshot()).success).toBe(
        true,
      );
    },
  );

  it('removes an active Runtime when force completing a retried task', async () => {
    const { repository } = setup();
    const retried = await repository.retryAnalysis('video-web-demo-04');
    expect((await repository.getSnapshot()).analysisRuntimes[retried.id]).toBeDefined();
    const completed = await repository.forceCompleteAnalysis(retried.videoId);
    expect(completed.taskState.runtimeActive).toBe(false);
    expect((await repository.getSnapshot()).analysisRuntimes[retried.id]).toBeUndefined();
  });

  it('rejects missing and terminal force-complete targets, including repetition', async () => {
    const { repository } = setup();
    await expect(repository.forceCompleteAnalysis('missing')).rejects.toMatchObject({
      code: 'WEB_VIDEO_NOT_FOUND',
    });
    await expect(repository.forceCompleteAnalysis('video-web-demo-06')).rejects.toMatchObject({
      code: 'WEB_ANALYSIS_NOT_FOUND',
    });
    await expect(repository.forceCompleteAnalysis('video-web-demo-01')).rejects.toMatchObject({
      code: 'WEB_ANALYSIS_FORCE_COMPLETE_NOT_ALLOWED',
    });
    await repository.forceCompleteAnalysis('video-web-demo-03');
    await expect(repository.forceCompleteAnalysis('video-web-demo-03')).rejects.toMatchObject({
      code: 'WEB_ANALYSIS_FORCE_COMPLETE_NOT_ALLOWED',
    });
  });

  it('rolls back failed create/complete writes and aborts before persistence', async () => {
    const { repository, storage } = setup();
    const before = await repository.getSnapshot();
    storage.failWrites = true;
    await expect(repository.createDemoScenario('success')).rejects.toMatchObject({
      code: 'WEB_DEMO_DATA_SAVE_FAILED',
    });
    await expect(repository.forceCompleteAnalysis('video-web-demo-03')).rejects.toMatchObject({
      code: 'WEB_DEMO_DATA_SAVE_FAILED',
    });
    storage.failWrites = false;
    expect(await repository.getSnapshot()).toEqual(before);
    const controller = new AbortController();
    controller.abort();
    await expect(
      repository.createDemoScenario('processing', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    await expect(
      repository.forceCompleteAnalysis('video-web-demo-03', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
