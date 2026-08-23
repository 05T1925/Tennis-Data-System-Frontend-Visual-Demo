import type { AppError } from '@tennis/shared-types';

import type { WebAnalysisService } from '../features/analysis/types';
import type { WebAuthService } from '../features/auth/WebAuthService';
import type { WebStatisticsService } from '../features/statistics/types';
import type { WebVideoService } from '../features/videos/types';
import type { ApiModeConfig } from './config/apiMode';
import { createApiError } from './errors';

export type WebServiceBundle = {
  webAuthService: WebAuthService;
  webVideoService: WebVideoService;
  webAnalysisService: WebAnalysisService;
  webStatisticsService: WebStatisticsService;
};

type FactoryDependencies = {
  loadMockServices: () => Promise<WebServiceBundle>;
  createRealServices: () => WebServiceBundle;
};

function unconfigured(error: AppError): WebServiceBundle {
  const reject = () => Promise.reject(error);
  return {
    webAuthService: { login: reject, restore: reject, logout: reject },
    webVideoService: { listVideos: reject, getVideoById: reject, deleteVideo: reject },
    webAnalysisService: {
      getTaskStateByVideoId: reject,
      getResultByVideoId: reject,
      getCvDemoOutputByVideoId: reject,
      getTaskLogsByVideoId: reject,
      retryAnalysis: reject,
    },
    webStatisticsService: { getOverview: reject },
  };
}

function lazyServices(loader: () => Promise<WebServiceBundle>): WebServiceBundle {
  let selected: Promise<WebServiceBundle> | null = null;
  const get = () => {
    selected ??= loader();
    return selected;
  };
  return {
    webAuthService: {
      login: (...args) => get().then(({ webAuthService }) => webAuthService.login(...args)),
      restore: (...args) => get().then(({ webAuthService }) => webAuthService.restore(...args)),
      logout: (...args) => get().then(({ webAuthService }) => webAuthService.logout(...args)),
    },
    webVideoService: {
      listVideos: (...args) =>
        get().then(({ webVideoService }) => webVideoService.listVideos(...args)),
      getVideoById: (...args) =>
        get().then(({ webVideoService }) => webVideoService.getVideoById(...args)),
      deleteVideo: (...args) =>
        get().then(({ webVideoService }) => webVideoService.deleteVideo(...args)),
    },
    webAnalysisService: {
      getTaskStateByVideoId: (...args) =>
        get().then(({ webAnalysisService }) => webAnalysisService.getTaskStateByVideoId(...args)),
      getResultByVideoId: (...args) =>
        get().then(({ webAnalysisService }) => webAnalysisService.getResultByVideoId(...args)),
      getCvDemoOutputByVideoId: (...args) =>
        get().then(({ webAnalysisService }) =>
          webAnalysisService.getCvDemoOutputByVideoId(...args),
        ),
      getTaskLogsByVideoId: (...args) =>
        get().then(({ webAnalysisService }) => webAnalysisService.getTaskLogsByVideoId(...args)),
      retryAnalysis: (...args) =>
        get().then(({ webAnalysisService }) => webAnalysisService.retryAnalysis(...args)),
    },
    webStatisticsService: {
      getOverview: (...args) =>
        get().then(({ webStatisticsService }) => webStatisticsService.getOverview(...args)),
    },
  };
}

export function createWebServices(
  config: ApiModeConfig,
  dependencies: FactoryDependencies,
): WebServiceBundle {
  if (config.status === 'invalid') return unconfigured(config.error);
  if (config.mode === 'mock') return lazyServices(dependencies.loadMockServices);
  return dependencies.createRealServices();
}

export function createUnsupportedWebStatisticsService(): WebStatisticsService {
  return {
    getOverview: () =>
      Promise.reject(
        createApiError('REAL_STATISTICS_CONTRACT_NOT_CONFIGURED', { retryable: false }),
      ),
  };
}
