import { env } from '@/config/env';
import { demoDataRepository } from '@/features/demo-data';

import { MockStatisticsService } from './services/MockStatisticsService';

export type { GetHomeOverviewOptions, StatisticsService } from './services/StatisticsService';
export { MockStatisticsService } from './services/MockStatisticsService';
export type { HomeOverview, LatestAnalysisSummary } from './types';

export const statisticsService = new MockStatisticsService(
  env.homeMockScenario,
  demoDataRepository,
);
