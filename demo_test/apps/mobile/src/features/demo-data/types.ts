import type { AnalysisResult, AnalysisStage, AnalysisTask, Video } from '@tennis/shared-types';

export const DEMO_DATA_VERSION = 1 as const;
export const DEMO_USER_ID = 'demo-user-local';

export interface UploadRuntimeState {
  startedAt: string;
  durationMs: number;
  outcome: 'succeeded' | 'failed';
}

export interface AnalysisRuntimeState {
  startedAt: string;
  stageDurationMs: number;
  outcome: 'succeeded' | 'failed';
  failureStage?: AnalysisStage;
}

export interface DemoDataSnapshot {
  version: typeof DEMO_DATA_VERSION;
  videos: Video[];
  analysisTasks: AnalysisTask[];
  analysisResults: AnalysisResult[];
  runtime: {
    uploads: Record<string, UploadRuntimeState>;
    analyses: Record<string, AnalysisRuntimeState>;
  };
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(prefix: 'video' | 'task' | 'result' | 'shot' | 'rally' | 'point'): string;
}
