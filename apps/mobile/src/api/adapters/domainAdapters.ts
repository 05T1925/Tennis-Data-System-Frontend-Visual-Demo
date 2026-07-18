import type {
  AnalysisResult,
  AnalysisTask,
  CourtPoint,
  RallyRecord,
  ShotRecord,
  User,
  Video,
} from '@tennis/shared-types';

import { createApiError } from '../errors';
import type { ResultDto, TaskDto, UserDto, VideoDto } from '../dto/schemas';

const defined = <T>(value: T | null | undefined): T | undefined => value ?? undefined;

export function adaptUserDto(dto: UserDto): User {
  return {
    id: dto.id,
    displayName: dto.display_name,
    email: dto.email,
    phone: dto.phone,
    role: dto.role,
    avatarUrl: defined(dto.avatar_url),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at ?? dto.created_at,
  };
}

export function adaptVideoDto(dto: VideoDto): Video {
  return {
    id: dto.id,
    userId: dto.user_id,
    title: dto.title,
    originalFileName: dto.original_file_name,
    storagePath: defined(dto.storage_path),
    playbackUrl: defined(dto.playback_url),
    thumbnailUrl: defined(dto.thumbnail_url),
    mimeType: dto.mime_type,
    fileSizeBytes: dto.file_size_bytes,
    durationSeconds: defined(dto.duration_seconds),
    matchType: dto.match_type,
    playMode: dto.play_mode,
    courtType: defined(dto.court_type),
    note: defined(dto.note),
    uploadStatus: dto.upload_status,
    uploadProgress: dto.upload_progress,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function adaptTaskDto(dto: TaskDto): AnalysisTask {
  return {
    id: dto.id,
    videoId: dto.video_id,
    status: dto.status,
    stage: dto.stage,
    progress: dto.progress,
    errorCode: defined(dto.error_code),
    errorMessage: defined(dto.error_message),
    retryCount: dto.retry_count,
    createdAt: dto.created_at,
    startedAt: defined(dto.started_at),
    completedAt: defined(dto.completed_at),
    updatedAt: dto.updated_at,
  };
}

function adaptPoint(dto: ResultDto['heatmap_points'][number]): CourtPoint {
  return { x: dto.x, y: dto.y, confidence: defined(dto.confidence) };
}

export function adaptResultDto(dto: ResultDto): AnalysisResult {
  const shots: ShotRecord[] = dto.shots.map((shot) => ({
    id: shot.id,
    videoId: shot.video_id,
    rallyId: shot.rally_id,
    shotIndex: shot.shot_index,
    playerId: defined(shot.player_id),
    startedAtMs: shot.started_at_ms,
    endedAtMs: shot.ended_at_ms,
    startPoint: adaptPoint(shot.start_point),
    endPoint: adaptPoint(shot.end_point),
    bouncePoint: shot.bounce_point ? adaptPoint(shot.bounce_point) : undefined,
    speedKmh: defined(shot.speed_kmh),
    shotType: defined(shot.shot_type),
    tacticalType: defined(shot.tactical_type),
    confidence: defined(shot.confidence),
  }));
  const rallies: RallyRecord[] = dto.rallies.map((rally) => ({
    id: rally.id,
    videoId: rally.video_id,
    pointId: defined(rally.point_id),
    rallyIndex: rally.rally_index,
    startedAtMs: rally.started_at_ms,
    endedAtMs: rally.ended_at_ms,
    shotIds: [...rally.shot_ids],
    shotCount: rally.shot_count,
    winnerPlayerId: defined(rally.winner_player_id),
    result: defined(rally.result),
    confidence: defined(rally.confidence),
  }));
  const points = dto.points?.map((point) => ({
    id: point.id,
    videoId: point.video_id,
    rallyId: defined(point.rally_id),
    pointIndex: point.point_index,
    startedAtMs: point.started_at_ms,
    endedAtMs: point.ended_at_ms,
    winnerPlayerId: defined(point.winner_player_id),
    scoringResult: defined(point.scoring_result),
    confidence: defined(point.confidence),
  }));
  const shotById = new Map(shots.map((shot) => [shot.id, shot]));
  const rallyById = new Map(rallies.map((rally) => [rally.id, rally]));
  const pointById = new Map((points ?? []).map((point) => [point.id, point]));
  const invalid =
    shotById.size !== shots.length ||
    rallyById.size !== rallies.length ||
    pointById.size !== (points?.length ?? 0) ||
    shots.some((shot) => {
      const owner = rallyById.get(shot.rallyId);
      return (
        shot.videoId !== dto.video_id ||
        !owner ||
        owner.shotIds.filter((shotId) => shotId === shot.id).length !== 1
      );
    }) ||
    rallies.some((rally) => {
      const uniqueShotIds = new Set(rally.shotIds);
      return (
        rally.videoId !== dto.video_id ||
        rally.shotCount !== rally.shotIds.length ||
        uniqueShotIds.size !== rally.shotIds.length ||
        rally.shotIds.some((shotId) => shotById.get(shotId)?.rallyId !== rally.id) ||
        (rally.pointId !== undefined && pointById.get(rally.pointId)?.rallyId !== rally.id)
      );
    }) ||
    (points ?? []).some(
      (point) =>
        point.videoId !== dto.video_id ||
        (point.rallyId !== undefined && rallyById.get(point.rallyId)?.pointId !== point.id),
    ) ||
    dto.summary.total_shots !== shots.length ||
    dto.summary.total_rallies !== rallies.length ||
    (dto.summary.total_points !== null &&
      dto.summary.total_points !== undefined &&
      dto.summary.total_points !== (points?.length ?? 0));
  if (invalid) throw createApiError('REAL_API_RESPONSE_INVALID');

  return {
    id: dto.id,
    videoId: dto.video_id,
    version: dto.data_version ?? dto.algorithm_version ?? '',
    summary: {
      durationSeconds: dto.summary.duration_seconds,
      totalShots: dto.summary.total_shots,
      totalRallies: dto.summary.total_rallies,
      totalPoints: defined(dto.summary.total_points),
      averageShotsPerRally: dto.summary.average_shots_per_rally,
      longestRallyShots: dto.summary.longest_rally_shots,
      averageBallSpeedKmh: defined(dto.summary.average_ball_speed_kmh),
      maxBallSpeedKmh: defined(dto.summary.max_ball_speed_kmh),
      playerDistanceMeters: defined(dto.summary.player_distance_meters),
      unforcedErrors: defined(dto.summary.unforced_errors),
    },
    playerProfile: dto.player_profile ?? undefined,
    shots,
    rallies,
    points,
    heatmapPoints: dto.heatmap_points.map(adaptPoint),
    createdAt: dto.created_at,
  };
}
