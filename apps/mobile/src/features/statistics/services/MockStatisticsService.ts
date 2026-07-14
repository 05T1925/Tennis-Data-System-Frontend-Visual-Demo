import type { AppError } from '@tennis/shared-types';

import type { HomeMockScenario } from '@/config/env';

import type { HomeOverview, LatestAnalysisSummary } from '../types';
import type { GetHomeOverviewOptions, StatisticsService } from './StatisticsService';

const MOCK_DELAY_MS = 700;
const DEMO_USER_ID = 'demo-user-local';

const successOverview: HomeOverview = {
  totalVideos: 12,
  totalShots: 1_286,
  totalRallies: 184,
  totalTrainingDurationMs: 8 * 60 * 60_000 + 47 * 60_000,
  latestAnalysis: {
    videoId: 'video-morning-training',
    videoTitle: '周二上午底线训练',
    analyzedAt: '2026-07-14T02:05:00.000Z',
    analysisStatus: 'succeeded',
    totalShots: 236,
    totalRallies: 34,
  },
};

const emptyOverview: HomeOverview = {
  totalVideos: 0,
  totalShots: 0,
  totalRallies: 0,
  totalTrainingDurationMs: 0,
  latestAnalysis: null,
};

function createStatisticsError(): AppError {
  return {
    code: 'MOCK_STATISTICS_QUERY_FAILED',
    userMessage: '训练统计暂时加载失败，请重试。',
    technicalMessage: 'Deterministic first-request failure from MockStatisticsService.',
    retryable: true,
  };
}

function waitForMockDelay(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Mock statistics request aborted.'));
      return;
    }

    const onAbort = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
      reject(new Error('Mock statistics request aborted.'));
    };
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, MOCK_DELAY_MS);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function normalizeCount(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function normalizeTitle(value: string) {
  return value.trim() || '未命名训练';
}

function normalizeDate(value: string | null) {
  if (!value) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function normalizeLatestAnalysis(
  latestAnalysis: LatestAnalysisSummary | null,
): LatestAnalysisSummary | null {
  if (!latestAnalysis) return null;

  return {
    ...latestAnalysis,
    videoId: latestAnalysis.videoId.trim(),
    videoTitle: normalizeTitle(latestAnalysis.videoTitle),
    analyzedAt: normalizeDate(latestAnalysis.analyzedAt),
    totalShots: normalizeCount(latestAnalysis.totalShots),
    totalRallies: normalizeCount(latestAnalysis.totalRallies),
  };
}

function normalizeOverview(overview: HomeOverview): HomeOverview {
  return {
    totalVideos: normalizeCount(overview.totalVideos),
    totalShots: normalizeCount(overview.totalShots),
    totalRallies: normalizeCount(overview.totalRallies),
    totalTrainingDurationMs: normalizeCount(overview.totalTrainingDurationMs),
    latestAnalysis: normalizeLatestAnalysis(overview.latestAnalysis),
  };
}

export class MockStatisticsService implements StatisticsService {
  private failedFirstRequest = false;

  constructor(private readonly scenario: HomeMockScenario) {}

  async getHomeOverview({ userId, signal }: GetHomeOverviewOptions): Promise<HomeOverview> {
    await waitForMockDelay(signal);

    if (userId.trim() !== DEMO_USER_ID) return normalizeOverview(emptyOverview);

    const shouldFail = this.scenario === 'error' || this.scenario === 'statistics-error';
    if (shouldFail && !this.failedFirstRequest) {
      this.failedFirstRequest = true;
      throw createStatisticsError();
    }

    return normalizeOverview(this.scenario === 'empty' ? emptyOverview : successOverview);
  }
}
