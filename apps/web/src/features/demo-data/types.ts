import type { AnalysisTask, Video } from '@tennis/shared-types';

export const WEB_DEMO_DATA_VERSION = 1 as const;

export type WebVideoRecord = {
  video: Video;
  analysisTask: AnalysisTask | null;
};

export type WebDemoDataSnapshot = {
  version: typeof WEB_DEMO_DATA_VERSION;
  videos: Video[];
  analysisTasks: AnalysisTask[];
};

export type WebDemoDataStorage = {
  read(): string | null;
  write(value: string): void;
};
