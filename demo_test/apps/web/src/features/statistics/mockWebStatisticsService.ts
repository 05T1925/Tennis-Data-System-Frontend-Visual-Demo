import {
  createWebDemoError,
  normalizeWebDemoError,
  throwIfAborted,
  type WebClock,
  type WebDemoDataRepository,
} from '../demo-data';
import { WEB_DEMO_ADMIN_ID, waitForWebVideoDelay } from '../videos/mockVideoService';
import { aggregateWebOverviewStatistics } from './aggregator';
import type { GetWebOverviewParams, WebStatisticsService } from './types';

export class MockWebStatisticsService implements WebStatisticsService {
  private readonly repository: WebDemoDataRepository;
  private readonly clock: WebClock;
  private readonly delayMs: number;

  constructor(repository: WebDemoDataRepository, clock: WebClock, delayMs = 140) {
    this.repository = repository;
    this.clock = clock;
    this.delayMs = delayMs;
  }

  async getOverview(params: GetWebOverviewParams) {
    if (params.actorUserId.trim() !== WEB_DEMO_ADMIN_ID) {
      throw createWebDemoError('WEB_VIDEO_ACCESS_DENIED', { retryable: false });
    }
    try {
      await waitForWebVideoDelay(this.delayMs, params.signal);
      throwIfAborted(params.signal);
      const snapshot = await this.repository.getSnapshot({ signal: params.signal });
      throwIfAborted(params.signal);
      return aggregateWebOverviewStatistics(snapshot, this.clock.now());
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      throw normalizeWebDemoError(error, 'WEB_STATISTICS_LOAD_FAILED');
    }
  }
}
