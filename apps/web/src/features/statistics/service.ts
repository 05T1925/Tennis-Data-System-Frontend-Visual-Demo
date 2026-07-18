import { systemWebClock, webDemoDataRepository } from '../demo-data';
import { MockWebStatisticsService } from './mockWebStatisticsService';

export const webStatisticsClock = systemWebClock;
export const webStatisticsService = new MockWebStatisticsService(
  webDemoDataRepository,
  webStatisticsClock,
);
