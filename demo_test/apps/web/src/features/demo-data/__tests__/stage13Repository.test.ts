import { describe, expect, it } from 'vitest';

import { DefaultWebDemoDataRepository } from '../repository';
import { GENERIC_ANALYSIS_FAILURE_MESSAGE } from '../safety';
import { createWebDemoSeed } from '../seed';
import type { WebClock, WebDemoDataSnapshotV1 } from '../types';
import { MemoryWebDemoDataStorage } from './testUtils';

class MutableClock implements WebClock {
  value = new Date('2026-07-20T10:00:00.000Z');
  now(): Date {
    return this.value;
  }
  advance(milliseconds: number): void {
    this.value = new Date(this.value.getTime() + milliseconds);
  }
}

function createV1(): WebDemoDataSnapshotV1 {
  const seed = createWebDemoSeed();
  return { version: 1, videos: seed.videos, analysisTasks: seed.analysisTasks };
}

describe('stage 13 Web repository', () => {
  it('migrates v1 without restoring deleted videos or missing tasks', async () => {
    const v1 = createV1();
    v1.videos = v1.videos.filter(({ id }) => id !== 'video-web-demo-20');
    v1.analysisTasks = v1.analysisTasks.filter(
      ({ videoId }) => videoId !== 'video-web-demo-20' && videoId !== 'video-web-demo-11',
    );
    const storage = new MemoryWebDemoDataStorage();
    storage.value = JSON.stringify(v1);
    const snapshot = await new DefaultWebDemoDataRepository(storage).getSnapshot();
    expect(snapshot.version).toBe(2);
    expect(snapshot.videos.some(({ id }) => id === 'video-web-demo-20')).toBe(false);
    expect(snapshot.analysisTasks.some(({ videoId }) => videoId === 'video-web-demo-11')).toBe(
      false,
    );
    expect(snapshot.analysisResults.map(({ videoId }) => videoId)).toEqual(['video-web-demo-01']);
    expect(snapshot.analysisRuntimes).toEqual({});
    expect(storage.writes).toBe(1);
  });

  it('does not repeat migration for stored v2', async () => {
    const storage = new MemoryWebDemoDataStorage();
    storage.value = JSON.stringify(createWebDemoSeed());
    await new DefaultWebDemoDataRepository(storage).getSnapshot();
    expect(storage.writes).toBe(0);
  });

  it.each([
    ['URL', 'See https://internal.example/task/1'],
    ['Windows path', 'Failed at C:\\private\\worker.ts:42'],
    ['stack', 'Error: failed\n    at run (src/worker.ts:42:1)'],
    ['token', 'access token: secret-value'],
  ])('safely migrates a legal v1 Task containing %s', async (_, errorMessage) => {
    const v1 = createV1();
    const failedTask = v1.analysisTasks.find(({ videoId }) => videoId === 'video-web-demo-04');
    if (!failedTask) throw new Error('Missing failed migration fixture.');
    failedTask.errorMessage = errorMessage;
    const storage = new MemoryWebDemoDataStorage();
    storage.value = JSON.stringify(v1);

    const snapshot = await new DefaultWebDemoDataRepository(storage).getSnapshot();
    const migratedTask = snapshot.analysisTasks.find(({ id }) => id === failedTask.id);
    const userLog = snapshot.analysisLogs.find(
      ({ taskId, audience, level }) =>
        taskId === failedTask.id && audience === 'user' && level === 'error',
    );
    expect(migratedTask?.errorMessage).toBe(errorMessage);
    expect(migratedTask?.errorCode).toBe(failedTask.errorCode);
    expect(userLog?.userMessage).toBe(GENERIC_ANALYSIS_FAILURE_MESSAGE);
  });

  it('retains v1 when migration persistence fails and permits retry', async () => {
    const storage = new MemoryWebDemoDataStorage();
    const original = JSON.stringify(createV1());
    storage.value = original;
    storage.failWrites = true;
    const repository = new DefaultWebDemoDataRepository(storage);
    await expect(repository.getSnapshot()).rejects.toMatchObject({
      code: 'WEB_DEMO_DATA_SAVE_FAILED',
    });
    expect(storage.value).toBe(original);
    storage.failWrites = false;
    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 2 });
  });

  it('retries a failed task atomically and materializes deterministic completion', async () => {
    const storage = new MemoryWebDemoDataStorage();
    const clock = new MutableClock();
    const repository = new DefaultWebDemoDataRepository(storage, clock);
    const task = await repository.retryAnalysis('video-web-demo-04');
    expect(task).toMatchObject({ status: 'queued', stage: 'queued', progress: 0, retryCount: 2 });
    expect(task.errorCode).toBeUndefined();
    let snapshot = await repository.getSnapshot();
    expect(snapshot.analysisRuntimes[task.id]).toMatchObject({ attempt: 2 });
    expect(snapshot.analysisResults.some(({ videoId }) => videoId === task.videoId)).toBe(false);
    clock.advance(8_000);
    expect(await repository.getAnalysisTaskStateByVideoId(task.videoId)).toMatchObject({
      task: { status: 'processing', stage: 'ball_tracking', progress: 55 },
      runtimeActive: true,
    });
    clock.advance(8_000);
    expect(await repository.getAnalysisTaskStateByVideoId(task.videoId)).toMatchObject({
      task: { status: 'succeeded', stage: 'completed', progress: 100 },
      runtimeActive: false,
    });
    snapshot = await repository.getSnapshot();
    expect(snapshot.analysisRuntimes[task.id]).toBeUndefined();
    expect(snapshot.analysisResults.some(({ videoId }) => videoId === task.videoId)).toBe(true);
    expect(snapshot.cvDemoOutputs.some(({ output }) => output.videoId === task.videoId)).toBe(true);
    const logIds = snapshot.analysisLogs
      .filter(({ taskId }) => taskId === task.id)
      .map(({ id }) => id);
    expect(new Set(logIds).size).toBe(logIds.length);
  });

  it('serializes concurrent retry and rejects the second attempt', async () => {
    const repository = new DefaultWebDemoDataRepository(
      new MemoryWebDemoDataStorage(),
      new MutableClock(),
    );
    const results = await Promise.allSettled([
      repository.retryAnalysis('video-web-demo-04'),
      repository.retryAnalysis('video-web-demo-04'),
    ]);
    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1);
  });

  it('keeps failed task and old related data when retry write fails', async () => {
    const storage = new MemoryWebDemoDataStorage();
    const repository = new DefaultWebDemoDataRepository(storage, new MutableClock());
    const before = await repository.getSnapshot();
    storage.failWrites = true;
    await expect(repository.retryAnalysis('video-web-demo-04')).rejects.toMatchObject({
      code: 'WEB_DEMO_DATA_SAVE_FAILED',
    });
    storage.failWrites = false;
    expect(await repository.getSnapshot()).toEqual(before);
  });

  it('aborts retry before persistence', async () => {
    const storage = new MemoryWebDemoDataStorage();
    const repository = new DefaultWebDemoDataRepository(storage, new MutableClock());
    await repository.getSnapshot();
    const writes = storage.writes;
    const controller = new AbortController();
    controller.abort();
    await expect(
      repository.retryAnalysis('video-web-demo-04', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(storage.writes).toBe(writes);
  });

  it('returns defensive copies of Result, CV and Logs', async () => {
    const repository = new DefaultWebDemoDataRepository(new MemoryWebDemoDataStorage());
    const result = await repository.getAnalysisResultByVideoId('video-web-demo-01');
    const cv = await repository.getCvDemoOutputByVideoId('video-web-demo-01');
    const logs = await repository.getAnalysisLogsByVideoId('video-web-demo-01');
    expect(result && cv).toBeTruthy();
    if (result) result.shots.splice(0);
    if (cv?.output.payload.ballTrack) cv.output.payload.ballTrack.splice(0);
    logs.splice(0);
    expect(
      (await repository.getAnalysisResultByVideoId('video-web-demo-01'))?.shots.length,
    ).toBeGreaterThan(0);
    expect(
      (await repository.getCvDemoOutputByVideoId('video-web-demo-01'))?.output.payload.ballTrack
        ?.length,
    ).toBeGreaterThan(0);
    expect((await repository.getAnalysisLogsByVideoId('video-web-demo-01')).length).toBeGreaterThan(
      0,
    );
  });

  it('deletes Result, CV, Logs and Runtime with the Video and Task', async () => {
    const repository = new DefaultWebDemoDataRepository(
      new MemoryWebDemoDataStorage(),
      new MutableClock(),
    );
    const task = await repository.retryAnalysis('video-web-demo-04');
    await repository.deleteVideo(task.videoId);
    const snapshot = await repository.getSnapshot();
    expect(snapshot.videos.some(({ id }) => id === task.videoId)).toBe(false);
    expect(snapshot.analysisTasks.some(({ id }) => id === task.id)).toBe(false);
    expect(snapshot.analysisResults.some(({ videoId }) => videoId === task.videoId)).toBe(false);
    expect(snapshot.cvDemoOutputs.some(({ output }) => output.videoId === task.videoId)).toBe(
      false,
    );
    expect(snapshot.analysisLogs.some(({ taskId }) => taskId === task.id)).toBe(false);
    expect(snapshot.analysisRuntimes[task.id]).toBeUndefined();
  });
});
