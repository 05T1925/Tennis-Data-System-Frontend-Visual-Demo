import type { AnalysisResult, AnalysisTask } from '@tennis/shared-types';

import type { WebAnalysisTaskLogEntry, WebAnalysisTaskState, WebCvDemoOutput } from '../demo-data';

export type WebAnalysisRequest = {
  actorUserId: string;
  videoId: string;
  signal?: AbortSignal;
};

export interface WebAnalysisService {
  getTaskStateByVideoId(params: WebAnalysisRequest): Promise<WebAnalysisTaskState>;
  getResultByVideoId(params: WebAnalysisRequest): Promise<AnalysisResult | null>;
  getCvDemoOutputByVideoId(params: WebAnalysisRequest): Promise<WebCvDemoOutput | null>;
  getTaskLogsByVideoId(params: WebAnalysisRequest): Promise<WebAnalysisTaskLogEntry[]>;
  retryAnalysis(params: WebAnalysisRequest): Promise<AnalysisTask>;
}

export type WebDetailTab = 'basic' | 'result' | 'shots' | 'cv' | 'logs';
