import type { AnalysisStage, AnalysisStatus, UploadStatus } from '@tennis/shared-types';

import type { WebDerivedAnalysisStatus } from '../videos/videoStatus';

export type WebOverviewStatusBucket =
  | 'waiting_upload'
  | 'uploading'
  | 'upload_failed'
  | 'upload_canceled'
  | 'task_not_created'
  | 'queued'
  | 'processing'
  | 'succeeded'
  | 'analysis_failed'
  | 'analysis_canceled';

export type WebDurationBucket =
  | 'under_1_minute'
  | '1_to_3_minutes'
  | '3_to_6_minutes'
  | '6_to_10_minutes'
  | '10_minutes_or_more'
  | 'unconfirmed';

export type WebUploadTrendPoint = { dateKey: string; label: string; count: number };
export type WebStatusDistributionItem = { bucket: WebOverviewStatusBucket; count: number };
export type WebDurationDistributionItem = { bucket: WebDurationBucket; count: number };
export type WebAnalysisSuccessRate = {
  succeeded: number;
  failed: number;
  denominator: number;
  rate: number | null;
};

export type WebRecentUploadItem = {
  videoId: string;
  title: string;
  userId: string;
  createdAt: string;
  uploadStatus: UploadStatus;
  analysisStatus: WebDerivedAnalysisStatus;
};

export type WebRecentFailureItem = {
  videoId: string;
  title: string;
  failureType: 'upload' | 'analysis';
  safeReason: string;
  failedAt: string;
  retryCount: number;
};

export type WebActiveTaskItem = {
  videoId: string;
  taskId: string;
  title: string;
  status: Extract<AnalysisStatus, 'queued' | 'processing'>;
  stage: AnalysisStage;
  progress: number;
  updatedAt: string;
  runtimeActive: boolean;
};

export type WebOverviewStatistics = {
  generatedAt: string;
  referenceDate: string;
  metrics: {
    totalVideos: number;
    todayCreatedVideos: number;
    waitingForAnalysis: number;
    processing: number;
    succeeded: number;
    failed: number;
    averageAnalysisDurationSeconds: number | null;
    averageAnalysisDurationSampleCount: number;
  };
  uploadTrend: WebUploadTrendPoint[];
  statusDistribution: WebStatusDistributionItem[];
  successRate: WebAnalysisSuccessRate;
  durationDistribution: WebDurationDistributionItem[];
  recentUploads: WebRecentUploadItem[];
  recentFailures: WebRecentFailureItem[];
  activeTasks: WebActiveTaskItem[];
  controllableTasks: WebActiveTaskItem[];
  runtimeActiveCount: number;
};

export type GetWebOverviewParams = { actorUserId: string; signal?: AbortSignal };

export interface WebStatisticsService {
  getOverview(params: GetWebOverviewParams): Promise<WebOverviewStatistics>;
}
