import type { AnalysisResult, AnalysisTask } from '@tennis/shared-types';

export interface StartAnalysisOptions {
  userId: string;
  videoId: string;
  signal?: AbortSignal;
}

export type GetAnalysisByVideoOptions = StartAnalysisOptions;
export type RetryAnalysisOptions = StartAnalysisOptions;

export interface AnalysisService {
  startAnalysis(options: StartAnalysisOptions): Promise<AnalysisTask>;
  getAnalysisTaskByVideoId(options: GetAnalysisByVideoOptions): Promise<AnalysisTask | null>;
  getAnalysisResultByVideoId(options: GetAnalysisByVideoOptions): Promise<AnalysisResult | null>;
  retryAnalysis(options: RetryAnalysisOptions): Promise<AnalysisTask>;
}
