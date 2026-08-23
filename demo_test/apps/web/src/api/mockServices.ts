import { MockWebAnalysisService } from '../features/analysis/mockWebAnalysisService';
import { MockWebAuthService } from '../features/auth/MockWebAuthService';
import { systemWebClock, webDemoDataRepository } from '../features/demo-data';
import { MockWebStatisticsService } from '../features/statistics/mockWebStatisticsService';
import { MockWebVideoService } from '../features/videos/mockVideoService';
import type { WebVideoMockScenario } from '../config/env';
import type { WebServiceBundle } from './serviceFactory';

export function createMockWebServices(scenario: WebVideoMockScenario): WebServiceBundle {
  return {
    webAuthService: new MockWebAuthService(),
    webVideoService: new MockWebVideoService(webDemoDataRepository, scenario),
    webAnalysisService: new MockWebAnalysisService(webDemoDataRepository),
    webStatisticsService: new MockWebStatisticsService(webDemoDataRepository, systemWebClock),
  };
}
