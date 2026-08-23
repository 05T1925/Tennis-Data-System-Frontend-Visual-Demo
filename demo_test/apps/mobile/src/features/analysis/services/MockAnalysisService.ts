import type { AnalysisTask, Video } from '@tennis/shared-types';

import type { DemoDataRepository } from '@/features/demo-data/DemoDataRepository';
import { createDemoDataError } from '@/features/demo-data/errors';
import { createAnalysisTask } from '@/features/demo-data/factories';
import { DEFAULT_ANALYSIS_STAGE_DURATION_MS } from '@/features/demo-data/transitions';
import type { Clock, IdGenerator } from '@/features/demo-data/types';

import type {
  AnalysisService,
  GetAnalysisByVideoOptions,
  RetryAnalysisOptions,
  StartAnalysisOptions,
} from './AnalysisService';

export class MockAnalysisService implements AnalysisService {
  constructor(
    private readonly repository: DemoDataRepository,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
  ) {}

  private async getOwnedVideo(
    userId: string,
    videoId: string,
    signal?: AbortSignal,
  ): Promise<Video> {
    const snapshot = await this.repository.getSnapshot({ signal });
    const video = snapshot.videos.find(
      (candidate) => candidate.id === videoId.trim() && candidate.userId === userId.trim(),
    );
    if (!video) throw createDemoDataError('VIDEO_NOT_FOUND', { retryable: false });
    return video;
  }

  async startAnalysis({ userId, videoId, signal }: StartAnalysisOptions) {
    const video = await this.getOwnedVideo(userId, videoId, signal);
    if (video.uploadStatus !== 'uploaded') {
      throw createDemoDataError('ANALYSIS_NOT_READY', { retryable: false });
    }
    const now = this.clock.now().toISOString();
    const task = createAnalysisTask({
      id: this.idGenerator.next('task'),
      videoId: video.id,
      createdAt: now,
      updatedAt: now,
    });
    const next = await this.repository.update(
      (snapshot) => {
        const existing = snapshot.analysisTasks.find((candidate) => candidate.videoId === video.id);
        if (existing) {
          if (existing.status === 'failed') {
            throw createDemoDataError('ANALYSIS_RETRY_NOT_ALLOWED', { retryable: false });
          }
          return snapshot;
        }
        return {
          ...snapshot,
          analysisTasks: [...snapshot.analysisTasks, task],
          runtime: {
            ...snapshot.runtime,
            analyses: {
              ...snapshot.runtime.analyses,
              [task.id]: {
                startedAt: now,
                stageDurationMs: DEFAULT_ANALYSIS_STAGE_DURATION_MS,
                outcome: 'succeeded',
              },
            },
          },
        };
      },
      { signal },
    );
    return next.analysisTasks.find((candidate) => candidate.videoId === video.id) as AnalysisTask;
  }

  async getAnalysisTaskByVideoId({ userId, videoId, signal }: GetAnalysisByVideoOptions) {
    const video = await this.getOwnedVideo(userId, videoId, signal);
    const snapshot = await this.repository.getSnapshot({ signal });
    return snapshot.analysisTasks.find((task) => task.videoId === video.id) ?? null;
  }

  async getAnalysisResultByVideoId({ userId, videoId, signal }: GetAnalysisByVideoOptions) {
    const video = await this.getOwnedVideo(userId, videoId, signal);
    const snapshot = await this.repository.getSnapshot({ signal });
    return snapshot.analysisResults.find((result) => result.videoId === video.id) ?? null;
  }

  async retryAnalysis({ userId, videoId, signal }: RetryAnalysisOptions) {
    const video = await this.getOwnedVideo(userId, videoId, signal);
    const current = await this.repository.getSnapshot({ signal });
    const task = current.analysisTasks.find((candidate) => candidate.videoId === video.id);
    if (!task) throw createDemoDataError('ANALYSIS_NOT_FOUND', { retryable: false });
    if (task.status !== 'failed') {
      throw createDemoDataError('ANALYSIS_RETRY_NOT_ALLOWED', { retryable: false });
    }
    const now = this.clock.now().toISOString();
    const next = await this.repository.update(
      (snapshot) => {
        const latest = snapshot.analysisTasks.find((candidate) => candidate.id === task.id);
        if (!latest || latest.status !== 'failed') {
          throw createDemoDataError('ANALYSIS_RETRY_NOT_ALLOWED', { retryable: false });
        }
        return {
          ...snapshot,
          analysisTasks: snapshot.analysisTasks.map((candidate) =>
            candidate.id === task.id
              ? {
                  ...candidate,
                  status: 'queued',
                  stage: 'queued',
                  progress: 0,
                  retryCount: candidate.retryCount + 1,
                  errorCode: undefined,
                  errorMessage: undefined,
                  startedAt: undefined,
                  completedAt: undefined,
                  updatedAt: now,
                }
              : candidate,
          ),
          analysisResults: snapshot.analysisResults.filter((result) => result.videoId !== video.id),
          runtime: {
            ...snapshot.runtime,
            analyses: {
              ...snapshot.runtime.analyses,
              [task.id]: {
                startedAt: now,
                stageDurationMs: DEFAULT_ANALYSIS_STAGE_DURATION_MS,
                outcome: 'succeeded',
              },
            },
          },
        };
      },
      { signal },
    );
    return next.analysisTasks.find(({ id }) => id === task.id) as AnalysisTask;
  }
}
