import type { HomeMockScenario, UploadMockScenario, VideoListMockScenario } from '@/config/env';
import { MockAnalysisService } from '@/features/analysis/services/MockAnalysisService';
import { MockAuthService } from '@/features/auth/services/MockAuthService';
import { createIdGenerator, demoDataRepository, systemClock } from '@/features/demo-data';
import { MockStatisticsService } from '@/features/statistics/services/MockStatisticsService';
import { MockVideoService } from '@/features/videos/services/MockVideoService';

import type { MobileServiceBundle } from './serviceFactory';

export function createMockMobileServices(options: {
  homeScenario: HomeMockScenario;
  uploadScenario: UploadMockScenario;
  videoListScenario: VideoListMockScenario;
}): MobileServiceBundle {
  return {
    authService: new MockAuthService(),
    videoService: new MockVideoService(
      options.homeScenario,
      demoDataRepository,
      systemClock,
      createIdGenerator(systemClock),
      options.uploadScenario,
      options.videoListScenario,
    ),
    analysisService: new MockAnalysisService(
      demoDataRepository,
      systemClock,
      createIdGenerator(systemClock),
    ),
    statisticsService: new MockStatisticsService(options.homeScenario, demoDataRepository),
  };
}
