import type { AnalysisStatus, UploadStatus } from '@tennis/shared-types';

import type { WebVideoRecord } from '../demo-data';

export type WebUploadStatusFilter = 'all' | UploadStatus;
export type WebAnalysisStatusFilter = 'all' | 'not_ready' | 'not_created' | AnalysisStatus;
export type WebVideoPageSize = 10 | 20 | 50;

export type WebVideoListParams = {
  keyword: string;
  uploadStatus: WebUploadStatusFilter;
  analysisStatus: WebAnalysisStatusFilter;
  from: string | null;
  to: string | null;
  page: number;
  pageSize: WebVideoPageSize;
};

export type ListWebVideosParams = WebVideoListParams & {
  actorUserId: string;
  signal?: AbortSignal;
};

export type GetWebVideoParams = {
  actorUserId: string;
  videoId: string;
  signal?: AbortSignal;
};

export type DeleteWebVideoParams = GetWebVideoParams;

export type PaginatedWebVideoRecords = {
  items: WebVideoRecord[];
  total: number;
  unfilteredTotal: number;
  page: number;
  pageSize: WebVideoPageSize;
};

export interface WebVideoService {
  listVideos(params: ListWebVideosParams): Promise<PaginatedWebVideoRecords>;
  getVideoById(params: GetWebVideoParams): Promise<WebVideoRecord>;
  deleteVideo(params: DeleteWebVideoParams): Promise<void>;
}
