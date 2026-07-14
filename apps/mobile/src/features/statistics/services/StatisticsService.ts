import type { HomeOverview } from '../types';

export interface GetHomeOverviewOptions {
  userId: string;
  signal?: AbortSignal;
}

export interface StatisticsService {
  getHomeOverview(options: GetHomeOverviewOptions): Promise<HomeOverview>;
}
