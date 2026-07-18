import { describe, expect, it } from 'vitest';

import { createWebDemoSeed, type WebDemoDataSnapshot } from '../../demo-data';
import { aggregateWebOverviewStatistics } from '../aggregator';

const reference = new Date('2026-06-24T12:00:00.000Z');

function emptySnapshot(): WebDemoDataSnapshot {
  return {
    version: 2,
    videos: [],
    analysisTasks: [],
    analysisResults: [],
    cvDemoOutputs: [],
    analysisLogs: [],
    analysisRuntimes: {},
  };
}

describe('aggregateWebOverviewStatistics', () => {
  it('returns a complete safe empty View Model', () => {
    const result = aggregateWebOverviewStatistics(emptySnapshot(), reference);
    expect(result.metrics).toEqual({
      totalVideos: 0,
      todayCreatedVideos: 0,
      waitingForAnalysis: 0,
      processing: 0,
      succeeded: 0,
      failed: 0,
      averageAnalysisDurationSeconds: null,
      averageAnalysisDurationSampleCount: 0,
    });
    expect(result.uploadTrend).toHaveLength(7);
    expect(result.successRate).toEqual({ succeeded: 0, failed: 0, denominator: 0, rate: null });
  });

  it('computes the seven metrics and 60% Seed success rate', () => {
    const result = aggregateWebOverviewStatistics(createWebDemoSeed(), reference);
    expect(result.metrics).toMatchObject({
      totalVideos: 24,
      todayCreatedVideos: 1,
      waitingForAnalysis: 5,
      processing: 3,
      succeeded: 3,
      failed: 2,
      averageAnalysisDurationSeconds: 420,
      averageAnalysisDurationSampleCount: 3,
    });
    expect(result.successRate).toEqual({ succeeded: 3, failed: 2, denominator: 5, rate: 0.6 });
  });

  it('uses left-closed/right-open local today boundaries and ignores invalid dates', () => {
    const seed = createWebDemoSeed();
    const boundsReference = new Date(2026, 5, 18, 12, 0, 0);
    const start = new Date(2026, 5, 18, 0, 0, 0).toISOString();
    const next = new Date(2026, 5, 19, 0, 0, 0).toISOString();
    for (const video of seed.videos) video.createdAt = 'invalid';
    seed.videos[0].createdAt = start;
    seed.videos[1].createdAt = next;
    seed.videos[2].createdAt = 'invalid';
    expect(aggregateWebOverviewStatistics(seed, boundsReference).metrics.todayCreatedVideos).toBe(
      1,
    );
  });

  it('skips invalid, reversed and non-succeeded duration samples', () => {
    const seed = createWebDemoSeed();
    const succeeded = seed.analysisTasks.filter(({ status }) => status === 'succeeded');
    succeeded[0].startedAt = 'invalid';
    succeeded[1].startedAt = '2026-06-11T11:00:00.000Z';
    succeeded[1].completedAt = '2026-06-11T10:00:00.000Z';
    const result = aggregateWebOverviewStatistics(seed, reference);
    expect(result.metrics.averageAnalysisDurationSampleCount).toBe(1);
    expect(result.metrics.averageAnalysisDurationSeconds).toBe(420);
  });

  it('fills seven local days from oldest to newest across month and year boundaries', () => {
    const december = aggregateWebOverviewStatistics(
      emptySnapshot(),
      new Date(2026, 0, 3, 12, 0, 0),
    );
    expect(december.uploadTrend.map(({ dateKey }) => dateKey)).toEqual([
      '2025-12-28',
      '2025-12-29',
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ]);
    expect(december.uploadTrend.every(({ count }) => count === 0)).toBe(true);
  });

  it('assigns every Seed video to exactly one of ten status buckets', () => {
    const result = aggregateWebOverviewStatistics(createWebDemoSeed(), reference);
    expect(result.statusDistribution).toHaveLength(10);
    expect(result.statusDistribution.reduce((sum, item) => sum + item.count, 0)).toBe(24);
    expect(result.statusDistribution.find(({ bucket }) => bucket === 'upload_failed')?.count).toBe(
      2,
    );
    expect(
      result.statusDistribution.find(({ bucket }) => bucket === 'analysis_failed')?.count,
    ).toBe(2);
    expect(
      result.statusDistribution.find(({ bucket }) => bucket === 'task_not_created')?.count,
    ).toBe(3);
  });

  it('uses all six duration buckets including zero and defensive invalid values', () => {
    const seed = createWebDemoSeed();
    seed.videos[0].durationSeconds = undefined;
    seed.videos[1].durationSeconds = Number.NaN;
    seed.videos[2].durationSeconds = Number.POSITIVE_INFINITY;
    seed.videos[3].durationSeconds = -1;
    seed.videos[4].durationSeconds = 0;
    const result = aggregateWebOverviewStatistics(seed, reference);
    expect(result.durationDistribution).toHaveLength(6);
    expect(result.durationDistribution.reduce((sum, item) => sum + item.count, 0)).toBe(24);
    expect(result.durationDistribution.find(({ bucket }) => bucket === 'unconfirmed')?.count).toBe(
      4,
    );
    expect(
      result.durationDistribution.find(({ bucket }) => bucket === 'under_1_minute')?.count,
    ).toBeGreaterThan(0);
  });

  it('sorts and truncates recent lists with ID tie-breakers and safe failure reasons', () => {
    const seed = createWebDemoSeed();
    seed.videos[0].createdAt = seed.videos[1].createdAt;
    const failedTask = seed.analysisTasks.find(({ status }) => status === 'failed');
    if (!failedTask) throw new Error('Missing failed fixture.');
    failedTask.errorMessage = 'token: unsafe-value';
    const result = aggregateWebOverviewStatistics(seed, reference);
    expect(result.recentUploads).toHaveLength(5);
    expect(result.recentFailures.length).toBeLessThanOrEqual(5);
    expect(result.activeTasks).toHaveLength(5);
    expect(
      result.recentFailures.find(({ failureType }) => failureType === 'analysis')?.safeReason,
    ).not.toContain('token');
  });

  it('keeps the recent active list at five while exposing every controllable task', () => {
    const seed = createWebDemoSeed();
    const sourceTask = seed.analysisTasks.find(
      ({ status }) => status === 'queued' || status === 'processing',
    );
    if (!sourceTask) throw new Error('Missing active task fixture.');
    const sourceVideo = seed.videos.find(({ id }) => id === sourceTask.videoId);
    if (!sourceVideo) throw new Error('Missing active video fixture.');

    for (let index = 0; index < 2; index += 1) {
      const videoId = `video-extra-active-${index}`;
      seed.videos.push({
        ...sourceVideo,
        id: videoId,
        title: `Extra active ${index}`,
      });
      seed.analysisTasks.push({
        ...sourceTask,
        id: `task-extra-active-${index}`,
        videoId,
        updatedAt: `2000-01-0${index + 1}T00:00:00.000Z`,
      });
    }
    const before = JSON.stringify(seed);
    const result = aggregateWebOverviewStatistics(seed, reference);

    expect(result.controllableTasks.length).toBeGreaterThan(5);
    expect(result.activeTasks).toHaveLength(5);
    expect(result.activeTasks).toEqual(result.controllableTasks.slice(0, 5));
    expect(result.controllableTasks.map(({ taskId }) => taskId)).toContain('task-extra-active-0');
    expect(new Set(result.controllableTasks.map(({ taskId }) => taskId)).size).toBe(
      result.controllableTasks.length,
    );
    expect(new Set(result.controllableTasks.map(({ videoId }) => videoId)).size).toBe(
      result.controllableTasks.length,
    );
    expect(JSON.stringify(seed)).toBe(before);
  });

  it('does not mutate the input Snapshot', () => {
    const seed = createWebDemoSeed();
    const before = JSON.stringify(seed);
    aggregateWebOverviewStatistics(seed, reference);
    expect(JSON.stringify(seed)).toBe(before);
  });
});
