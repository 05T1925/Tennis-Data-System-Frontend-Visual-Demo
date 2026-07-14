import type { AppError, Video } from '@tennis/shared-types';

import type { HomeMockScenario } from '@/config/env';

import type { GetRecentVideosOptions, VideoService } from './VideoService';

const MOCK_DELAY_MS = 700;
const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 3;
const DEMO_USER_ID = 'demo-user-local';

function createVideoError(): AppError {
  return {
    code: 'MOCK_VIDEO_QUERY_FAILED',
    userMessage: '最近视频暂时加载失败，请重试。',
    technicalMessage: 'Deterministic first-request failure from MockVideoService.',
    retryable: true,
  };
}

function waitForMockDelay(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Mock video request aborted.'));
      return;
    }

    const onAbort = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
      reject(new Error('Mock video request aborted.'));
    };
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, MOCK_DELAY_MS);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function normalizeLimit(limit?: number) {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
}

function sortableDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function sortByCreatedAtDescending(videos: Video[]) {
  return videos
    .map((video, index) => ({ video, index, timestamp: sortableDate(video.createdAt) }))
    .sort((left, right) => {
      if (left.timestamp === null && right.timestamp === null) return left.index - right.index;
      if (left.timestamp === null) return 1;
      if (right.timestamp === null) return -1;
      return right.timestamp - left.timestamp || left.index - right.index;
    })
    .map(({ video }) => video);
}

const mockVideos: Video[] = [
  {
    id: 'video-morning-training',
    userId: DEMO_USER_ID,
    title: '周二上午底线训练',
    originalFileName: 'morning-baseline.mp4',
    mimeType: 'video/mp4',
    fileSizeBytes: 428_000_000,
    durationSeconds: 2_735,
    matchType: 'training',
    playMode: 'singles',
    courtType: 'hard',
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    createdAt: '2026-07-14T01:40:00.000Z',
    updatedAt: '2026-07-14T01:48:00.000Z',
  },
  {
    id: 'video-long-title',
    userId: DEMO_USER_ID,
    title: '发球与接发球专项训练——固定机位完整记录以及多组落点练习',
    originalFileName: 'serve-return-session.mp4',
    mimeType: 'video/mp4',
    fileSizeBytes: 312_000_000,
    durationSeconds: 1_842,
    matchType: 'training',
    playMode: 'singles',
    courtType: 'clay',
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    createdAt: '2026-07-12T09:30:00.000Z',
    updatedAt: '2026-07-12T09:38:00.000Z',
  },
  {
    id: 'video-zero-duration',
    userId: DEMO_USER_ID,
    title: ' ',
    originalFileName: 'practice-clip.mp4',
    mimeType: 'video/mp4',
    fileSizeBytes: 18_000_000,
    durationSeconds: 0,
    matchType: 'match',
    playMode: 'doubles',
    uploadStatus: 'failed',
    uploadProgress: 64,
    createdAt: '2026-07-10T12:20:00.000Z',
    updatedAt: '2026-07-10T12:25:00.000Z',
  },
  {
    id: 'video-invalid-date',
    userId: DEMO_USER_ID,
    title: '日期待确认的训练视频',
    originalFileName: 'undated-training.mp4',
    mimeType: 'video/mp4',
    fileSizeBytes: 76_000_000,
    durationSeconds: 540,
    matchType: 'training',
    playMode: 'singles',
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    createdAt: 'invalid-date',
    updatedAt: 'invalid-date',
  },
];

export class MockVideoService implements VideoService {
  private failedFirstRequest = false;

  constructor(private readonly scenario: HomeMockScenario) {}

  async getRecentVideos({ userId, limit, signal }: GetRecentVideosOptions): Promise<Video[]> {
    await waitForMockDelay(signal);

    const normalizedUserId = userId.trim();
    if (normalizedUserId !== DEMO_USER_ID) return [];

    const shouldFail = this.scenario === 'error' || this.scenario === 'video-error';
    if (shouldFail && !this.failedFirstRequest) {
      this.failedFirstRequest = true;
      throw createVideoError();
    }

    if (this.scenario === 'empty') return [];

    const userVideos = mockVideos.filter((video) => video.userId === normalizedUserId);
    return sortByCreatedAtDescending(userVideos).slice(0, normalizeLimit(limit));
  }
}
