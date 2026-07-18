import { mobileServices } from '@/api/mobileServices';

export type { GetHomeOverviewOptions, StatisticsService } from './services/StatisticsService';
export { MockStatisticsService } from './services/MockStatisticsService';
export type { HomeOverview, LatestAnalysisSummary } from './types';

export const statisticsService = mobileServices.statisticsService;
