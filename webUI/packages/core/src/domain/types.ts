export type PlayerSlot = 'A' | 'B';
export type MetricPlayerSlot = PlayerSlot | 'ALL';
export type DataTier = 'P0' | 'P1' | 'P2';
export type ScopeType = 'upload' | 'set' | 'game' | 'point' | 'history';
export type MetricDimension = 'overview' | 'scoring' | 'serve' | 'return' | 'rally' | 'movement';

export interface CourtPoint {
  x: number;
  y: number;
}
export interface Video {
  id: string;
  uploadId: string;
  title: string;
  originalFileName: string;
  durationMs: number;
  matchType: 'training' | 'match';
  playMode: 'singles' | 'doubles';
  courtType: 'hard' | 'clay' | 'grass' | 'other';
  playbackUrl?: string;
  algorithmVersion: string;
  createdAt: string;
}
export type ServeNumber = 'first' | 'second';
export type ServeDirection = 'wide' | 'body' | 't' | 'unknown';
export type ServeCourtSide = 'deuce' | 'ad';
export type ServeOutcome = 'in' | 'fault' | 'ace' | 'service_winner';
export interface ServeMetadata {
  serveNumber: ServeNumber;
  direction: ServeDirection;
  courtSide: ServeCourtSide;
  outcome: ServeOutcome;
}
export type ErrorClassification = 'forced' | 'unforced' | 'unknown';
export interface ShotRecord {
  id: string;
  pointId: string;
  rallyId: string;
  shotIndex: number;
  playerSlot: PlayerSlot;
  startTimeMs: number;
  endTimeMs: number;
  strokeType: 'serve' | 'forehand' | 'backhand' | 'volley' | 'unknown';
  serve: ServeMetadata | null;
  result: 'in' | 'winner' | 'net' | 'long' | 'wide' | 'unknown';
  errorClassification: ErrorClassification | null;
  speedMps: number | null;
  startPoint: CourtPoint;
  bouncePoint: CourtPoint | null;
  endPoint: CourtPoint;
  confidence: number;
}
export interface RallyRecord {
  id: string;
  pointId: string;
  shotIds: string[];
  startTimeMs: number;
  endTimeMs: number;
  shotCount: number;
}
export interface PointRecord {
  id: string;
  pointIndex: number;
  rallyId: string;
  serverSlot: PlayerSlot;
  receiverSlot: PlayerSlot;
  winnerSlot: PlayerSlot;
  startTimeMs: number;
  endTimeMs: number;
  scoreBefore: string;
  scoreAfter: string;
  endReason:
    | 'ace'
    | 'service_winner'
    | 'winner'
    | 'double_fault'
    | 'forced_error'
    | 'unforced_error'
    | 'net'
    | 'long'
    | 'wide'
    | 'unknown';
  isKeyPoint: boolean;
}
export interface EvidenceRef {
  evidenceId: string;
  evidenceType: 'point' | 'rally' | 'shot' | 'clip' | 'derived';
  pointIds: string[];
  rallyIds: string[];
  shotIds: string[];
  clipStartMs: number;
  clipEndMs: number;
  label: string;
}
export interface ClipRef {
  clipId: string;
  title: string;
  startMs: number;
  endMs: number;
  type: 'winner' | 'long_rally' | 'serve' | 'error' | 'highlight';
  playerSlot?: PlayerSlot;
  pointId?: string;
  rallyId?: string;
}
export interface MetricRecord {
  uploadId: string;
  playerSlot: MetricPlayerSlot;
  metricCode: string;
  metricName: string;
  metricValue: number | null;
  metricUnit: string;
  sampleSize: number;
  scopeType: ScopeType;
  scopeId: string;
  dimension: MetricDimension;
  confidence: number;
  algorithmVersion: string;
  createdAt: string;
  dataTier: DataTier;
  evidenceIds: string[];
}
export interface DemoMatchBundle {
  video: Video;
  players: { A: { displayName: string }; B: { displayName: string } };
  shots: ShotRecord[];
  rallies: RallyRecord[];
  points: PointRecord[];
  evidences: EvidenceRef[];
  clips: ClipRef[];
  metrics: MetricRecord[];
}
