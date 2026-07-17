import { z } from 'zod';

import { WEB_DEMO_DATA_VERSION } from './types';

const id = z.string().trim().min(1);
const isoDateTime = z.iso.datetime({ offset: true });
const finiteNonNegative = z.number().finite().nonnegative();
const progress = z.number().finite().min(0).max(100);

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

const analysisTaskSchema = z
  .object({
    id,
    videoId: id,
    status: z.enum(['queued', 'processing', 'succeeded', 'failed', 'canceled']),
    stage: z.enum([
      'queued',
      'court_detection',
      'player_detection',
      'ball_tracking',
      'trajectory_processing',
      'event_extraction',
      'statistics_generation',
      'completed',
    ]),
    progress,
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    retryCount: z.number().finite().int().nonnegative(),
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

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

export const webDemoDataSnapshotSchema = z
  .object({
    version: z.literal(WEB_DEMO_DATA_VERSION),
    videos: z.array(videoSchema),
    analysisTasks: z.array(analysisTaskSchema),
  })
  .strict()
  .superRefine((snapshot, context) => {
    const videoIds = snapshot.videos.map((video) => video.id);
    const taskIds = snapshot.analysisTasks.map((task) => task.id);
    if (hasDuplicates(videoIds)) {
      context.addIssue({ code: 'custom', message: 'Video IDs must be unique.' });
    }
    if (hasDuplicates(taskIds)) {
      context.addIssue({ code: 'custom', message: 'Task IDs must be unique.' });
    }

    const knownVideoIds = new Set(videoIds);
    const taskVideoIds = new Set<string>();
    for (const task of snapshot.analysisTasks) {
      if (!knownVideoIds.has(task.videoId) || taskVideoIds.has(task.videoId)) {
        context.addIssue({ code: 'custom', message: 'Task video relation is invalid.' });
      }
      taskVideoIds.add(task.videoId);
      const video = snapshot.videos.find((candidate) => candidate.id === task.videoId);
      if (video?.uploadStatus !== 'uploaded') {
        context.addIssue({ code: 'custom', message: 'Task requires an uploaded video.' });
      }
    }
  });
