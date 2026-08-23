import type { ConfidenceScore, EntityId, IsoDateTimeString } from './common';

export type AnalysisStatus = 'queued' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export type AnalysisStage =
  | 'queued'
  | 'court_detection'
  | 'player_detection'
  | 'ball_tracking'
  | 'trajectory_processing'
  | 'event_extraction'
  | 'statistics_generation'
  | 'completed';

export interface AnalysisTask {
  id: EntityId;
  videoId: EntityId;
  /** Overall task lifecycle, separate from the current processing stage. */
  status: AnalysisStatus;
  /** Current processing step, separate from the overall task lifecycle. */
  stage: AnalysisStage;
  /** Expected range: 0-100. This interface does not perform runtime validation. */
  progress: number;
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: IsoDateTimeString;
  startedAt?: IsoDateTimeString;
  completedAt?: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

/**
 * A point in the court coordinate system, not a page pixel coordinate.
 * The coordinate meaning and range remain Draft pending agreement with the CV team.
 */
export interface CourtPoint {
  x: number;
  y: number;
  confidence?: ConfidenceScore;
}

export type ShotType = 'serve' | 'forehand' | 'backhand' | 'volley' | 'unknown';

export type TacticalType = 'attack' | 'defense' | 'neutral' | 'error' | 'unknown';

export interface ShotRecord {
  id: EntityId;
  videoId: EntityId;
  rallyId: EntityId;
  shotIndex: number;
  playerId?: EntityId;
  startedAtMs: number;
  endedAtMs: number;
  startPoint: CourtPoint;
  endPoint: CourtPoint;
  bouncePoint?: CourtPoint;
  speedKmh?: number;
  shotType?: ShotType;
  tacticalType?: TacticalType;
  confidence?: ConfidenceScore;
}

export type RallyResult = 'winner' | 'forced_error' | 'unforced_error' | 'unknown';

export interface RallyRecord {
  id: EntityId;
  videoId: EntityId;
  pointId?: EntityId;
  rallyIndex: number;
  startedAtMs: number;
  endedAtMs: number;
  shotIds: EntityId[];
  /** Must match shotIds length at runtime; the interface cannot enforce this invariant. */
  shotCount: number;
  winnerPlayerId?: EntityId;
  result?: RallyResult;
  confidence?: ConfidenceScore;
}

export interface PointRecord {
  id: EntityId;
  videoId: EntityId;
  rallyId?: EntityId;
  pointIndex: number;
  startedAtMs: number;
  endedAtMs: number;
  winnerPlayerId?: EntityId;
  scoringResult?: string;
  confidence?: ConfidenceScore;
}

/** Raw or near-raw CV data. Its payload contract is intentionally not part of AnalysisResult. */
export interface CvOutput<TPayload = unknown> {
  id: EntityId;
  videoId: EntityId;
  version: string;
  payload: TPayload;
  createdAt: IsoDateTimeString;
}

export interface AnalysisSummary {
  durationSeconds: number;
  totalShots: number;
  totalRallies: number;
  totalPoints?: number;
  averageShotsPerRally: number;
  longestRallyShots: number;
  averageBallSpeedKmh?: number;
  maxBallSpeedKmh?: number;
  playerDistanceMeters?: number;
  unforcedErrors?: number;
}

/**
 * Draft display scores. Their range and calculation are not yet fixed, and they are not an
 * official, medical, or professional rating.
 */
export interface PlayerProfile {
  consistency: number;
  attack: number;
  defense: number;
  movement: number;
}

/** Structured, consumer-facing analysis data; raw CV payload is kept in CvOutput. */
export interface AnalysisResult {
  id: EntityId;
  videoId: EntityId;
  version: string;
  summary: AnalysisSummary;
  playerProfile?: PlayerProfile;
  shots: ShotRecord[];
  rallies: RallyRecord[];
  points?: PointRecord[];
  heatmapPoints: CourtPoint[];
  createdAt: IsoDateTimeString;
}
