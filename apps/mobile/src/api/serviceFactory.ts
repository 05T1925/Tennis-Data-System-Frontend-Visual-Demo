import type { AppError } from '@tennis/shared-types';

import type { AnalysisService } from '@/features/analysis/services/AnalysisService';
import type { AuthService } from '@/features/auth/services/AuthService';
import type { StatisticsService } from '@/features/statistics/services/StatisticsService';
import type { VideoService } from '@/features/videos/services/VideoService';

import type { ApiModeConfig } from './config/apiMode';
import { createApiError } from './errors';
import type { HttpClient } from './http/HttpClient';
import type { AccessTokenStore } from './token/AccessTokenStore';

export type MobileServiceBundle = {
  authService: AuthService;
  videoService: VideoService;
  analysisService: AnalysisService;
  statisticsService: StatisticsService;
};

type FactoryDependencies = {
  loadMockServices: () => Promise<MobileServiceBundle>;
  createRealServices: () => MobileServiceBundle;
};

function unconfiguredServices(error: AppError): MobileServiceBundle {
  const reject = () => Promise.reject(error);
  return {
    authService: { login: reject, restore: reject, logout: reject },
    videoService: {
      getRecentVideos: reject,
      listVideos: reject,
      getVideoById: reject,
      createVideo: reject,
      startUpload: reject,
      deleteVideo: reject,
    },
    analysisService: {
      startAnalysis: reject,
      getAnalysisTaskByVideoId: reject,
      getAnalysisResultByVideoId: reject,
      retryAnalysis: reject,
    },
    statisticsService: { getHomeOverview: reject },
  };
}

function lazyServices(loader: () => Promise<MobileServiceBundle>): MobileServiceBundle {
  let selected: Promise<MobileServiceBundle> | null = null;
  const get = () => {
    selected ??= loader();
    return selected;
  };
  return {
    authService: {
      login: (...args) => get().then(({ authService }) => authService.login(...args)),
      restore: (...args) => get().then(({ authService }) => authService.restore(...args)),
      logout: (...args) => get().then(({ authService }) => authService.logout(...args)),
    },
    videoService: {
      getRecentVideos: (...args) =>
        get().then(({ videoService }) => videoService.getRecentVideos(...args)),
      listVideos: (...args) => get().then(({ videoService }) => videoService.listVideos(...args)),
      getVideoById: (...args) =>
        get().then(({ videoService }) => videoService.getVideoById(...args)),
      createVideo: (...args) => get().then(({ videoService }) => videoService.createVideo(...args)),
      startUpload: (...args) => get().then(({ videoService }) => videoService.startUpload(...args)),
      deleteVideo: (...args) => get().then(({ videoService }) => videoService.deleteVideo(...args)),
    },
    analysisService: {
      startAnalysis: (...args) =>
        get().then(({ analysisService }) => analysisService.startAnalysis(...args)),
      getAnalysisTaskByVideoId: (...args) =>
        get().then(({ analysisService }) => analysisService.getAnalysisTaskByVideoId(...args)),
      getAnalysisResultByVideoId: (...args) =>
        get().then(({ analysisService }) => analysisService.getAnalysisResultByVideoId(...args)),
      retryAnalysis: (...args) =>
        get().then(({ analysisService }) => analysisService.retryAnalysis(...args)),
    },
    statisticsService: {
      getHomeOverview: (...args) =>
        get().then(({ statisticsService }) => statisticsService.getHomeOverview(...args)),
    },
  };
}

export function createMobileServices(
  config: ApiModeConfig,
  dependencies: FactoryDependencies,
): MobileServiceBundle {
  if (config.status === 'invalid') return unconfiguredServices(config.error);
  if (config.mode === 'mock') return lazyServices(dependencies.loadMockServices);
  return dependencies.createRealServices();
}

export function createUnsupportedStatisticsService(): StatisticsService {
  return {
    getHomeOverview: () =>
      Promise.reject(
        createApiError('REAL_STATISTICS_CONTRACT_NOT_CONFIGURED', { retryable: false }),
      ),
  };
}

export type RealServiceDependencies = {
  httpClient: HttpClient;
  tokenStore: AccessTokenStore;
};
