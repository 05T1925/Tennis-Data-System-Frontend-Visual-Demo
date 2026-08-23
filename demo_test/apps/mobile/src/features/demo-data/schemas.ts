import { z } from 'zod';

import { ANALYSIS_STAGES } from './transitions';
import { DEMO_DATA_VERSION } from './types';

const isoDateTime = z.iso.datetime({ offset: true });
const id = z.string().trim().min(1);
const finiteNonNegative = z.number().finite().nonnegative();
const nonNegativeInteger = z.number().finite().int().nonnegative();
const progress = z.number().finite().min(0).max(100);
const confidence = z.number().finite().min(0).max(1);

const courtPointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  confidence: confidence.optional(),
});
const videoSchema = z.object({
  id,
  userId: id,
  title: z.string(),
  originalFileName: z.string().min(1),
  storagePath: z.string().optional(),
  playbackUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  mimeType: z.string().min(1),
  fileSizeBytes: nonNegativeInteger,
  durationSeconds: finiteNonNegative.optional(),
  matchType: z.enum(['training', 'match']),
  playMode: z.enum(['singles', 'doubles']),
  courtType: z.enum(['hard', 'clay', 'grass', 'other']).optional(),
  note: z.string().optional(),
  uploadStatus: z.enum(['idle', 'uploading', 'uploaded', 'failed', 'canceled']),
  uploadProgress: progress,
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
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
const analysisTaskSchema = z.object({
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
});
const shotSchema = z.object({
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
});
const rallySchema = z.object({
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
});
const pointSchema = z.object({
  id,
  videoId: id,
  rallyId: id.optional(),
  pointIndex: nonNegativeInteger,
  startedAtMs: finiteNonNegative,
  endedAtMs: finiteNonNegative,
  winnerPlayerId: id.optional(),
  scoringResult: z.string().optional(),
  confidence: confidence.optional(),
});
const analysisResultSchema = z.object({
  id,
  videoId: id,
  version: z.string().min(1),
  summary: z.object({
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
  }),
  playerProfile: z
    .object({
      consistency: z.number().finite(),
      attack: z.number().finite(),
      defense: z.number().finite(),
      movement: z.number().finite(),
    })
    .optional(),
  shots: z.array(shotSchema),
  rallies: z.array(rallySchema),
  points: z.array(pointSchema).optional(),
  heatmapPoints: z.array(courtPointSchema),
  createdAt: isoDateTime,
});
const uploadRuntimeSchema = z.object({
  startedAt: isoDateTime,
  durationMs: z.number().finite().int().positive(),
  outcome: z.enum(['succeeded', 'failed']),
});
const analysisRuntimeSchema = z.object({
  startedAt: isoDateTime,
  stageDurationMs: z.number().finite().int().positive(),
  outcome: z.enum(['succeeded', 'failed']),
  failureStage: z.literal('ball_tracking').optional(),
});

function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length;
}

export const demoDataSnapshotSchema = z
  .object({
    version: z.literal(DEMO_DATA_VERSION),
    videos: z.array(videoSchema),
    analysisTasks: z.array(analysisTaskSchema),
    analysisResults: z.array(analysisResultSchema),
    runtime: z.object({
      uploads: z.record(z.string(), uploadRuntimeSchema),
      analyses: z.record(z.string(), analysisRuntimeSchema),
    }),
  })
  .superRefine((snapshot, context) => {
    const videoIdList = snapshot.videos.map(({ id: videoId }) => videoId);
    const taskIdList = snapshot.analysisTasks.map(({ id: taskId }) => taskId);
    const resultIdList = snapshot.analysisResults.map(({ id: resultId }) => resultId);
    const videoIds = new Set(videoIdList);
    const taskIds = new Set(taskIdList);
    const taskVideoIds = new Set<string>();
    const resultVideoIds = new Set<string>();

    if (hasDuplicates(videoIdList))
      context.addIssue({ code: 'custom', message: 'Video IDs must be unique.' });
    if (hasDuplicates(taskIdList))
      context.addIssue({ code: 'custom', message: 'Analysis task IDs must be unique.' });
    if (hasDuplicates(resultIdList))
      context.addIssue({ code: 'custom', message: 'Analysis result IDs must be unique.' });

    for (const video of snapshot.videos) {
      const hasRuntime = Object.hasOwn(snapshot.runtime.uploads, video.id);
      if (video.uploadStatus === 'uploading' && !hasRuntime)
        context.addIssue({ code: 'custom', message: 'Uploading video requires runtime metadata.' });
      if (video.uploadStatus === 'uploading' && video.uploadProgress >= 100)
        context.addIssue({
          code: 'custom',
          message: 'Uploading video progress must be below 100.',
        });
      if (video.uploadStatus === 'uploaded' && video.uploadProgress !== 100)
        context.addIssue({ code: 'custom', message: 'Uploaded video progress must be 100.' });
    }

    for (const task of snapshot.analysisTasks) {
      if (!videoIds.has(task.videoId) || taskVideoIds.has(task.videoId)) {
        context.addIssue({ code: 'custom', message: 'Invalid or duplicate task video relation.' });
      }
      taskVideoIds.add(task.videoId);
      const hasRuntime = Object.hasOwn(snapshot.runtime.analyses, task.id);
      if (['queued', 'processing'].includes(task.status) && !hasRuntime)
        context.addIssue({ code: 'custom', message: 'Active analysis task requires runtime.' });
      const expectedStage = ANALYSIS_STAGES.find(({ stage }) => stage === task.stage);
      if (
        task.status !== 'failed' &&
        task.status !== 'canceled' &&
        (expectedStage?.status !== task.status || expectedStage.progress !== task.progress)
      )
        context.addIssue({ code: 'custom', message: 'Task status, stage, and progress disagree.' });
      if (
        task.status === 'succeeded' &&
        (task.stage !== 'completed' || task.progress !== 100 || !task.completedAt)
      )
        context.addIssue({ code: 'custom', message: 'Succeeded task must be completed at 100.' });
      if (task.status === 'failed' && (!task.errorCode?.trim() || !task.errorMessage?.trim()))
        context.addIssue({ code: 'custom', message: 'Failed task requires an error.' });
    }
    for (const result of snapshot.analysisResults) {
      if (!videoIds.has(result.videoId) || resultVideoIds.has(result.videoId)) {
        context.addIssue({
          code: 'custom',
          message: 'Invalid or duplicate result video relation.',
        });
      }
      resultVideoIds.add(result.videoId);
      const matchingTask = snapshot.analysisTasks.find((task) => task.videoId === result.videoId);
      if (matchingTask?.status !== 'succeeded')
        context.addIssue({ code: 'custom', message: 'Result requires a succeeded task.' });
      if (
        result.summary.totalShots !== result.shots.length ||
        result.summary.totalRallies !== result.rallies.length ||
        (result.summary.totalPoints !== undefined &&
          result.summary.totalPoints !== (result.points?.length ?? 0))
      )
        context.addIssue({ code: 'custom', message: 'Result summary counts are inconsistent.' });

      const shotIdList = result.shots.map(({ id: shotId }) => shotId);
      const rallyIdList = result.rallies.map(({ id: rallyId }) => rallyId);
      const pointIdList = result.points?.map(({ id: pointId }) => pointId) ?? [];
      const shotIds = new Set(shotIdList);
      const rallyIds = new Set(rallyIdList);
      const pointIds = new Set(pointIdList);
      if (hasDuplicates(shotIdList) || hasDuplicates(rallyIdList) || hasDuplicates(pointIdList))
        context.addIssue({ code: 'custom', message: 'Result entity IDs must be unique.' });

      for (const shot of result.shots)
        if (shot.videoId !== result.videoId || !rallyIds.has(shot.rallyId))
          context.addIssue({ code: 'custom', message: 'Shot references missing rally.' });
      for (const rally of result.rallies)
        if (
          rally.videoId !== result.videoId ||
          rally.shotCount !== rally.shotIds.length ||
          rally.shotIds.some((shotId) => !shotIds.has(shotId)) ||
          (rally.pointId !== undefined &&
            (!pointIds.has(rally.pointId) ||
              result.points?.find((point) => point.id === rally.pointId)?.rallyId !== rally.id))
        )
          context.addIssue({ code: 'custom', message: 'Rally shot relation is invalid.' });
      for (const point of result.points ?? [])
        if (
          point.videoId !== result.videoId ||
          (point.rallyId !== undefined &&
            (!rallyIds.has(point.rallyId) ||
              result.rallies.find((rally) => rally.id === point.rallyId)?.pointId !== point.id))
        )
          context.addIssue({ code: 'custom', message: 'Point rally relation is invalid.' });
    }
    for (const videoId of Object.keys(snapshot.runtime.uploads)) {
      const video = snapshot.videos.find(({ id: candidate }) => candidate === videoId);
      if (!video || video.uploadStatus !== 'uploading')
        context.addIssue({
          code: 'custom',
          message: 'Upload runtime must reference an uploading video.',
        });
    }
    for (const taskId of Object.keys(snapshot.runtime.analyses)) {
      const task = snapshot.analysisTasks.find(({ id: candidate }) => candidate === taskId);
      if (!task || !taskIds.has(taskId) || !['queued', 'processing'].includes(task.status))
        context.addIssue({
          code: 'custom',
          message: 'Analysis runtime must reference an active task.',
        });
    }
  });
