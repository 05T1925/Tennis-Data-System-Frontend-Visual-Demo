import type { AppError, Video } from '@tennis/shared-types';

import type { HomeMockScenario, UploadMockScenario } from '@/config/env';
import type { DemoDataRepository } from '@/features/demo-data/DemoDataRepository';
import { createDemoDataError, throwIfAborted, waitForDemoDelay } from '@/features/demo-data/errors';
import { DEFAULT_UPLOAD_DURATION_MS } from '@/features/demo-data/transitions';
import { DEMO_USER_ID, type Clock, type IdGenerator } from '@/features/demo-data/types';

import type {
  CreateVideoInput,
  CreateVideoOptions,
  DeleteVideoOptions,
  GetRecentVideosOptions,
  GetVideoByIdOptions,
  ListVideosOptions,
  StartUploadOptions,
  VideoService,
} from './VideoService';
import { getUploadStartDecision } from './uploadMockScenario';

const MOCK_DELAY_MS = 700;
const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 3;

function createVideoQueryError(): AppError {
  return {
    code: 'MOCK_VIDEO_QUERY_FAILED',
    userMessage: '最近视频暂时加载失败，请重试。',
    technicalMessage: 'Deterministic first-request failure from MockVideoService.',
    retryable: true,
  };
}

function normalizeLimit(limit?: number) {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
}

function sortVideos(videos: Video[]) {
  return videos
    .map((video, index) => ({ video, index, timestamp: Date.parse(video.createdAt) }))
    .sort((left, right) => {
      const leftValid = Number.isFinite(left.timestamp);
      const rightValid = Number.isFinite(right.timestamp);
      if (!leftValid && !rightValid) return left.index - right.index;
      if (!leftValid) return 1;
      if (!rightValid) return -1;
      return right.timestamp - left.timestamp || left.index - right.index;
    })
    .map(({ video }) => video);
}

function validateInput(input: CreateVideoInput) {
  const originalFileName = input.originalFileName.trim();
  const mimeType = input.mimeType.trim();
  const validFileSize =
    Number.isFinite(input.fileSizeBytes) &&
    input.fileSizeBytes >= 0 &&
    Number.isInteger(input.fileSizeBytes);
  const validDuration =
    input.durationSeconds === undefined ||
    (Number.isFinite(input.durationSeconds) && input.durationSeconds >= 0);
  if (!originalFileName || !mimeType || !validFileSize || !validDuration) {
    throw createDemoDataError('INVALID_VIDEO_INPUT', { retryable: false });
  }
  return {
    ...input,
    title: input.title.trim(),
    originalFileName,
    mimeType,
    note: input.note?.trim() || undefined,
  };
}

export class MockVideoService implements VideoService {
  private failedFirstRequest = false;

  constructor(
    private readonly scenario: HomeMockScenario,
    private readonly repository: DemoDataRepository,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
    private readonly uploadScenario: UploadMockScenario = 'success',
  ) {}

  private async findOwnedVideo(userId: string, videoId: string, signal?: AbortSignal) {
    const normalizedUserId = userId.trim();
    const normalizedVideoId = videoId.trim();
    const snapshot = await this.repository.getSnapshot({ signal });
    const video = snapshot.videos.find(
      (candidate) => candidate.id === normalizedVideoId && candidate.userId === normalizedUserId,
    );
    if (!video) throw createDemoDataError('VIDEO_NOT_FOUND', { retryable: false });
    return video;
  }

  async getRecentVideos({ userId, limit, signal }: GetRecentVideosOptions) {
    await waitForDemoDelay(MOCK_DELAY_MS, signal);
    const normalizedUserId = userId.trim();
    const snapshot = await this.repository.getSnapshot({ signal });
    if (normalizedUserId !== DEMO_USER_ID) return [];
    const shouldFail = this.scenario === 'error' || this.scenario === 'video-error';
    if (shouldFail && !this.failedFirstRequest) {
      this.failedFirstRequest = true;
      throw createVideoQueryError();
    }
    if (this.scenario === 'empty') return [];
    return sortVideos(snapshot.videos.filter((video) => video.userId === normalizedUserId)).slice(
      0,
      normalizeLimit(limit),
    );
  }

  async listVideos({ userId, uploadStatus, signal }: ListVideosOptions) {
    throwIfAborted(signal);
    const normalizedUserId = userId.trim();
    const snapshot = await this.repository.getSnapshot({ signal });
    return sortVideos(
      snapshot.videos.filter(
        (video) =>
          video.userId === normalizedUserId &&
          (!uploadStatus || video.uploadStatus === uploadStatus),
      ),
    );
  }

  getVideoById({ userId, videoId, signal }: GetVideoByIdOptions) {
    return this.findOwnedVideo(userId, videoId, signal);
  }

  async createVideo({ userId, input, signal }: CreateVideoOptions) {
    throwIfAborted(signal);
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) throw createDemoDataError('INVALID_VIDEO_INPUT', { retryable: false });
    const validated = validateInput(input);
    const now = this.clock.now().toISOString();
    const video: Video = {
      ...validated,
      id: this.idGenerator.next('video'),
      userId: normalizedUserId,
      uploadStatus: 'idle',
      uploadProgress: 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.update(
      (snapshot) => ({ ...snapshot, videos: [...snapshot.videos, video] }),
      { signal },
    );
    return video;
  }

  async startUpload({ userId, videoId, signal }: StartUploadOptions) {
    const owned = await this.findOwnedVideo(userId, videoId, signal);
    const initialDecision = getUploadStartDecision(this.uploadScenario, owned.uploadStatus);
    if (initialDecision.kind === 'idempotent') return owned;
    if (initialDecision.kind === 'reject') {
      throw createDemoDataError('UPLOAD_NOT_ALLOWED', { retryable: false });
    }
    const now = this.clock.now().toISOString();
    const snapshot = await this.repository.update(
      (current) => {
        const latest = current.videos.find((video) => video.id === owned.id);
        if (!latest) throw createDemoDataError('VIDEO_NOT_FOUND', { retryable: false });
        const decision = getUploadStartDecision(this.uploadScenario, latest.uploadStatus);
        if (decision.kind === 'idempotent') return current;
        if (decision.kind === 'reject') {
          throw createDemoDataError('UPLOAD_NOT_ALLOWED', { retryable: false });
        }
        return {
          ...current,
          videos: current.videos.map((video) =>
            video.id === owned.id
              ? { ...video, uploadStatus: 'uploading', uploadProgress: 0, updatedAt: now }
              : video,
          ),
          runtime: {
            ...current.runtime,
            uploads: {
              ...current.runtime.uploads,
              [owned.id]: {
                startedAt: now,
                durationMs: DEFAULT_UPLOAD_DURATION_MS,
                outcome: decision.outcome,
              },
            },
          },
        };
      },
      { signal },
    );
    return snapshot.videos.find((video) => video.id === owned.id) as Video;
  }

  async deleteVideo({ userId, videoId, signal }: DeleteVideoOptions) {
    const owned = await this.findOwnedVideo(userId, videoId, signal);
    await this.repository.update(
      (snapshot) => {
        const taskIds = new Set(
          snapshot.analysisTasks.filter((task) => task.videoId === owned.id).map(({ id }) => id),
        );
        const uploads = { ...snapshot.runtime.uploads };
        delete uploads[owned.id];
        const analyses = { ...snapshot.runtime.analyses };
        for (const taskId of taskIds) delete analyses[taskId];
        return {
          ...snapshot,
          videos: snapshot.videos.filter((video) => video.id !== owned.id),
          analysisTasks: snapshot.analysisTasks.filter((task) => task.videoId !== owned.id),
          analysisResults: snapshot.analysisResults.filter((result) => result.videoId !== owned.id),
          runtime: { uploads, analyses },
        };
      },
      { signal },
    );
  }
}
