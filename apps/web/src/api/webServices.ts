import { env, webApiMode } from '../config/env';
import { RealWebAnalysisService } from '../features/analysis/realWebAnalysisService';
import { RealWebAuthService } from '../features/auth/RealWebAuthService';
import { RealWebVideoService } from '../features/videos/realWebVideoService';
import { createHttpClient } from './http';
import { createUnsupportedWebStatisticsService, createWebServices } from './serviceFactory';
import { webAccessTokenStore } from './token/AccessTokenStore';

export const webServices = createWebServices(webApiMode, {
  loadMockServices: async () => {
    const { createMockWebServices } = await import('./mockServices');
    return createMockWebServices(env.webVideoMockScenario);
  },
  createRealServices: () => {
    if (webApiMode.status !== 'ready' || webApiMode.mode !== 'real') {
      throw new Error('Real services require ready Real API config.');
    }
    const httpClient = createHttpClient({
      baseUrl: webApiMode.apiBaseUrl,
      fetchImpl: globalThis.fetch.bind(globalThis),
      accessTokenProvider: webAccessTokenStore,
    });
    return {
      webAuthService: new RealWebAuthService(httpClient, webAccessTokenStore),
      webVideoService: new RealWebVideoService(httpClient),
      webAnalysisService: new RealWebAnalysisService(httpClient),
      webStatisticsService: createUnsupportedWebStatisticsService(),
    };
  },
});
