import type {
  AnalysisResult,
  AnalysisStage,
  AnalysisTask,
  CvOutput,
  Video,
} from '@tennis/shared-types';

export const WEB_DEMO_DATA_VERSION = 2 as const;
export const WEB_DEMO_DATA_V1_VERSION = 1 as const;
export const WEB_CV_DEMO_SCHEMA = 'web-cv-demo-v1' as const;
export const WEB_CV_DEMO_DISCLAIMER =
  'Web-private Demo fixture; non-official CV contract; for frontend interaction validation only.';
export const MAX_WEB_CV_DEMO_BYTES = 512 * 1_024;
export const MAX_WEB_DEMO_SNAPSHOT_BYTES = 2 * 1_024 * 1_024;

export type JsonSafePrimitive = string | number | boolean | null;
export type JsonSafeValue = JsonSafePrimitive | JsonSafeValue[] | { [key: string]: JsonSafeValue };

export type WebCvCourtKeypoint = {
  id: string;
  label: string;
  x: number;
  y: number;
  confidence?: number;
};

export type WebCvTrackSample = {
  frameIndex: number;
  timestampMs: number;
  x: number;
  y: number;
  confidence?: number;
};

export type WebCvPlayerTrack = {
  playerId: string;
  samples: WebCvTrackSample[];
};

export type WebCvBallTrackPoint = WebCvTrackSample & {
  visible: boolean;
};

export type WebCvFrameConfidence = {
  frameIndex: number;
  court?: number;
  players?: number;
  ball?: number;
  overall?: number;
};

export type WebCvDemoPayload = {
  disclaimer: string;
  generatedAt: string;
  frameCount: number;
  courtKeypoints?: WebCvCourtKeypoint[];
  playerTracks?: WebCvPlayerTrack[];
  ballTrack?: WebCvBallTrackPoint[];
  frameConfidences?: WebCvFrameConfidence[];
  metadata?: JsonSafeValue;
};

export type WebCvDemoOutput = {
  id: string;
  taskId: string;
  demoSchema: typeof WEB_CV_DEMO_SCHEMA;
  output: CvOutput<WebCvDemoPayload>;
};

export type WebAnalysisTaskLogEntry = {
  id: string;
  taskId: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  audience: 'user' | 'developer';
  userMessage?: string;
  developerMessage?: string;
  stage?: AnalysisStage;
};

export type WebAnalysisRuntime = {
  taskId: string;
  attempt: number;
  queuedAt: string;
};

export type WebAnalysisTaskState = {
  task: AnalysisTask | null;
  runtimeActive: boolean;
};

export type WebVideoRecord = {
  video: Video;
  analysisTask: AnalysisTask | null;
};

export type WebDemoDataSnapshotV1 = {
  version: typeof WEB_DEMO_DATA_V1_VERSION;
  videos: Video[];
  analysisTasks: AnalysisTask[];
};

export type WebDemoDataSnapshot = {
  version: typeof WEB_DEMO_DATA_VERSION;
  videos: Video[];
  analysisTasks: AnalysisTask[];
  analysisResults: AnalysisResult[];
  cvDemoOutputs: WebCvDemoOutput[];
  analysisLogs: WebAnalysisTaskLogEntry[];
  analysisRuntimes: Record<string, WebAnalysisRuntime>;
};

export type WebDemoDataStorage = {
  read(): string | null;
  write(value: string): void;
};

export type WebClock = {
  now(): Date;
};

export const systemWebClock: WebClock = { now: () => new Date() };
