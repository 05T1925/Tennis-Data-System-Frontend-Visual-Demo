import type {
  AnalysisResult,
  AnalysisTask,
  ApiResponse,
  AppError,
  ProjectStage,
  RallyRecord,
  ShotRecord,
  User,
  Video,
} from '../src';

const createdAt = '2026-07-13T12:30:00.000Z';

const exampleProjectStage = 'stage-2' satisfies ProjectStage;
const stageZero = 'stage-0' satisfies ProjectStage;

const exampleUser = {
  id: 'user-1',
  displayName: 'Alex',
  email: 'alex@example.test',
  role: 'user',
  createdAt,
  updatedAt: createdAt,
} satisfies User;

const exampleVideo = {
  id: 'video-1',
  userId: exampleUser.id,
  title: 'Training session',
  originalFileName: 'training.mp4',
  mimeType: 'video/mp4',
  fileSizeBytes: 12_000_000,
  durationSeconds: 120,
  matchType: 'training',
  playMode: 'singles',
  courtType: 'hard',
  uploadStatus: 'uploaded',
  uploadProgress: 100,
  createdAt,
  updatedAt: createdAt,
} satisfies Video;

const exampleAnalysisTask = {
  id: 'task-1',
  videoId: exampleVideo.id,
  status: 'processing',
  stage: 'ball_tracking',
  progress: 50,
  retryCount: 0,
  createdAt,
  startedAt: createdAt,
  updatedAt: createdAt,
} satisfies AnalysisTask;

const exampleShot = {
  id: 'shot-1',
  videoId: exampleVideo.id,
  rallyId: 'rally-1',
  shotIndex: 0,
  startedAtMs: 1_000,
  endedAtMs: 1_400,
  startPoint: { x: 0.2, y: 0.8, confidence: 0.9 },
  endPoint: { x: 0.7, y: 0.3 },
  shotType: 'forehand',
  tacticalType: 'attack',
} satisfies ShotRecord;

const exampleRally = {
  id: 'rally-1',
  videoId: exampleVideo.id,
  pointId: 'point-1',
  rallyIndex: 0,
  startedAtMs: 900,
  endedAtMs: 2_000,
  shotIds: [exampleShot.id],
  shotCount: 1,
  result: 'winner',
} satisfies RallyRecord;

const exampleAnalysisResult = {
  id: 'result-1',
  videoId: exampleVideo.id,
  version: 'result-v0.1',
  summary: {
    durationSeconds: 120,
    totalShots: 1,
    totalRallies: 1,
    totalPoints: 1,
    averageShotsPerRally: 1,
    longestRallyShots: 1,
  },
  playerProfile: { consistency: 70, attack: 75, defense: 60, movement: 65 },
  shots: [exampleShot],
  rallies: [exampleRally],
  points: [
    {
      id: 'point-1',
      videoId: exampleVideo.id,
      rallyId: exampleRally.id,
      pointIndex: 0,
      startedAtMs: 900,
      endedAtMs: 2_000,
    },
  ],
  heatmapPoints: [{ x: 0.2, y: 0.8 }],
  createdAt,
} satisfies AnalysisResult;

const exampleResponse = {
  success: true,
  data: exampleAnalysisResult,
  requestId: 'request-1',
} satisfies ApiResponse<AnalysisResult>;

const exampleFailureResponse = {
  success: false,
  data: null,
  error: {
    code: 'ANALYSIS_FAILED',
    message: 'Analysis failed.',
  },
  requestId: 'request-2',
} satisfies ApiResponse<AnalysisResult>;

// @ts-expect-error A successful response must contain non-null AnalysisResult data.
const successResponseWithNullData: ApiResponse<AnalysisResult> = { success: true, data: null };

// @ts-expect-error A failed response must contain an error payload.
const failureResponseWithoutError: ApiResponse<AnalysisResult> = { success: false, data: null };

// @ts-expect-error A successful response cannot contain an error payload.
const successResponseWithError: ApiResponse<AnalysisResult> = {
  success: true,
  data: exampleAnalysisResult,
  error: { code: 'UNEXPECTED_ERROR', message: 'Unexpected error.' },
};

const exampleError = {
  code: 'ANALYSIS_FAILED',
  userMessage: 'Analysis failed. Please try again.',
  technicalMessage: 'Worker exited before producing a result.',
  retryable: true,
  requestId: exampleResponse.requestId,
} satisfies AppError;

const invalidUploadStatus = {
  ...exampleVideo,
  // @ts-expect-error processing belongs to AnalysisStatus, not UploadStatus.
  uploadStatus: 'processing',
} satisfies Video;

// @ts-expect-error AnalysisResult must include a version.
const resultWithoutVersion: AnalysisResult = {
  id: 'result-2',
  videoId: exampleVideo.id,
  summary: exampleAnalysisResult.summary,
  shots: [],
  rallies: [],
  heatmapPoints: [],
  createdAt,
};

export {
  exampleAnalysisResult,
  exampleAnalysisTask,
  exampleError,
  exampleFailureResponse,
  exampleProjectStage,
  exampleRally,
  exampleResponse,
  exampleShot,
  exampleUser,
  exampleVideo,
  failureResponseWithoutError,
  invalidUploadStatus,
  resultWithoutVersion,
  stageZero,
  successResponseWithError,
  successResponseWithNullData,
};
