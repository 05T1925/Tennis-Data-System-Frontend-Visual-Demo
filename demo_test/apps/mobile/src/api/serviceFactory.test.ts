import type { User } from '@tennis/shared-types';
import { describe, expect, it, vi } from 'vitest';

import type { MobileServiceBundle } from './serviceFactory';
import { createMobileServices, createUnsupportedStatisticsService } from './serviceFactory';

const user: User = {
  id: 'user-1',
  displayName: 'User',
  role: 'user',
  createdAt: '2026-07-18T00:00:00.000Z',
  updatedAt: '2026-07-18T00:00:00.000Z',
};

function bundle(): MobileServiceBundle {
  const unsupported = () => Promise.reject(new Error('unused'));
  return {
    authService: {
      login: () =>
        Promise.resolve({
          version: 2,
          mode: 'mock',
          accessToken: 'stub-token',
          user,
        }),
      restore: unsupported,
      logout: () => Promise.resolve(),
    },
    videoService: {
      getRecentVideos: unsupported,
      listVideos: unsupported,
      getVideoById: unsupported,
      createVideo: unsupported,
      startUpload: unsupported,
      deleteVideo: unsupported,
    },
    analysisService: {
      startAnalysis: unsupported,
      getAnalysisTaskByVideoId: unsupported,
      getAnalysisResultByVideoId: unsupported,
      retryAnalysis: unsupported,
    },
    statisticsService: { getHomeOverview: unsupported },
  };
}

describe('createMobileServices', () => {
  it('loads and caches the selected Mock bundle once', async () => {
    const loadMockServices = vi.fn().mockResolvedValue(bundle());
    const services = createMobileServices(
      { status: 'ready', mode: 'mock' },
      { loadMockServices, createRealServices: bundle },
    );
    await services.authService.login({ email: 'a@b.com', password: 'password' });
    await services.authService.login({ email: 'a@b.com', password: 'password' });
    expect(loadMockServices).toHaveBeenCalledTimes(1);
  });

  it('never calls the Mock loader in Real mode', async () => {
    const loadMockServices = vi.fn().mockResolvedValue(bundle());
    const services = createMobileServices(
      { status: 'ready', mode: 'real', apiBaseUrl: 'https://api.example.com/api/v1' },
      { loadMockServices, createRealServices: bundle },
    );
    await services.authService.login({ email: 'a@b.com', password: 'password' });
    expect(loadMockServices).not.toHaveBeenCalled();
  });

  it('does not fall back to Mock for invalid config', async () => {
    const loadMockServices = vi.fn().mockResolvedValue(bundle());
    const services = createMobileServices(
      {
        status: 'invalid',
        requestedMode: 'real',
        error: { code: 'REAL_API_BASE_URL_MISSING', userMessage: 'invalid', retryable: false },
      },
      { loadMockServices, createRealServices: bundle },
    );
    await expect(
      services.authService.login({ email: 'a@b.com', password: 'password' }),
    ).rejects.toMatchObject({ code: 'REAL_API_BASE_URL_MISSING' });
    expect(loadMockServices).not.toHaveBeenCalled();
  });

  it('keeps Real Statistics at the explicit Level 1 boundary', async () => {
    await expect(
      createUnsupportedStatisticsService().getHomeOverview({ userId: 'user-1' }),
    ).rejects.toMatchObject({ code: 'REAL_STATISTICS_CONTRACT_NOT_CONFIGURED' });
  });
});
