import {
  createWebDemoError,
  normalizeWebDemoError,
  throwIfAborted,
  type WebDemoDataRepository,
} from '../demo-data';
import { WEB_DEMO_ADMIN_ID } from '../videos/mockVideoService';
import type {
  WebCreateScenarioRequest,
  WebDemoControlRequest,
  WebDemoControlService,
  WebForceCompleteRequest,
} from './types';

function assertActor(actorUserId: string): void {
  if (actorUserId.trim() !== WEB_DEMO_ADMIN_ID) {
    throw createWebDemoError('WEB_VIDEO_ACCESS_DENIED', { retryable: false });
  }
}

export class MockWebDemoControlService implements WebDemoControlService {
  private readonly repository: WebDemoDataRepository;

  constructor(repository: WebDemoDataRepository) {
    this.repository = repository;
  }

  async resetDemoData(params: WebDemoControlRequest) {
    assertActor(params.actorUserId);
    try {
      throwIfAborted(params.signal);
      return await this.repository.resetDemoData({ signal: params.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      throw normalizeWebDemoError(error, 'WEB_DEMO_RESET_FAILED');
    }
  }

  async createScenario(params: WebCreateScenarioRequest) {
    assertActor(params.actorUserId);
    try {
      throwIfAborted(params.signal);
      return await this.repository.createDemoScenario(params.kind, { signal: params.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      throw normalizeWebDemoError(error, 'WEB_DEMO_SCENARIO_CREATE_FAILED');
    }
  }

  async forceComplete(params: WebForceCompleteRequest) {
    assertActor(params.actorUserId);
    try {
      throwIfAborted(params.signal);
      return await this.repository.forceCompleteAnalysis(params.videoId, { signal: params.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      throw normalizeWebDemoError(error, 'WEB_DEMO_CONTROL_FAILED');
    }
  }
}
