import { describe, expect, it } from 'vitest';

import { MockAnalysisService } from '../../analysis/services/MockAnalysisService';
import { MockVideoService } from '../../videos/services/MockVideoService';
import { createVideo } from '../factories';
import { DEFAULT_ANALYSIS_STAGE_DURATION_MS, DEFAULT_UPLOAD_DURATION_MS } from '../transitions';
import { DEMO_USER_ID } from '../types';
import { createTestContext } from './testUtils';

const input = {
  title: '  新训练  ',
  originalFileName: 'training.mp4',
  mimeType: 'video/mp4',
  fileSizeBytes: 10_000,
  durationSeconds: 120,
  matchType: 'training' as const,
  playMode: 'singles' as const,
};

function services() {
  const context = createTestContext();
  return {
    ...context,
    videos: new MockVideoService('success', context.repository, context.clock, context.idGenerator),
    analysis: new MockAnalysisService(context.repository, context.clock, context.idGenerator),
  };
}

describe('MockVideoService', () => {
  it('creates idle metadata, trims input, filters by owner, and hides foreign details', async () => {
    const { videos } = services();
    const created = await videos.createVideo({ userId: DEMO_USER_ID, input });

    expect(created).toMatchObject({ title: '新训练', uploadStatus: 'idle', uploadProgress: 0 });
    expect(await videos.listVideos({ userId: DEMO_USER_ID, uploadStatus: 'idle' })).toContainEqual(
      created,
    );
    expect(await videos.listVideos({ userId: 'unknown-user' })).toEqual([]);
    await expect(
      videos.getVideoById({ userId: 'unknown-user', videoId: created.id }),
    ).rejects.toMatchObject({ code: 'VIDEO_NOT_FOUND' });
  });

  it('rejects invalid numeric input', async () => {
    const { videos } = services();
    await expect(
      videos.createVideo({ userId: DEMO_USER_ID, input: { ...input, fileSizeBytes: Number.NaN } }),
    ).rejects.toMatchObject({ code: 'INVALID_VIDEO_INPUT' });
  });

  it('moves idle to uploading, is idempotent while active, and lazily updates progress', async () => {
    const { videos, clock } = services();
    const created = await videos.createVideo({ userId: DEMO_USER_ID, input });
    const started = await videos.startUpload({ userId: DEMO_USER_ID, videoId: created.id });
    const duplicate = await videos.startUpload({ userId: DEMO_USER_ID, videoId: created.id });
    clock.advance(DEFAULT_UPLOAD_DURATION_MS / 2);
    const halfway = await videos.getVideoById({ userId: DEMO_USER_ID, videoId: created.id });

    expect(started.uploadStatus).toBe('uploading');
    expect(duplicate).toEqual(started);
    expect(halfway.uploadProgress).toBe(50);
  });

  it('does not move upload progress backward when the system clock decreases', async () => {
    const { videos, clock } = services();
    const created = await videos.createVideo({ userId: DEMO_USER_ID, input });
    await videos.startUpload({ userId: DEMO_USER_ID, videoId: created.id });
    clock.advance(DEFAULT_UPLOAD_DURATION_MS / 2);
    expect(await videos.getVideoById({ userId: DEMO_USER_ID, videoId: created.id })).toMatchObject({
      uploadProgress: 50,
    });
    clock.advance(-DEFAULT_UPLOAD_DURATION_MS / 4);

    expect(await videos.getVideoById({ userId: DEMO_USER_ID, videoId: created.id })).toMatchObject({
      uploadProgress: 50,
    });
  });

  it('completes upload at 100 and creates exactly one analysis task', async () => {
    const { videos, repository, clock } = services();
    const created = await videos.createVideo({ userId: DEMO_USER_ID, input });
    await videos.startUpload({ userId: DEMO_USER_ID, videoId: created.id });
    clock.advance(DEFAULT_UPLOAD_DURATION_MS);
    const uploaded = await videos.getVideoById({ userId: DEMO_USER_ID, videoId: created.id });
    await videos.getVideoById({ userId: DEMO_USER_ID, videoId: created.id });
    const snapshot = await repository.getSnapshot();

    expect(uploaded).toMatchObject({ uploadStatus: 'uploaded', uploadProgress: 100 });
    expect(snapshot.analysisTasks.filter((task) => task.videoId === created.id)).toHaveLength(1);
  });

  it('serializes concurrent upload starts into one runtime', async () => {
    const { videos, repository } = services();
    const created = await videos.createVideo({ userId: DEMO_USER_ID, input });
    const [first, second] = await Promise.all([
      videos.startUpload({ userId: DEMO_USER_ID, videoId: created.id }),
      videos.startUpload({ userId: DEMO_USER_ID, videoId: created.id }),
    ]);

    expect(first).toEqual(second);
    expect(Object.keys((await repository.getSnapshot()).runtime.uploads)).toContain(created.id);
  });

  it('retries failed uploads but refuses uploaded videos', async () => {
    const { videos, clock } = services();
    const failed = (await videos.listVideos({ userId: DEMO_USER_ID, uploadStatus: 'failed' }))[0];
    await videos.startUpload({ userId: DEMO_USER_ID, videoId: failed.id });
    clock.advance(DEFAULT_UPLOAD_DURATION_MS);
    const uploaded = await videos.getVideoById({ userId: DEMO_USER_ID, videoId: failed.id });

    expect(uploaded.uploadStatus).toBe('uploaded');
    await expect(
      videos.startUpload({ userId: DEMO_USER_ID, videoId: failed.id }),
    ).rejects.toMatchObject({ code: 'UPLOAD_NOT_ALLOWED' });
  });

  it('allows a canceled upload to restart', async () => {
    const { videos, repository, clock } = services();
    const now = clock.now().toISOString();
    await repository.update((snapshot) => ({
      ...snapshot,
      videos: [
        ...snapshot.videos,
        createVideo({
          id: 'video-canceled-upload',
          uploadStatus: 'canceled',
          uploadProgress: 20,
          createdAt: now,
          updatedAt: now,
        }),
      ],
    }));

    expect(
      await videos.startUpload({ userId: DEMO_USER_ID, videoId: 'video-canceled-upload' }),
    ).toMatchObject({ uploadStatus: 'uploading', uploadProgress: 0 });
  });

  it('cascades delete across task, result, and runtime data', async () => {
    const { videos, repository } = services();
    await videos.deleteVideo({ userId: DEMO_USER_ID, videoId: 'video-demo-succeeded' });
    const snapshot = await repository.getSnapshot();

    expect(snapshot.videos.some(({ id }) => id === 'video-demo-succeeded')).toBe(false);
    expect(snapshot.analysisTasks.some(({ videoId }) => videoId === 'video-demo-succeeded')).toBe(
      false,
    );
    expect(snapshot.analysisResults.some(({ videoId }) => videoId === 'video-demo-succeeded')).toBe(
      false,
    );
  });

  it('does not resurrect an upload when delete runs after completion reconcile', async () => {
    const { videos, repository, clock } = services();
    const created = await videos.createVideo({ userId: DEMO_USER_ID, input });
    await videos.startUpload({ userId: DEMO_USER_ID, videoId: created.id });
    clock.advance(DEFAULT_UPLOAD_DURATION_MS);

    await videos.deleteVideo({ userId: DEMO_USER_ID, videoId: created.id });
    const snapshot = await repository.getSnapshot();

    expect(snapshot.videos.some(({ id }) => id === created.id)).toBe(false);
    expect(snapshot.analysisTasks.some(({ videoId }) => videoId === created.id)).toBe(false);
  });

  it('does not partially write an already-aborted create', async () => {
    const { videos } = services();
    const controller = new AbortController();
    controller.abort();
    await expect(
      videos.createVideo({ userId: DEMO_USER_ID, input, signal: controller.signal }),
    ).rejects.toThrow('aborted');
    expect(
      (await videos.listVideos({ userId: DEMO_USER_ID })).some(({ title }) => title === '新训练'),
    ).toBe(false);
  });

  it('returns success when Abort happens after persistence has started', async () => {
    const { videos, repository, storage } = services();
    await repository.getSnapshot();
    const gate = storage.blockNextWrite();
    const controller = new AbortController();
    const operation = videos.createVideo({
      userId: DEMO_USER_ID,
      input,
      signal: controller.signal,
    });
    await gate.started;
    controller.abort();
    gate.release();

    const created = await operation;
    expect(created.title).toBe('新训练');
    expect((await repository.getSnapshot()).videos.some(({ id }) => id === created.id)).toBe(true);
  });
});

describe('MockAnalysisService', () => {
  it('only starts uploaded videos and keeps a single active task', async () => {
    const { videos, analysis } = services();
    const idle = await videos.createVideo({ userId: DEMO_USER_ID, input });
    await expect(
      analysis.startAnalysis({ userId: DEMO_USER_ID, videoId: idle.id }),
    ).rejects.toMatchObject({ code: 'ANALYSIS_NOT_READY' });
    const first = await analysis.startAnalysis({
      userId: DEMO_USER_ID,
      videoId: 'video-demo-processing',
    });
    expect(
      await analysis.startAnalysis({ userId: DEMO_USER_ID, videoId: 'video-demo-processing' }),
    ).toEqual(first);
  });

  it('serializes concurrent analysis starts into one task', async () => {
    const { analysis, repository, clock } = services();
    const now = clock.now().toISOString();
    await repository.update((snapshot) => ({
      ...snapshot,
      videos: [
        ...snapshot.videos,
        createVideo({ id: 'video-concurrent-analysis', createdAt: now, updatedAt: now }),
      ],
    }));
    const [first, second] = await Promise.all([
      analysis.startAnalysis({ userId: DEMO_USER_ID, videoId: 'video-concurrent-analysis' }),
      analysis.startAnalysis({ userId: DEMO_USER_ID, videoId: 'video-concurrent-analysis' }),
    ]);

    expect(first.id).toBe(second.id);
    expect(
      (await repository.getSnapshot()).analysisTasks.filter(
        ({ videoId }) => videoId === 'video-concurrent-analysis',
      ),
    ).toHaveLength(1);
  });

  it('uses the complete deterministic stage sequence', async () => {
    const { analysis, clock } = services();
    const expected = [
      ['queued', 0],
      ['court_detection', 10],
      ['player_detection', 25],
      ['ball_tracking', 45],
      ['trajectory_processing', 65],
      ['event_extraction', 80],
      ['statistics_generation', 92],
      ['completed', 100],
    ] as const;

    for (const [index, [stage, progress]] of expected.entries()) {
      if (index > 0) clock.advance(DEFAULT_ANALYSIS_STAGE_DURATION_MS);
      expect(
        await analysis.getAnalysisTaskByVideoId({
          userId: DEMO_USER_ID,
          videoId: 'video-demo-processing',
        }),
      ).toMatchObject({ stage, progress });
    }
  });

  it('does not move analysis progress backward when the system clock decreases', async () => {
    const { analysis, clock } = services();
    await analysis.getAnalysisTaskByVideoId({
      userId: DEMO_USER_ID,
      videoId: 'video-demo-processing',
    });
    clock.advance(DEFAULT_ANALYSIS_STAGE_DURATION_MS * 3);
    expect(
      await analysis.getAnalysisTaskByVideoId({
        userId: DEMO_USER_ID,
        videoId: 'video-demo-processing',
      }),
    ).toMatchObject({ stage: 'ball_tracking', progress: 45 });
    clock.advance(-DEFAULT_ANALYSIS_STAGE_DURATION_MS * 2);

    expect(
      await analysis.getAnalysisTaskByVideoId({
        userId: DEMO_USER_ID,
        videoId: 'video-demo-processing',
      }),
    ).toMatchObject({ stage: 'ball_tracking', progress: 45 });
  });

  it('restores and catches up active analysis after a repository restart', async () => {
    const context = createTestContext();
    await context.repository.getSnapshot();
    context.clock.advance(DEFAULT_ANALYSIS_STAGE_DURATION_MS * 7);
    const restarted = createTestContext(context.storage, context.clock);
    const analysis = new MockAnalysisService(
      restarted.repository,
      restarted.clock,
      restarted.idGenerator,
    );

    expect(
      await analysis.getAnalysisTaskByVideoId({
        userId: DEMO_USER_ID,
        videoId: 'video-demo-processing',
      }),
    ).toMatchObject({ status: 'succeeded', stage: 'completed' });
  });

  it('advances through the shared stage order and generates one result', async () => {
    const { analysis, clock, repository } = services();
    await analysis.getAnalysisTaskByVideoId({
      userId: DEMO_USER_ID,
      videoId: 'video-demo-processing',
    });
    clock.advance(DEFAULT_ANALYSIS_STAGE_DURATION_MS);
    expect(
      await analysis.getAnalysisTaskByVideoId({
        userId: DEMO_USER_ID,
        videoId: 'video-demo-processing',
      }),
    ).toMatchObject({ stage: 'court_detection', status: 'processing', progress: 10 });
    clock.advance(DEFAULT_ANALYSIS_STAGE_DURATION_MS * 6);
    const completed = await analysis.getAnalysisTaskByVideoId({
      userId: DEMO_USER_ID,
      videoId: 'video-demo-processing',
    });
    const firstResult = await analysis.getAnalysisResultByVideoId({
      userId: DEMO_USER_ID,
      videoId: 'video-demo-processing',
    });
    await repository.getSnapshot();
    const snapshot = await repository.getSnapshot();

    expect(completed).toMatchObject({ stage: 'completed', status: 'succeeded', progress: 100 });
    expect(firstResult?.summary.totalShots).toBe(3);
    expect(firstResult?.summary.totalShots).toBe(firstResult?.shots.length);
    expect(firstResult?.summary.totalRallies).toBe(firstResult?.rallies.length);
    expect(
      snapshot.analysisResults.filter(({ videoId }) => videoId === 'video-demo-processing'),
    ).toHaveLength(1);
  });

  it('fails deterministically at ball tracking', async () => {
    const { repository, analysis, clock } = services();
    const now = clock.now().toISOString();
    await repository.update((snapshot) => {
      const video = createVideo({ id: 'video-runtime-failure', createdAt: now, updatedAt: now });
      return {
        ...snapshot,
        videos: [...snapshot.videos, video],
        analysisTasks: [
          ...snapshot.analysisTasks,
          {
            id: 'task-runtime-failure',
            videoId: video.id,
            status: 'queued',
            stage: 'queued',
            progress: 0,
            retryCount: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
        runtime: {
          ...snapshot.runtime,
          analyses: {
            ...snapshot.runtime.analyses,
            'task-runtime-failure': {
              startedAt: now,
              stageDurationMs: 1_000,
              outcome: 'failed',
              failureStage: 'ball_tracking',
            },
          },
        },
      };
    });
    clock.advance(3_000);
    const failed = await analysis.getAnalysisTaskByVideoId({
      userId: DEMO_USER_ID,
      videoId: 'video-runtime-failure',
    });
    expect(failed).toMatchObject({
      status: 'failed',
      stage: 'ball_tracking',
      errorCode: 'BALL_TRACKING_UNSTABLE',
    });
    expect(
      await analysis.getAnalysisResultByVideoId({
        userId: DEMO_USER_ID,
        videoId: 'video-runtime-failure',
      }),
    ).toBeNull();
  });

  it('retries a failed task in place, clears errors, and eventually succeeds', async () => {
    const { analysis, clock } = services();
    const retried = await analysis.retryAnalysis({
      userId: DEMO_USER_ID,
      videoId: 'video-demo-failed',
    });

    expect(retried).toMatchObject({ id: 'task-demo-failed', status: 'queued', retryCount: 1 });
    expect(retried.errorCode).toBeUndefined();
    clock.advance(DEFAULT_ANALYSIS_STAGE_DURATION_MS * 7);
    expect(
      await analysis.getAnalysisTaskByVideoId({
        userId: DEMO_USER_ID,
        videoId: 'video-demo-failed',
      }),
    ).toMatchObject({ id: 'task-demo-failed', status: 'succeeded' });
    expect(
      await analysis.getAnalysisResultByVideoId({
        userId: DEMO_USER_ID,
        videoId: 'video-demo-failed',
      }),
    ).not.toBeNull();
  });

  it('serializes concurrent retries without incrementing twice', async () => {
    const { analysis } = services();
    const attempts = await Promise.allSettled([
      analysis.retryAnalysis({ userId: DEMO_USER_ID, videoId: 'video-demo-failed' }),
      analysis.retryAnalysis({ userId: DEMO_USER_ID, videoId: 'video-demo-failed' }),
    ]);
    const fulfilled = attempts.find((attempt) => attempt.status === 'fulfilled');

    expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === 'rejected')).toHaveLength(1);
    expect(fulfilled?.status === 'fulfilled' ? fulfilled.value.retryCount : null).toBe(1);
  });
});
