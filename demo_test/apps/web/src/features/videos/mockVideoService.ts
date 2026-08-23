import type { WebVideoMockScenario } from '../../config/env';
import {
  createWebDemoError,
  throwIfAborted,
  type WebDemoDataRepository,
  type WebVideoRecord,
} from '../demo-data';
import type {
  DeleteWebVideoParams,
  GetWebVideoParams,
  ListWebVideosParams,
  PaginatedWebVideoRecords,
  WebVideoPageSize,
  WebVideoService,
} from './types';
import { getLocalDateBounds } from './urlParams';
import { getWebAnalysisStatus } from './videoStatus';

export const WEB_DEMO_ADMIN_ID = 'demo-web-admin';
export const WEB_VIDEO_MOCK_DELAY_MS = 180;

export function waitForWebVideoDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  if (delayMs <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      callback();
    };
    const onAbort = () => {
      window.clearTimeout(timeoutId);
      finish(() => {
        try {
          throwIfAborted(signal);
        } catch (error) {
          reject(error);
        }
      });
    };
    const timeoutId = window.setTimeout(() => finish(resolve), delayMs);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function assertActor(actorUserId: string): void {
  if (actorUserId.trim() !== WEB_DEMO_ADMIN_ID) {
    throw createWebDemoError('WEB_VIDEO_ACCESS_DENIED', { retryable: false });
  }
}

function stableSort(records: readonly WebVideoRecord[]): WebVideoRecord[] {
  return records
    .map((record, index) => ({ record, index, time: Date.parse(record.video.createdAt) }))
    .sort((left, right) => {
      const leftValid = Number.isFinite(left.time);
      const rightValid = Number.isFinite(right.time);
      if (leftValid && rightValid) {
        return right.time - left.time || left.record.video.id.localeCompare(right.record.video.id);
      }
      if (leftValid) return -1;
      if (rightValid) return 1;
      return left.index - right.index;
    })
    .map(({ record }) => record);
}

export class MockWebVideoService implements WebVideoService {
  private readonly repository: WebDemoDataRepository;
  private readonly scenario: WebVideoMockScenario;
  private readonly delayMs: number;
  private failedFirstValidList = false;

  constructor(
    repository: WebDemoDataRepository,
    scenario: WebVideoMockScenario = 'success',
    delayMs = WEB_VIDEO_MOCK_DELAY_MS,
  ) {
    this.repository = repository;
    this.scenario = scenario;
    this.delayMs = delayMs;
  }

  async listVideos(params: ListWebVideosParams): Promise<PaginatedWebVideoRecords> {
    assertActor(params.actorUserId);
    const pageSize: WebVideoPageSize = [10, 20, 50].includes(params.pageSize)
      ? params.pageSize
      : 10;
    const requestedPage = Number.isSafeInteger(params.page) && params.page > 0 ? params.page : 1;
    if (params.from !== null && params.to !== null && params.from > params.to) {
      throw createWebDemoError('WEB_VIDEO_LIST_FAILED', { retryable: false });
    }
    await waitForWebVideoDelay(this.delayMs, params.signal);
    throwIfAborted(params.signal);

    if (this.scenario === 'error-once' && !this.failedFirstValidList) {
      this.failedFirstValidList = true;
      throw createWebDemoError('WEB_VIDEO_LIST_FAILED');
    }
    if (this.scenario === 'empty') {
      return { items: [], total: 0, unfilteredTotal: 0, page: 1, pageSize };
    }

    const records = await this.repository.listVideoRecords({ signal: params.signal });
    const keyword = params.keyword.trim().toLocaleLowerCase();
    const { fromMs, toExclusiveMs } = getLocalDateBounds(params);
    const filtered = records.filter((record) => {
      const { video } = record;
      if (
        keyword &&
        ![video.id, video.userId, video.title, video.originalFileName].some((value) =>
          value.toLocaleLowerCase().includes(keyword),
        )
      ) {
        return false;
      }
      if (params.uploadStatus !== 'all' && video.uploadStatus !== params.uploadStatus) return false;
      if (
        params.analysisStatus !== 'all' &&
        getWebAnalysisStatus(record) !== params.analysisStatus
      ) {
        return false;
      }
      const timestamp = Date.parse(video.createdAt);
      if (fromMs !== null && (!Number.isFinite(timestamp) || timestamp < fromMs)) return false;
      if (toExclusiveMs !== null && (!Number.isFinite(timestamp) || timestamp >= toExclusiveMs)) {
        return false;
      }
      return true;
    });
    const sorted = stableSort(filtered);
    const total = sorted.length;
    const maximumPage = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, maximumPage);
    const start = (page - 1) * pageSize;
    return {
      items: sorted.slice(start, start + pageSize),
      total,
      unfilteredTotal: records.length,
      page,
      pageSize,
    };
  }

  async getVideoById(params: GetWebVideoParams): Promise<WebVideoRecord> {
    assertActor(params.actorUserId);
    const videoId = params.videoId.trim();
    if (!videoId) throw createWebDemoError('WEB_VIDEO_NOT_FOUND', { retryable: false });
    await waitForWebVideoDelay(this.delayMs, params.signal);
    const record = await this.repository.getVideoRecordById(videoId, { signal: params.signal });
    if (record === null) throw createWebDemoError('WEB_VIDEO_NOT_FOUND', { retryable: false });
    return record;
  }

  async deleteVideo(params: DeleteWebVideoParams): Promise<void> {
    assertActor(params.actorUserId);
    const videoId = params.videoId.trim();
    if (!videoId) throw createWebDemoError('WEB_VIDEO_NOT_FOUND', { retryable: false });
    await waitForWebVideoDelay(this.delayMs, params.signal);
    await this.repository.deleteVideo(videoId, { signal: params.signal });
  }
}
