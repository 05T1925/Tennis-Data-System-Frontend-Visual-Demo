import { env, mobileApiMode } from '@/config/env';
import { RealAnalysisService } from '@/features/analysis/services/RealAnalysisService';
import { RealAuthService } from '@/features/auth/services/RealAuthService';
import { RealVideoService } from '@/features/videos/services/RealVideoService';

import { createHttpClient } from './http/createHttpClient';
import { createMobileServices, createUnsupportedStatisticsService } from './serviceFactory';
import { mobileAccessTokenStore } from './token/AccessTokenStore';

export const mobileServices = createMobileServices(mobileApiMode, {
  loadMockServices: async () => {
    const { createMockMobileServices } = await import('./mockServices');
    return createMockMobileServices({
      homeScenario: env.homeMockScenario,
      uploadScenario: env.uploadMockScenario,
      videoListScenario: env.videoListMockScenario,
    });
  },
  createRealServices: () => {
    if (mobileApiMode.status !== 'ready' || mobileApiMode.mode !== 'real') {
      throw new Error('Real services require ready Real API config.');
    }
    const httpClient = createHttpClient({
      baseUrl: mobileApiMode.apiBaseUrl,
      fetchImpl: globalThis.fetch.bind(globalThis),
      accessTokenProvider: mobileAccessTokenStore,
    });
    return {
      authService: new RealAuthService(httpClient, mobileAccessTokenStore),
      videoService: new RealVideoService(httpClient),
      analysisService: new RealAnalysisService(httpClient),
      statisticsService: createUnsupportedStatisticsService(),
    };
  },
});
