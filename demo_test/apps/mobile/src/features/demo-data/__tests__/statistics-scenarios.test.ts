import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MockAnalysisService } from '../../analysis/services/MockAnalysisService';
import { MockStatisticsService } from '../../statistics/services/MockStatisticsService';
import { MockVideoService } from '../../videos/services/MockVideoService';
import { DEMO_USER_ID } from '../types';
import { createTestContext } from './testUtils';

async function advance<T>(promise: Promise<T>, milliseconds = 700) {
  void promise.catch(() => undefined);
  await vi.advanceTimersByTimeAsync(milliseconds);
  return promise;
}

function scenarioServices(
  scenario: 'success' | 'empty' | 'error' | 'video-error' | 'statistics-error',
) {
  const context = createTestContext();
  return {
    ...context,
    videos: new MockVideoService(scenario, context.repository, context.clock, context.idGenerator),
    analysis: new MockAnalysisService(context.repository, context.clock, context.idGenerator),
    statistics: new MockStatisticsService(scenario, context.repository),
  };
}

describe('dynamic statistics and home scenarios', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('aggregates current-user Repository data and selects latest successful result', async () => {
    const { statistics } = scenarioServices('success');
    const overview = await advance(statistics.getHomeOverview({ userId: DEMO_USER_ID }));

    expect(overview).toMatchObject({ totalVideos: 4, totalShots: 3, totalRallies: 1 });
    expect(overview.totalTrainingDurationMs).toBe(2_880_000);
    expect(overview.latestAnalysis?.videoId).toBe('video-demo-succeeded');
  });

  it('reflects deletion and reset without a second statistics data source', async () => {
    const { statistics, videos, repository } = scenarioServices('success');
    await videos.deleteVideo({ userId: DEMO_USER_ID, videoId: 'video-demo-succeeded' });
    const afterDelete = await advance(statistics.getHomeOverview({ userId: DEMO_USER_ID }));
    await repository.reset();
    const afterReset = await advance(statistics.getHomeOverview({ userId: DEMO_USER_ID }));

    expect(afterDelete).toMatchObject({
      totalVideos: 3,
      totalShots: 0,
      totalRallies: 0,
      latestAnalysis: null,
    });
    expect(afterReset).toMatchObject({ totalVideos: 4, totalShots: 3, totalRallies: 1 });
  });

  it('reflects a newly completed analysis result', async () => {
    const { statistics, analysis, clock } = scenarioServices('success');
    await analysis.getAnalysisTaskByVideoId({
      userId: DEMO_USER_ID,
      videoId: 'video-demo-processing',
    });
    const before = await advance(statistics.getHomeOverview({ userId: DEMO_USER_ID }));
    clock.advance(7_000);
    const after = await advance(statistics.getHomeOverview({ userId: DEMO_USER_ID }));

    expect(before.totalShots).toBe(3);
    expect(after.totalShots).toBe(6);
    expect(after.latestAnalysis?.videoId).toBe('video-demo-processing');
  });

  it('keeps empty isolated from the Repository', async () => {
    const { statistics, videos, repository } = scenarioServices('empty');
    expect(await advance(videos.getRecentVideos({ userId: DEMO_USER_ID }))).toEqual([]);
    expect(await advance(statistics.getHomeOverview({ userId: DEMO_USER_ID }))).toMatchObject({
      totalVideos: 0,
    });
    expect((await repository.getSnapshot()).videos).toHaveLength(4);
  });

  it.each([
    ['error', true, true],
    ['video-error', true, false],
    ['statistics-error', false, true],
  ] as const)(
    '%s fails only the intended first valid home requests',
    async (scenario, videoFails, statisticsFails) => {
      const { videos, statistics } = scenarioServices(scenario);
      const firstVideo = advance(videos.getRecentVideos({ userId: DEMO_USER_ID }));
      const firstStatistics = advance(statistics.getHomeOverview({ userId: DEMO_USER_ID }));

      if (videoFails)
        await expect(firstVideo).rejects.toMatchObject({ code: 'MOCK_VIDEO_QUERY_FAILED' });
      else await expect(firstVideo).resolves.toHaveLength(3);
      if (statisticsFails)
        await expect(firstStatistics).rejects.toMatchObject({
          code: 'MOCK_STATISTICS_QUERY_FAILED',
        });
      else await expect(firstStatistics).resolves.toMatchObject({ totalVideos: 4 });

      await expect(advance(videos.getRecentVideos({ userId: DEMO_USER_ID }))).resolves.toHaveLength(
        3,
      );
      await expect(
        advance(statistics.getHomeOverview({ userId: DEMO_USER_ID })),
      ).resolves.toMatchObject({ totalVideos: 4 });
    },
  );

  it('unknown users and Abort do not consume first-failure state', async () => {
    const { videos, statistics } = scenarioServices('error');
    expect(await advance(videos.getRecentVideos({ userId: 'unknown' }))).toEqual([]);
    expect(await advance(statistics.getHomeOverview({ userId: 'unknown' }))).toMatchObject({
      totalVideos: 0,
    });
    const controller = new AbortController();
    const aborted = videos.getRecentVideos({ userId: DEMO_USER_ID, signal: controller.signal });
    controller.abort();
    await expect(aborted).rejects.toThrow('aborted');
    await expect(advance(videos.getRecentVideos({ userId: DEMO_USER_ID }))).rejects.toMatchObject({
      code: 'MOCK_VIDEO_QUERY_FAILED',
    });
    await expect(
      advance(statistics.getHomeOverview({ userId: DEMO_USER_ID })),
    ).rejects.toMatchObject({ code: 'MOCK_STATISTICS_QUERY_FAILED' });
  });
});
