import type { User } from '@tennis/shared-types';
import { describe, expect, it, vi } from 'vitest';

import {
  createUnsupportedWebStatisticsService,
  createWebServices,
  type WebServiceBundle,
} from './serviceFactory';

const user: User = {
  id: 'admin-1',
  displayName: 'Admin',
  role: 'admin',
  createdAt: '2026-07-18T00:00:00.000Z',
  updatedAt: '2026-07-18T00:00:00.000Z',
};

function bundle(): WebServiceBundle {
  const unused = () => Promise.reject(new Error('unused'));
  return {
    webAuthService: {
      login: () => Promise.resolve({ version: 2, mode: 'mock', accessToken: 'stub', user }),
      restore: unused,
      logout: () => Promise.resolve(),
    },
    webVideoService: { listVideos: unused, getVideoById: unused, deleteVideo: unused },
    webAnalysisService: {
      getTaskStateByVideoId: unused,
      getResultByVideoId: unused,
      getCvDemoOutputByVideoId: unused,
      getTaskLogsByVideoId: unused,
      retryAnalysis: unused,
    },
    webStatisticsService: { getOverview: unused },
  };
}

describe('createWebServices', () => {
  it('loads the Mock bundle once', async () => {
    const loader = vi.fn().mockResolvedValue(bundle());
    const services = createWebServices(
      { status: 'ready', mode: 'mock' },
      { loadMockServices: loader, createRealServices: bundle },
    );
    await services.webAuthService.login({ email: 'admin@example.com', password: 'password' });
    await services.webAuthService.login({ email: 'admin@example.com', password: 'password' });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('does not evaluate the Mock loader in Real or invalid mode', async () => {
    const loader = vi.fn().mockResolvedValue(bundle());
    const real = createWebServices(
      { status: 'ready', mode: 'real', apiBaseUrl: 'https://api.example.com/api/v1' },
      { loadMockServices: loader, createRealServices: bundle },
    );
    await real.webAuthService.login({ email: 'admin@example.com', password: 'password' });
    const invalid = createWebServices(
      {
        status: 'invalid',
        requestedMode: 'real',
        error: { code: 'REAL_API_BASE_URL_MISSING', userMessage: 'invalid', retryable: false },
      },
      { loadMockServices: loader, createRealServices: bundle },
    );
    await expect(
      invalid.webAuthService.login({ email: 'admin@example.com', password: 'password' }),
    ).rejects.toMatchObject({ code: 'REAL_API_BASE_URL_MISSING' });
    expect(loader).not.toHaveBeenCalled();
  });

  it('keeps Real Overview Statistics at the Level 1 boundary', async () => {
    await expect(
      createUnsupportedWebStatisticsService().getOverview({ actorUserId: 'admin-1' }),
    ).rejects.toMatchObject({ code: 'REAL_STATISTICS_CONTRACT_NOT_CONFIGURED' });
  });
});
