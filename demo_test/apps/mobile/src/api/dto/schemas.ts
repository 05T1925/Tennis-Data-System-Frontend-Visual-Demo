import { z } from 'zod';

const id = z.string().trim().min(1);
const iso = z.iso.datetime({ offset: true });
const nonNegative = z.number().finite().nonnegative();
const nonNegativeInteger = z.number().finite().int().nonnegative();
const progress = z.number().finite().min(0).max(100);
const nullableString = z.string().nullable().optional();

export const userDtoSchema = z
  .object({
    id,
    email: z.email().optional(),
    phone: z.string().optional(),
    display_name: z.string().trim().min(1),
    role: z.enum(['user', 'admin', 'developer']),
    avatar_url: nullableString,
    created_at: iso,
    updated_at: iso.optional(),
  })
  .strict();

export const authDataDtoSchema = z
  .object({
    access_token: z.string().trim().min(1),
    expires_at: iso.optional(),
    user: userDtoSchema,
  })
  .strict();

export const videoDtoSchema = z
  .object({
    id,
    user_id: id,
    title: z.string(),
    original_file_name: z.string().min(1),
    storage_path: nullableString,
    playback_url: nullableString,
    thumbnail_url: nullableString,
    mime_type: z.string().trim().min(1),
    file_size_bytes: nonNegativeInteger,
    duration_seconds: nonNegative.nullable().optional(),
    match_type: z.enum(['training', 'match']),
    play_mode: z.enum(['singles', 'doubles']),
    court_type: z.enum(['hard', 'clay', 'grass', 'other']).nullable().optional(),
    note: nullableString,
    upload_status: z.enum(['idle', 'uploading', 'uploaded', 'failed', 'canceled']),
    upload_progress: progress,
    created_at: iso,
    updated_at: iso,
  })
  .strict();

export const taskDtoSchema = z
  .object({
    id,
    video_id: id,
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
    error_code: nullableString,
    error_message: nullableString,
    retry_count: nonNegativeInteger,
    created_at: iso,
    started_at: z.string().nullable().optional().pipe(iso.nullable().optional()),
    completed_at: z.string().nullable().optional().pipe(iso.nullable().optional()),
    updated_at: iso,
  })
  .strict()
  .superRefine((task, context) => {
    if (task.status === 'failed' && (!task.error_code?.trim() || !task.error_message?.trim())) {
      context.addIssue({ code: 'custom', message: 'Failed task requires an error.' });
    }
    if (task.status === 'queued' && (task.stage !== 'queued' || task.progress !== 0)) {
      context.addIssue({ code: 'custom', message: 'Queued task state is inconsistent.' });
    }
    if (
      task.status === 'succeeded' &&
      (task.stage !== 'completed' || task.progress !== 100 || !task.completed_at)
    ) {
      context.addIssue({ code: 'custom', message: 'Succeeded task state is inconsistent.' });
    }
  });

const point = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
    confidence: z.number().finite().min(0).max(1).nullable().optional(),
  })
  .strict();
const shot = z
  .object({
    id,
    video_id: id,
    rally_id: id,
    shot_index: nonNegativeInteger,
    player_id: nullableString,
    started_at_ms: nonNegative,
    ended_at_ms: nonNegative,
    start_point: point,
    end_point: point,
    bounce_point: point.nullable().optional(),
    speed_kmh: nonNegative.nullable().optional(),
    shot_type: z.enum(['serve', 'forehand', 'backhand', 'volley', 'unknown']).nullable().optional(),
    tactical_type: z
      .enum(['attack', 'defense', 'neutral', 'error', 'unknown'])
      .nullable()
      .optional(),
    confidence: z.number().finite().min(0).max(1).nullable().optional(),
  })
  .strict();
const rally = z
  .object({
    id,
    video_id: id,
    point_id: nullableString,
    rally_index: nonNegativeInteger,
    started_at_ms: nonNegative,
    ended_at_ms: nonNegative,
    shot_ids: z.array(id),
    shot_count: nonNegativeInteger,
    winner_player_id: nullableString,
    result: z.enum(['winner', 'forced_error', 'unforced_error', 'unknown']).nullable().optional(),
    confidence: z.number().finite().min(0).max(1).nullable().optional(),
  })
  .strict();
const pointRecord = z
  .object({
    id,
    video_id: id,
    rally_id: nullableString,
    point_index: nonNegativeInteger,
    started_at_ms: nonNegative,
    ended_at_ms: nonNegative,
    winner_player_id: nullableString,
    scoring_result: nullableString,
    confidence: z.number().finite().min(0).max(1).nullable().optional(),
  })
  .strict();

export const resultDtoSchema = z
  .object({
    id,
    video_id: id,
    algorithm_version: z.string().min(1).optional(),
    data_version: z.string().min(1).optional(),
    summary: z
      .object({
        duration_seconds: nonNegative,
        total_shots: nonNegativeInteger,
        total_rallies: nonNegativeInteger,
        total_points: nonNegativeInteger.nullable().optional(),
        average_shots_per_rally: nonNegative,
        longest_rally_shots: nonNegativeInteger,
        average_ball_speed_kmh: nonNegative.nullable().optional(),
        max_ball_speed_kmh: nonNegative.nullable().optional(),
        player_distance_meters: nonNegative.nullable().optional(),
        unforced_errors: nonNegativeInteger.nullable().optional(),
      })
      .strict(),
    player_profile: z
      .object({
        consistency: z.number().finite(),
        attack: z.number().finite(),
        defense: z.number().finite(),
        movement: z.number().finite(),
      })
      .strict()
      .nullable()
      .optional(),
    shots: z.array(shot),
    rallies: z.array(rally),
    points: z.array(pointRecord).nullable().optional(),
    heatmap_points: z.array(point),
    created_at: iso,
  })
  .strict()
  .refine((value) => Boolean(value.data_version ?? value.algorithm_version));

export const successEnvelope = <T extends z.ZodType>(data: T) =>
  z.object({ data, request_id: z.string().optional() }).strict();

export const authEnvelopeSchema = successEnvelope(authDataDtoSchema);
export const userEnvelopeSchema = successEnvelope(userDtoSchema);
export const videoRecordDtoSchema = z
  .object({ video: videoDtoSchema, analysis_task: taskDtoSchema.nullable() })
  .strict();
export const videoListEnvelopeSchema = successEnvelope(
  z
    .object({
      items: z.array(videoRecordDtoSchema),
      page: z.number().int().positive(),
      page_size: z.number().int().positive(),
      total: nonNegativeInteger,
      unfiltered_total: nonNegativeInteger.optional(),
    })
    .strict(),
);
export const videoDetailEnvelopeSchema = successEnvelope(videoRecordDtoSchema);
export const taskEnvelopeSchema = successEnvelope(
  z.object({ task: taskDtoSchema.nullable() }).strict(),
);
export const resultEnvelopeSchema = successEnvelope(
  z.object({ result: resultDtoSchema.nullable() }).strict(),
);

export type UserDto = z.infer<typeof userDtoSchema>;
export type VideoDto = z.infer<typeof videoDtoSchema>;
export type TaskDto = z.infer<typeof taskDtoSchema>;
export type ResultDto = z.infer<typeof resultDtoSchema>;
