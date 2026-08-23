import { createApiError } from '../../api/errors';
import { webApiMode } from '../../config/env';
import type { WebDemoControlService } from './types';

let mockService: Promise<WebDemoControlService> | null = null;

async function getMockService(): Promise<WebDemoControlService> {
  if (webApiMode.status !== 'ready' || webApiMode.mode !== 'mock') {
    throw createApiError('REAL_API_NOT_CONFIGURED', { retryable: false });
  }
  mockService ??= Promise.all([import('../demo-data'), import('./mockWebDemoControlService')]).then(
    ([demoData, service]) => new service.MockWebDemoControlService(demoData.webDemoDataRepository),
  );
  return mockService;
}

export const webDemoControlService: WebDemoControlService = {
  resetDemoData: (...args) => getMockService().then((service) => service.resetDemoData(...args)),
  createScenario: (...args) => getMockService().then((service) => service.createScenario(...args)),
  forceComplete: (...args) => getMockService().then((service) => service.forceComplete(...args)),
};
