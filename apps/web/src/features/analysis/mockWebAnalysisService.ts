import { createWebDemoError, throwIfAborted, type WebDemoDataRepository } from '../demo-data';
import { WEB_DEMO_ADMIN_ID, waitForWebVideoDelay } from '../videos/mockVideoService';
import type { WebAnalysisRequest, WebAnalysisService } from './types';

const ANALYSIS_DELAY_MS = 140;

function assertActor(actorUserId: string): void {
  if (actorUserId.trim() !== WEB_DEMO_ADMIN_ID) {
    throw createWebDemoError('WEB_VIDEO_ACCESS_DENIED', { retryable: false });
  }
}

export class MockWebAnalysisService implements WebAnalysisService {
  private readonly repository: WebDemoDataRepository;
  private readonly delayMs: number;

  constructor(repository: WebDemoDataRepository, delayMs = ANALYSIS_DELAY_MS) {
    this.repository = repository;
    this.delayMs = delayMs;
  }

  private async assertVideo(params: WebAnalysisRequest): Promise<string> {
    assertActor(params.actorUserId);
    const videoId = params.videoId.trim();
    if (!videoId) throw createWebDemoError('WEB_VIDEO_NOT_FOUND', { retryable: false });
    await waitForWebVideoDelay(this.delayMs, params.signal);
    throwIfAborted(params.signal);
    if ((await this.repository.getVideoRecordById(videoId, { signal: params.signal })) === null) {
      throw createWebDemoError('WEB_VIDEO_NOT_FOUND', { retryable: false });
    }
    return videoId;
  }

  async getTaskStateByVideoId(params: WebAnalysisRequest) {
    return this.repository.getAnalysisTaskStateByVideoId(await this.assertVideo(params), {
      signal: params.signal,
    });
  }

  async getResultByVideoId(params: WebAnalysisRequest) {
    const videoId = await this.assertVideo(params);
    const { task } = await this.repository.getAnalysisTaskStateByVideoId(videoId, {
      signal: params.signal,
    });
    if (task?.status !== 'succeeded') return null;
    return this.repository.getAnalysisResultByVideoId(videoId, { signal: params.signal });
  }

  async getCvDemoOutputByVideoId(params: WebAnalysisRequest) {
    const videoId = await this.assertVideo(params);
    const { task } = await this.repository.getAnalysisTaskStateByVideoId(videoId, {
      signal: params.signal,
    });
    if (task?.status !== 'succeeded') return null;
    return this.repository.getCvDemoOutputByVideoId(videoId, { signal: params.signal });
  }

  async getTaskLogsByVideoId(params: WebAnalysisRequest) {
    return this.repository.getAnalysisLogsByVideoId(await this.assertVideo(params), {
      signal: params.signal,
    });
  }

  async retryAnalysis(params: WebAnalysisRequest) {
    return this.repository.retryAnalysis(await this.assertVideo(params), { signal: params.signal });
  }
}
