import { describe, expect, it } from 'vitest';

import { webDemoDataSnapshotSchema } from '../schemas';
import { createWebDemoSeed } from '../seed';

function parses(value: unknown): boolean {
  return webDemoDataSnapshotSchema.safeParse(value).success;
}

describe('webDemoDataSnapshotSchema', () => {
  it('accepts the deterministic production Seed', () => {
    expect(parses(createWebDemoSeed())).toBe(true);
  });

  it.each([
    ['wrong version', (seed: ReturnType<typeof createWebDemoSeed>) => ({ ...seed, version: 2 })],
    [
      'duplicate video ID',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        videos: [...seed.videos, seed.videos[0]],
      }),
    ],
    [
      'duplicate task ID',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisTasks: [...seed.analysisTasks, seed.analysisTasks[0]],
      }),
    ],
    [
      'missing task video',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisTasks: seed.analysisTasks.map((task, index) =>
          index === 0 ? { ...task, videoId: 'missing' } : task,
        ),
      }),
    ],
    [
      'two tasks for one video',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisTasks: [
          ...seed.analysisTasks,
          {
            ...seed.analysisTasks[1],
            id: 'duplicate-relation',
            videoId: seed.analysisTasks[0].videoId,
          },
        ],
      }),
    ],
    [
      'invalid upload status',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        videos: seed.videos.map((video, index) =>
          index === 0 ? { ...video, uploadStatus: 'unknown' } : video,
        ),
      }),
    ],
    [
      'invalid task status',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisTasks: seed.analysisTasks.map((task, index) =>
          index === 0 ? { ...task, status: 'unknown' } : task,
        ),
      }),
    ],
    [
      'invalid task stage',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisTasks: seed.analysisTasks.map((task, index) =>
          index === 0 ? { ...task, stage: 'unknown' } : task,
        ),
      }),
    ],
    [
      'NaN progress',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        videos: seed.videos.map((video, index) =>
          index === 0 ? { ...video, uploadProgress: Number.NaN } : video,
        ),
      }),
    ],
    [
      'Infinity progress',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisTasks: seed.analysisTasks.map((task, index) =>
          index === 0 ? { ...task, progress: Number.POSITIVE_INFINITY } : task,
        ),
      }),
    ],
    [
      'negative progress',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        videos: seed.videos.map((video, index) =>
          index === 0 ? { ...video, uploadProgress: -1 } : video,
        ),
      }),
    ],
    [
      'progress over 100',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisTasks: seed.analysisTasks.map((task, index) =>
          index === 0 ? { ...task, progress: 101 } : task,
        ),
      }),
    ],
    [
      'invalid date',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        videos: seed.videos.map((video, index) =>
          index === 0 ? { ...video, createdAt: 'not-a-date' } : video,
        ),
      }),
    ],
    [
      'negative file size',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        videos: seed.videos.map((video, index) =>
          index === 0 ? { ...video, fileSizeBytes: -1 } : video,
        ),
      }),
    ],
    [
      'negative duration',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        videos: seed.videos.map((video, index) =>
          index === 0 ? { ...video, durationSeconds: -1 } : video,
        ),
      }),
    ],
    [
      'invalid succeeded task',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisTasks: seed.analysisTasks.map((task) =>
          task.status === 'succeeded' ? { ...task, progress: 99 } : task,
        ),
      }),
    ],
    [
      'failed task without error',
      (seed: ReturnType<typeof createWebDemoSeed>) => ({
        ...seed,
        analysisTasks: seed.analysisTasks.map((task) =>
          task.status === 'failed'
            ? { ...task, errorCode: undefined, errorMessage: undefined }
            : task,
        ),
      }),
    ],
  ])('rejects %s', (_, mutate) => {
    expect(parses(mutate(createWebDemoSeed()))).toBe(false);
  });
});
