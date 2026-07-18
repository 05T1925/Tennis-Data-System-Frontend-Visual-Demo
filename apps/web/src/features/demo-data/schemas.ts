import { z } from 'zod';

import {
  MAX_WEB_CV_DEMO_BYTES,
  MAX_WEB_DEMO_SNAPSHOT_BYTES,
  WEB_CV_DEMO_SCHEMA,
  WEB_DEMO_DATA_V1_VERSION,
  WEB_DEMO_DATA_VERSION,
} from './types';
import type { JsonSafeValue } from './types';

const id = z.string().trim().min(1);
const isoDateTime = z.iso.datetime({ offset: true });
const finiteNonNegative = z.number().finite().nonnegative();
const nonNegativeInteger = z.number().finite().int().nonnegative();
const progress = z.number().finite().min(0).max(100);
const confidence = z.number().finite().min(0).max(1);
const normalizedCoordinate = z.number().finite().min(0).max(1);

const videoSchema = z
  .object({
    id,
    userId: id,
    title: z.string(),
    originalFileName: z.string(),
    storagePath: z.string().optional(),
    playbackUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    mimeType: z.string(),
    fileSizeBytes: finiteNonNegative,
    durationSeconds: finiteNonNegative.optional(),
    matchType: z.enum(['training', 'match']),
    playMode: z.enum(['singles', 'doubles']),
    courtType: z.enum(['hard', 'clay', 'grass', 'other']).optional(),
    note: z.string().optional(),
    uploadStatus: z.enum(['idle', 'uploading', 'uploaded', 'failed', 'canceled']),
    uploadProgress: progress,
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .strict()
  .superRefine((video, context) => {
    if (video.uploadStatus === 'uploaded' && video.uploadProgress !== 100) {
      context.addIssue({ code: 'custom', message: 'Uploaded video progress must be 100.' });
    }
    if (video.uploadStatus === 'uploading' && video.uploadProgress >= 100) {
      context.addIssue({ code: 'custom', message: 'Uploading progress must be below 100.' });
    }
  });

const analysisStageSchema = z.enum([
  'queued',
  'court_detection',
  'player_detection',
  'ball_tracking',
  'trajectory_processing',
  'event_extraction',
  'statistics_generation',
  'completed',
]);

const analysisTaskSchema = z
  .object({
    id,
    videoId: id,
    status: z.enum(['queued', 'processing', 'succeeded', 'failed', 'canceled']),
    stage: analysisStageSchema,
    progress,
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    retryCount: nonNegativeInteger,
    createdAt: isoDateTime,
    startedAt: isoDateTime.optional(),
    completedAt: isoDateTime.optional(),
    updatedAt: isoDateTime,
  })
  .strict()
  .superRefine((task, context) => {
    if (
      task.status === 'succeeded' &&
      (task.stage !== 'completed' || task.progress !== 100 || task.completedAt === undefined)
    ) {
      context.addIssue({ code: 'custom', message: 'Succeeded task must be completed at 100.' });
    }
    if (task.status === 'failed' && (!task.errorCode?.trim() || !task.errorMessage?.trim())) {
      context.addIssue({ code: 'custom', message: 'Failed task requires a safe error.' });
    }
    if (task.status === 'queued' && (task.stage !== 'queued' || task.progress !== 0)) {
      context.addIssue({ code: 'custom', message: 'Queued task must use queued stage at 0.' });
    }
    if (task.status === 'processing' && ['queued', 'completed'].includes(task.stage)) {
      context.addIssue({ code: 'custom', message: 'Processing task requires an active stage.' });
    }
  });

const courtPointSchema = z
  .object({ x: z.number().finite(), y: z.number().finite(), confidence: confidence.optional() })
  .strict();
const shotSchema = z
  .object({
    id,
    videoId: id,
    rallyId: id,
    shotIndex: nonNegativeInteger,
    playerId: id.optional(),
    startedAtMs: finiteNonNegative,
    endedAtMs: finiteNonNegative,
    startPoint: courtPointSchema,
    endPoint: courtPointSchema,
    bouncePoint: courtPointSchema.optional(),
    speedKmh: finiteNonNegative.optional(),
    shotType: z.enum(['serve', 'forehand', 'backhand', 'volley', 'unknown']).optional(),
    tacticalType: z.enum(['attack', 'defense', 'neutral', 'error', 'unknown']).optional(),
    confidence: confidence.optional(),
  })
  .strict();
const rallySchema = z
  .object({
    id,
    videoId: id,
    pointId: id.optional(),
    rallyIndex: nonNegativeInteger,
    startedAtMs: finiteNonNegative,
    endedAtMs: finiteNonNegative,
    shotIds: z.array(id),
    shotCount: nonNegativeInteger,
    winnerPlayerId: id.optional(),
    result: z.enum(['winner', 'forced_error', 'unforced_error', 'unknown']).optional(),
    confidence: confidence.optional(),
  })
  .strict();
const pointSchema = z
  .object({
    id,
    videoId: id,
    rallyId: id.optional(),
    pointIndex: nonNegativeInteger,
    startedAtMs: finiteNonNegative,
    endedAtMs: finiteNonNegative,
    winnerPlayerId: id.optional(),
    scoringResult: z.string().optional(),
    confidence: confidence.optional(),
  })
  .strict();

const analysisResultSchema = z
  .object({
    id,
    videoId: id,
    version: z.string().min(1),
    summary: z
      .object({
        durationSeconds: finiteNonNegative,
        totalShots: nonNegativeInteger,
        totalRallies: nonNegativeInteger,
        totalPoints: nonNegativeInteger.optional(),
        averageShotsPerRally: finiteNonNegative,
        longestRallyShots: nonNegativeInteger,
        averageBallSpeedKmh: finiteNonNegative.optional(),
        maxBallSpeedKmh: finiteNonNegative.optional(),
        playerDistanceMeters: finiteNonNegative.optional(),
        unforcedErrors: nonNegativeInteger.optional(),
      })
      .strict(),
    playerProfile: z
      .object({
        consistency: z.number().finite(),
        attack: z.number().finite(),
        defense: z.number().finite(),
        movement: z.number().finite(),
      })
      .strict()
      .optional(),
    shots: z.array(shotSchema),
    rallies: z.array(rallySchema),
    points: z.array(pointSchema).optional(),
    heatmapPoints: z.array(courtPointSchema),
    createdAt: isoDateTime,
  })
  .strict();

const jsonSafeValueSchema: z.ZodType<JsonSafeValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonSafeValueSchema),
    z.record(z.string(), jsonSafeValueSchema),
  ]),
);
const trackSampleSchema = z
  .object({
    frameIndex: nonNegativeInteger,
    timestampMs: finiteNonNegative,
    x: normalizedCoordinate,
    y: normalizedCoordinate,
    confidence: confidence.optional(),
  })
  .strict();
const cvPayloadSchema = z
  .object({
    disclaimer: z.string().min(1),
    generatedAt: isoDateTime,
    frameCount: nonNegativeInteger,
    courtKeypoints: z
      .array(
        z
          .object({
            id,
            label: z.string().min(1),
            x: normalizedCoordinate,
            y: normalizedCoordinate,
            confidence: confidence.optional(),
          })
          .strict(),
      )
      .optional(),
    playerTracks: z
      .array(z.object({ playerId: id, samples: z.array(trackSampleSchema) }).strict())
      .optional(),
    ballTrack: z.array(trackSampleSchema.extend({ visible: z.boolean() }).strict()).optional(),
    frameConfidences: z
      .array(
        z
          .object({
            frameIndex: nonNegativeInteger,
            court: confidence.optional(),
            players: confidence.optional(),
            ball: confidence.optional(),
            overall: confidence.optional(),
          })
          .strict(),
      )
      .optional(),
    metadata: jsonSafeValueSchema.optional(),
  })
  .strict();
const cvDemoOutputSchema = z
  .object({
    id,
    taskId: id,
    demoSchema: z.literal(WEB_CV_DEMO_SCHEMA),
    output: z
      .object({
        id,
        videoId: id,
        version: z.string().min(1),
        payload: cvPayloadSchema,
        createdAt: isoDateTime,
      })
      .strict(),
  })
  .strict()
  .superRefine((output, context) => {
    if (utf8ByteLength(JSON.stringify(output)) > MAX_WEB_CV_DEMO_BYTES) {
      context.addIssue({ code: 'custom', message: 'CV Demo output exceeds the size limit.' });
    }
  });

const unsafeLogPattern = /technicalMessage|\bstack\b|\btoken\b|[a-z]:\\|https?:\/\//i;
const logSchema = z
  .object({
    id,
    taskId: id,
    timestamp: isoDateTime,
    level: z.enum(['info', 'warning', 'error']),
    audience: z.enum(['user', 'developer']),
    userMessage: z.string().optional(),
    developerMessage: z.string().optional(),
    stage: analysisStageSchema.optional(),
  })
  .strict()
  .superRefine((log, context) => {
    if (log.audience === 'user' && !log.userMessage?.trim()) {
      context.addIssue({ code: 'custom', message: 'User log requires userMessage.' });
    }
    if (log.audience === 'developer' && !log.developerMessage?.trim()) {
      context.addIssue({ code: 'custom', message: 'Developer log requires developerMessage.' });
    }
    if (unsafeLogPattern.test(`${log.userMessage ?? ''} ${log.developerMessage ?? ''}`)) {
      context.addIssue({ code: 'custom', message: 'Log contains unsafe technical data.' });
    }
  });
const runtimeSchema = z
  .object({ taskId: id, attempt: nonNegativeInteger, queuedAt: isoDateTime })
  .strict();

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

export const webDemoDataSnapshotV1Schema = z
  .object({
    version: z.literal(WEB_DEMO_DATA_V1_VERSION),
    videos: z.array(videoSchema),
    analysisTasks: z.array(analysisTaskSchema),
  })
  .strict()
  .superRefine(validateVideoTaskRelations);

export const webDemoDataSnapshotV2Schema = z
  .object({
    version: z.literal(WEB_DEMO_DATA_VERSION),
    videos: z.array(videoSchema),
    analysisTasks: z.array(analysisTaskSchema),
    analysisResults: z.array(analysisResultSchema),
    cvDemoOutputs: z.array(cvDemoOutputSchema),
    analysisLogs: z.array(logSchema),
    analysisRuntimes: z.record(z.string(), runtimeSchema),
  })
  .strict()
  .superRefine((snapshot, context) => {
    validateVideoTaskRelations(snapshot, context);
    const videoIds = new Set(snapshot.videos.map(({ id: videoId }) => videoId));
    const tasks = new Map(snapshot.analysisTasks.map((task) => [task.id, task]));
    const taskByVideo = new Map(snapshot.analysisTasks.map((task) => [task.videoId, task]));
    const resultIds = snapshot.analysisResults.map(({ id: resultId }) => resultId);
    const resultVideoIds = snapshot.analysisResults.map(({ videoId }) => videoId);
    if (hasDuplicates(resultIds) || hasDuplicates(resultVideoIds)) {
      context.addIssue({
        code: 'custom',
        message: 'Result IDs and video relations must be unique.',
      });
    }
    for (const result of snapshot.analysisResults) {
      const task = taskByVideo.get(result.videoId);
      if (!videoIds.has(result.videoId) || task?.status !== 'succeeded') {
        context.addIssue({ code: 'custom', message: 'Result requires a succeeded task.' });
      }
      if (
        result.summary.totalShots !== result.shots.length ||
        result.summary.totalRallies !== result.rallies.length ||
        (result.summary.totalPoints !== undefined &&
          result.summary.totalPoints !== (result.points?.length ?? 0))
      ) {
        context.addIssue({ code: 'custom', message: 'Result summary counts are inconsistent.' });
      }
      validateResultRelations(result, context);
    }

    const cvIds = snapshot.cvDemoOutputs.map(({ id: cvId }) => cvId);
    const cvVideoIds = snapshot.cvDemoOutputs.map(({ output }) => output.videoId);
    if (hasDuplicates(cvIds) || hasDuplicates(cvVideoIds)) {
      context.addIssue({ code: 'custom', message: 'CV IDs and video relations must be unique.' });
    }
    for (const cv of snapshot.cvDemoOutputs) {
      const task = tasks.get(cv.taskId);
      if (!task || task.status !== 'succeeded' || task.videoId !== cv.output.videoId) {
        context.addIssue({ code: 'custom', message: 'CV output requires its succeeded task.' });
      }
    }

    const logIds = snapshot.analysisLogs.map(({ id: logId }) => logId);
    if (hasDuplicates(logIds)) {
      context.addIssue({ code: 'custom', message: 'Log IDs must be unique.' });
    }
    for (const log of snapshot.analysisLogs) {
      if (!tasks.has(log.taskId)) {
        context.addIssue({ code: 'custom', message: 'Log requires an existing task.' });
      }
    }
    for (const [taskId, runtime] of Object.entries(snapshot.analysisRuntimes)) {
      const task = tasks.get(taskId);
      if (
        runtime.taskId !== taskId ||
        !task ||
        !['queued', 'processing'].includes(task.status) ||
        runtime.attempt !== task.retryCount
      ) {
        context.addIssue({ code: 'custom', message: 'Analysis runtime relation is invalid.' });
      }
    }
    if (utf8ByteLength(JSON.stringify(snapshot)) > MAX_WEB_DEMO_SNAPSHOT_BYTES) {
      context.addIssue({ code: 'custom', message: 'Web Demo snapshot exceeds the size limit.' });
    }
  });

export const webDemoDataSnapshotSchema = webDemoDataSnapshotV2Schema;

function validateVideoTaskRelations(
  snapshot: {
    videos: z.infer<typeof videoSchema>[];
    analysisTasks: z.infer<typeof analysisTaskSchema>[];
  },
  context: z.RefinementCtx,
): void {
  const videoIds = snapshot.videos.map(({ id: videoId }) => videoId);
  const taskIds = snapshot.analysisTasks.map(({ id: taskId }) => taskId);
  const taskVideoIds = snapshot.analysisTasks.map(({ videoId }) => videoId);
  if (hasDuplicates(videoIds))
    context.addIssue({ code: 'custom', message: 'Video IDs must be unique.' });
  if (hasDuplicates(taskIds))
    context.addIssue({ code: 'custom', message: 'Task IDs must be unique.' });
  if (hasDuplicates(taskVideoIds))
    context.addIssue({ code: 'custom', message: 'Each video can have at most one task.' });
  const videos = new Map(snapshot.videos.map((video) => [video.id, video]));
  for (const task of snapshot.analysisTasks) {
    if (videos.get(task.videoId)?.uploadStatus !== 'uploaded') {
      context.addIssue({ code: 'custom', message: 'Task requires an uploaded video.' });
    }
  }
}

function validateResultRelations(
  result: z.infer<typeof analysisResultSchema>,
  context: z.RefinementCtx,
): void {
  const shotIds = result.shots.map(({ id: shotId }) => shotId);
  const rallyIds = result.rallies.map(({ id: rallyId }) => rallyId);
  const pointIds = result.points?.map(({ id: pointId }) => pointId) ?? [];
  if (hasDuplicates(shotIds) || hasDuplicates(rallyIds) || hasDuplicates(pointIds)) {
    context.addIssue({ code: 'custom', message: 'Result entity IDs must be unique.' });
  }
  const shotSet = new Set(shotIds);
  const rallySet = new Set(rallyIds);
  const pointSet = new Set(pointIds);
  for (const shot of result.shots) {
    if (shot.videoId !== result.videoId || !rallySet.has(shot.rallyId)) {
      context.addIssue({ code: 'custom', message: 'Shot rally relation is invalid.' });
    }
  }
  for (const rally of result.rallies) {
    if (
      rally.videoId !== result.videoId ||
      rally.shotCount !== rally.shotIds.length ||
      rally.shotIds.some((shotId) => !shotSet.has(shotId)) ||
      (rally.pointId !== undefined && !pointSet.has(rally.pointId))
    ) {
      context.addIssue({ code: 'custom', message: 'Rally relation is invalid.' });
    }
  }
  for (const point of result.points ?? []) {
    if (
      point.videoId !== result.videoId ||
      (point.rallyId !== undefined && !rallySet.has(point.rallyId))
    ) {
      context.addIssue({ code: 'custom', message: 'Point relation is invalid.' });
    }
  }
}
