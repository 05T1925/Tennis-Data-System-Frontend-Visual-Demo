import type { AppError } from '@tennis/shared-types';

import type { HomeMockScenario } from '@/config/env';
import type { DemoDataRepository } from '@/features/demo-data/DemoDataRepository';
import { waitForDemoDelay } from '@/features/demo-data/errors';
import { DEMO_USER_ID } from '@/features/demo-data/types';

import type { HomeOverview } from '../types';
import type { GetHomeOverviewOptions, StatisticsService } from './StatisticsService';

const MOCK_DELAY_MS = 700;
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

function count(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export class MockStatisticsService implements StatisticsService {
  private failedFirstRequest = false;

  constructor(
    private readonly scenario: HomeMockScenario,
    private readonly repository: DemoDataRepository,
  ) {}

  async getHomeOverview({ userId, signal }: GetHomeOverviewOptions): Promise<HomeOverview> {
    await waitForDemoDelay(MOCK_DELAY_MS, signal);
    const normalizedUserId = userId.trim();
    const snapshot = await this.repository.getSnapshot({ signal });
    const videos = snapshot.videos.filter((video) => video.userId === normalizedUserId);
    if (normalizedUserId !== DEMO_USER_ID) return { ...emptyOverview };
    const shouldFail = this.scenario === 'error' || this.scenario === 'statistics-error';
    if (shouldFail && !this.failedFirstRequest) {
      this.failedFirstRequest = true;
      throw createStatisticsError();
    }
    if (this.scenario === 'empty') return { ...emptyOverview };

    const videoIds = new Set(videos.map(({ id }) => id));
    const results = snapshot.analysisResults.filter((result) => videoIds.has(result.videoId));
    const successful = snapshot.analysisTasks
      .filter((task) => videoIds.has(task.videoId) && task.status === 'succeeded')
      .map((task) => ({
        task,
        result: results.find((result) => result.videoId === task.videoId),
      }))
      .filter((entry): entry is typeof entry & { result: NonNullable<typeof entry.result> } =>
        Boolean(entry.result),
      )
      .sort((left, right) => {
        const leftTime = Date.parse(left.task.completedAt ?? left.result.createdAt);
        const rightTime = Date.parse(right.task.completedAt ?? right.result.createdAt);
        return (
          (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0)
        );
      });
    const latest = successful[0];
    const latestVideo = latest
      ? videos.find((video) => video.id === latest.task.videoId)
      : undefined;

    return {
      totalVideos: videos.length,
      totalShots: results.reduce((total, result) => total + count(result.summary.totalShots), 0),
      totalRallies: results.reduce(
        (total, result) => total + count(result.summary.totalRallies),
        0,
      ),
      totalTrainingDurationMs: videos.reduce(
        (total, video) => total + count((video.durationSeconds ?? 0) * 1_000),
        0,
      ),
      latestAnalysis:
        latest && latestVideo
          ? {
              videoId: latestVideo.id,
              videoTitle: latestVideo.title.trim() || '未命名训练',
              analyzedAt: latest.task.completedAt ?? latest.result.createdAt,
              analysisStatus: latest.task.status,
              totalShots: count(latest.result.summary.totalShots),
              totalRallies: count(latest.result.summary.totalRallies),
            }
          : null,
    };
  }
}
