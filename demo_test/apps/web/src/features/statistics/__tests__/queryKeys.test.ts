import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { webAnalysisQueryKeys } from '../../analysis/queryKeys';
import { applyWebDemoBundleCache, applyWebDemoResetCache } from '../../demo-control/cache';
import { webDemoControlMutationKeys } from '../../demo-control/queryKeys';
import { DefaultWebDemoDataRepository } from '../../demo-data';
import { MemoryWebDemoDataStorage } from '../../demo-data/__tests__/testUtils';
import { webVideoQueryKeys } from '../../videos/queryKeys';
import { aggregateWebOverviewStatistics } from '../aggregator';
import { getWebOverviewPollingInterval, webStatisticsQueryKeys } from '../queryKeys';

describe('Overview Query and cache policy', () => {
  it('creates actor/date-scoped canonical keys and mutation keys', () => {
    expect(webStatisticsQueryKeys.overview('admin', '2026-07-18')).toEqual([
      'web-statistics',
      'overview',
      'admin',
      '2026-07-18',
    ]);
    expect(webDemoControlMutationKeys.create('admin', 'processing')).toEqual([
      'web-demo-control',
      'create',
      'admin',
      'processing',
    ]);
  });

  it('polls only successful overview data with active Runtime', () => {
    const data = aggregateWebOverviewStatistics(
      {
        version: 2,
        videos: [],
        analysisTasks: [],
        analysisResults: [],
        cvDemoOutputs: [],
        analysisLogs: [],
        analysisRuntimes: {},
      },
      new Date('2026-07-18T12:00:00.000Z'),
    );
    data.runtimeActiveCount = 1;
    expect(getWebOverviewPollingInterval(data, false)).toBe(2_000);
    expect(getWebOverviewPollingInterval({ ...data, runtimeActiveCount: 0 }, false)).toBe(false);
    expect(getWebOverviewPollingInterval(data, true)).toBe(false);
    expect(getWebOverviewPollingInterval(undefined, false)).toBe(false);
  });

  it('writes only complete Bundle entities to exact cache keys', async () => {
    const client = new QueryClient();
    const repository = new DefaultWebDemoDataRepository(new MemoryWebDemoDataStorage());
    const bundle = await repository.createDemoScenario('success');
    await applyWebDemoBundleCache(client, 'admin', bundle);
    const videoId = bundle.videoRecord.video.id;
    expect(client.getQueryData(webVideoQueryKeys.detail('admin', videoId))).toEqual(
      bundle.videoRecord,
    );
    expect(client.getQueryData(webAnalysisQueryKeys.task('admin', videoId))).toEqual(
      bundle.taskState,
    );
    expect(client.getQueryData(webAnalysisQueryKeys.result('admin', videoId))).toEqual(
      bundle.result,
    );
    expect(client.getQueryData(webAnalysisQueryKeys.cv('admin', videoId))).toEqual(bundle.cv);
    expect(client.getQueryData(webAnalysisQueryKeys.logsByVideo('admin', videoId))).toEqual(
      bundle.logs,
    );
  });

  it('removes only Web video/analysis queries on reset and preserves unrelated cache', async () => {
    const client = new QueryClient();
    client.setQueryData(webVideoQueryKeys.detail('admin', 'video'), { value: 'video' });
    client.setQueryData(webAnalysisQueryKeys.task('admin', 'video'), { value: 'task' });
    client.setQueryData(['unrelated-auth'], { value: 'session' });
    await applyWebDemoResetCache(client);
    expect(client.getQueryData(webVideoQueryKeys.detail('admin', 'video'))).toBeUndefined();
    expect(client.getQueryData(webAnalysisQueryKeys.task('admin', 'video'))).toBeUndefined();
    expect(client.getQueryData(['unrelated-auth'])).toEqual({ value: 'session' });
  });
});
