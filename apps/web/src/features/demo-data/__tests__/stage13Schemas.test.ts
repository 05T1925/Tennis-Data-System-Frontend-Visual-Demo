import { describe, expect, it } from 'vitest';

import { webDemoDataSnapshotV1Schema, webDemoDataSnapshotV2Schema } from '../schemas';
import { GENERIC_ANALYSIS_FAILURE_MESSAGE, getSafeAnalysisFailureMessage } from '../safety';
import { createWebDemoSeed } from '../seed';

describe('stage 13 Snapshot schemas', () => {
  it('keeps safe Chinese failures and replaces unsafe or empty details', () => {
    expect(getSafeAnalysisFailureMessage(' 球体检测失败，请调整拍摄角度。 ')).toBe(
      '球体检测失败，请调整拍摄角度。',
    );
    for (const value of [
      undefined,
      '',
      'See https://internal.example/task/1',
      'Failed at C:\\private\\worker.ts:42',
      'Error: failed\n    at run (src/worker.ts:42:1)',
      'access token: secret-value',
      'technicalMessage: worker crashed',
    ]) {
      expect(getSafeAnalysisFailureMessage(value)).toBe(GENERIC_ANALYSIS_FAILURE_MESSAGE);
    }
  });

  it('accepts v1 and the deterministic v2 Seed', () => {
    const seed = createWebDemoSeed();
    expect(
      webDemoDataSnapshotV1Schema.safeParse({
        version: 1,
        videos: seed.videos,
        analysisTasks: seed.analysisTasks,
      }).success,
    ).toBe(true);
    expect(webDemoDataSnapshotV2Schema.safeParse(seed).success).toBe(true);
  });

  it.each([
    [
      'orphan Result',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisResults: [{ ...seed.analysisResults[0], videoId: 'missing' }],
      }),
    ],
    [
      'duplicate Result video',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisResults: [
          ...seed.analysisResults,
          { ...seed.analysisResults[0], id: 'another-result' },
        ],
      }),
    ],
    [
      'invalid Shot relation',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisResults: seed.analysisResults.map((result, index) =>
          index === 0
            ? {
                ...result,
                shots: result.shots.map((shot, shotIndex) =>
                  shotIndex === 0 ? { ...shot, rallyId: 'missing' } : shot,
                ),
              }
            : result,
        ),
      }),
    ],
    [
      'orphan CV',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        cvDemoOutputs: seed.cvDemoOutputs.map((cv, index) =>
          index === 0 ? { ...cv, taskId: 'missing' } : cv,
        ),
      }),
    ],
    [
      'orphan Log',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisLogs: [
          ...seed.analysisLogs,
          {
            id: 'orphan-log',
            taskId: 'missing',
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            audience: 'user',
            userMessage: 'Safe message',
          },
        ],
      }),
    ],
    [
      'unsafe Log',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisLogs: seed.analysisLogs.map((log, index) =>
          index === 0 ? { ...log, userMessage: 'stack at C:\\secret\\video.mp4' } : log,
        ),
      }),
    ],
    [
      'terminal Runtime',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisRuntimes: {
          [seed.analysisTasks[0].id]: {
            taskId: seed.analysisTasks[0].id,
            attempt: 0,
            queuedAt: seed.analysisTasks[0].createdAt,
          },
        },
      }),
    ],
  ])('rejects %s', (_, mutate) => {
    expect(webDemoDataSnapshotV2Schema.safeParse(mutate(createWebDemoSeed())).success).toBe(false);
  });

  it('rejects a CV output above the 512 KiB bound', () => {
    const seed = createWebDemoSeed();
    const oversized = {
      ...seed,
      cvDemoOutputs: seed.cvDemoOutputs.map((cv, index) =>
        index === 0
          ? {
              ...cv,
              output: {
                ...cv.output,
                payload: { ...cv.output.payload, metadata: { payload: 'x'.repeat(530_000) } },
              },
            }
          : cv,
      ),
    };
    expect(webDemoDataSnapshotV2Schema.safeParse(oversized).success).toBe(false);
  });

  it('accepts the legal partial Result/CV fixture', () => {
    const seed = createWebDemoSeed();
    const result = seed.analysisResults.find(({ videoId }) => videoId === 'video-web-demo-11');
    const cv = seed.cvDemoOutputs.find(({ output }) => output.videoId === 'video-web-demo-11');
    expect(result?.points).toBeUndefined();
    expect(result?.playerProfile).toBeUndefined();
    expect(cv?.output.payload.courtKeypoints).toBeUndefined();
    expect(webDemoDataSnapshotV2Schema.safeParse(seed).success).toBe(true);
  });
});
