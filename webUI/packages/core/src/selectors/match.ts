import type {
  DemoMatchBundle,
  EvidenceRef,
  MetricDimension,
  MetricPlayerSlot,
  MetricRecord,
  PointRecord,
  RallyRecord,
  ShotRecord,
  PlayerSlot,
} from '../domain/types';
const atTime = <T extends { startTimeMs: number; endTimeMs: number }>(
  items: readonly T[],
  timeMs: number,
  durationMs: number,
): T | null =>
  timeMs < 0 || timeMs > durationMs
    ? null
    : (items.find(
        (item) =>
          timeMs >= item.startTimeMs &&
          (timeMs < item.endTimeMs || (timeMs === durationMs && item.endTimeMs === durationMs)),
      ) ?? null);
export const findPointAtTime = (bundle: DemoMatchBundle, timeMs: number) =>
  atTime(bundle.points, timeMs, bundle.video.durationMs);
export const findRallyAtTime = (bundle: DemoMatchBundle, timeMs: number) =>
  atTime(bundle.rallies, timeMs, bundle.video.durationMs);
export const findShotAtTime = (bundle: DemoMatchBundle, timeMs: number) =>
  atTime(bundle.shots, timeMs, bundle.video.durationMs);
export const getMetricsByDimension = (
  bundle: DemoMatchBundle,
  dimension: MetricDimension,
): MetricRecord[] => bundle.metrics.filter((metric) => metric.dimension === dimension);
export const getMetricsByPlayer = (
  bundle: DemoMatchBundle,
  playerSlot: MetricPlayerSlot,
): MetricRecord[] => bundle.metrics.filter((metric) => metric.playerSlot === playerSlot);
export const getMetricByCode = (
  bundle: DemoMatchBundle,
  code: string,
  playerSlot?: MetricPlayerSlot,
): MetricRecord | null => {
  const matches = bundle.metrics.filter(
    (metric) =>
      metric.metricCode === code && (playerSlot === undefined || metric.playerSlot === playerSlot),
  );
  return matches.length === 1 ? matches[0]! : null;
};
export const getEvidenceByIds = (bundle: DemoMatchBundle, ids: readonly string[]): EvidenceRef[] =>
  bundle.evidences.filter((evidence) => ids.includes(evidence.evidenceId));
export const getEvidenceForMetric = (
  bundle: DemoMatchBundle,
  metric: MetricRecord,
): EvidenceRef[] => getEvidenceByIds(bundle, metric.evidenceIds);
export const getClipSeekTime = (clip: { startMs: number }): number => clip.startMs;
export const getRallyLengthCategory = (shotCount: number): 'short' | 'medium' | 'long' | null =>
  Number.isInteger(shotCount) && shotCount >= 1
    ? shotCount <= 4
      ? 'short'
      : shotCount <= 8
        ? 'medium'
        : 'long'
    : null;
export const getShotsForRally = (bundle: DemoMatchBundle, rally: RallyRecord): ShotRecord[] =>
  rally.shotIds
    .map((id) => bundle.shots.find((shot) => shot.id === id))
    .filter((shot): shot is ShotRecord => Boolean(shot));
export const getRallyForPoint = (bundle: DemoMatchBundle, point: PointRecord): RallyRecord | null =>
  bundle.rallies.find((rally) => rally.id === point.rallyId) ?? null;
export const getPointForShot = (bundle: DemoMatchBundle, shot: ShotRecord): PointRecord | null =>
  bundle.points.find((point) => point.id === shot.pointId) ?? null;

export const clampAnalysisTime = (timeMs: number, durationMs: number): number => {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return 0;
  if (!Number.isFinite(timeMs)) return 0;
  return Math.min(durationMs, Math.max(0, Math.round(timeMs)));
};

export const parseAnalysisTimeParam = (value: string | null, durationMs: number): number => {
  if (value === null || value.trim() === '') return 0;
  return clampAnalysisTime(Number(value), durationMs);
};

export const mapAnalysisTimeToMediaTime = (
  analysisTimeMs: number,
  analysisDurationMs: number,
  mediaDurationSeconds: number,
): number | null => {
  if (
    !Number.isFinite(analysisDurationMs) ||
    analysisDurationMs <= 0 ||
    !Number.isFinite(mediaDurationSeconds) ||
    mediaDurationSeconds <= 0
  )
    return null;
  return (
    (clampAnalysisTime(analysisTimeMs, analysisDurationMs) / analysisDurationMs) *
    mediaDurationSeconds
  );
};

export const mapMediaTimeToAnalysisTime = (
  mediaTimeSeconds: number,
  mediaDurationSeconds: number,
  analysisDurationMs: number,
): number | null => {
  if (
    !Number.isFinite(mediaTimeSeconds) ||
    !Number.isFinite(mediaDurationSeconds) ||
    mediaDurationSeconds <= 0 ||
    !Number.isFinite(analysisDurationMs) ||
    analysisDurationMs <= 0
  )
    return null;
  const clampedMediaTime = Math.min(mediaDurationSeconds, Math.max(0, mediaTimeSeconds));
  return Math.round((clampedMediaTime / mediaDurationSeconds) * analysisDurationMs);
};

export type PlaybackPhase = 'before' | 'point' | 'gap' | 'ended';
export interface PlaybackContext {
  timeMs: number;
  phase: PlaybackPhase;
  point: PointRecord | null;
  rally: RallyRecord | null;
  shot: ShotRecord | null;
  previousPoint: PointRecord | null;
  nextPoint: PointRecord | null;
  score: string;
}

export const getPlaybackContextAtTime = (
  bundle: DemoMatchBundle,
  requestedTimeMs: number,
): PlaybackContext => {
  const timeMs = clampAnalysisTime(requestedTimeMs, bundle.video.durationMs);
  const point = findPointAtTime(bundle, timeMs);
  const pointIndex = point ? bundle.points.findIndex((entry) => entry.id === point.id) : -1;
  const previousPoint = point
    ? pointIndex > 0
      ? bundle.points[pointIndex - 1]!
      : null
    : ([...bundle.points].reverse().find((entry) => entry.endTimeMs <= timeMs) ?? null);
  const nextPoint = point
    ? pointIndex < bundle.points.length - 1
      ? bundle.points[pointIndex + 1]!
      : null
    : (bundle.points.find((entry) => entry.startTimeMs > timeMs) ?? null);
  const lastPoint = bundle.points[bundle.points.length - 1] ?? null;
  const phase: PlaybackPhase = point
    ? 'point'
    : lastPoint && timeMs >= lastPoint.endTimeMs
      ? 'ended'
      : previousPoint
        ? 'gap'
        : 'before';
  return {
    timeMs,
    phase,
    point,
    rally: point ? getRallyForPoint(bundle, point) : null,
    shot: point ? findShotAtTime(bundle, timeMs) : null,
    previousPoint,
    nextPoint,
    score: point?.scoreBefore ?? previousPoint?.scoreAfter ?? '0-0',
  };
};

export const parsePlayerSlotParam = (value: string | null): PlayerSlot =>
  value === 'B' ? 'B' : 'A';

const finiteNonServeSpeeds = (bundle: DemoMatchBundle, playerSlot: PlayerSlot): number[] =>
  bundle.shots
    .filter(
      (shot) =>
        shot.playerSlot === playerSlot &&
        shot.strokeType !== 'serve' &&
        shot.speedMps !== null &&
        Number.isFinite(shot.speedMps) &&
        shot.speedMps >= 0,
    )
    .map((shot) => shot.speedMps as number);

const average = (values: readonly number[]): number | null =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const percentile = (values: readonly number[], percentileValue: number): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return (
    sorted[
      Math.min(sorted.length - 1, Math.max(0, Math.ceil(percentileValue * sorted.length) - 1))
    ] ?? null
  );
};

export interface ShotSpeedSummary {
  sampleSize: number;
  avgSpeedMps: number | null;
  p90SpeedMps: number | null;
  maxSpeedMps: number | null;
  forehandAvgSpeedMps: number | null;
  backhandAvgSpeedMps: number | null;
}

export const getShotSpeedSummary = (
  bundle: DemoMatchBundle,
  playerSlot: PlayerSlot,
): ShotSpeedSummary => {
  const relevantShots = bundle.shots.filter(
    (shot) => shot.playerSlot === playerSlot && shot.strokeType !== 'serve',
  );
  const speeds = finiteNonServeSpeeds(bundle, playerSlot);
  const speedsFor = (strokeType: ShotRecord['strokeType']) =>
    relevantShots
      .filter(
        (shot) =>
          shot.strokeType === strokeType &&
          shot.speedMps !== null &&
          Number.isFinite(shot.speedMps) &&
          shot.speedMps >= 0,
      )
      .map((shot) => shot.speedMps as number);
  return {
    sampleSize: speeds.length,
    avgSpeedMps: average(speeds),
    p90SpeedMps: percentile(speeds, 0.9),
    maxSpeedMps: speeds.length ? Math.max(...speeds) : null,
    forehandAvgSpeedMps: average(speedsFor('forehand')),
    backhandAvgSpeedMps: average(speedsFor('backhand')),
  };
};

export type RallyBand = 'short' | 'medium' | 'long';
export interface RallyDistributionItem {
  band: RallyBand;
  count: number;
  winRate: number | null;
  sampleSize: number;
}

export const getRallyDistribution = (
  bundle: DemoMatchBundle,
  playerSlot: PlayerSlot,
): RallyDistributionItem[] => {
  const definitions: { band: RallyBand; min: number; max: number | null }[] = [
    { band: 'short', min: 1, max: 4 },
    { band: 'medium', min: 5, max: 8 },
    { band: 'long', min: 9, max: null },
  ];
  return definitions.map(({ band, min, max }) => {
    const rallies = bundle.rallies.filter(
      (rally) => rally.shotCount >= min && (max === null || rally.shotCount <= max),
    );
    const won = rallies.filter(
      (rally) =>
        bundle.points.find((point) => point.id === rally.pointId)?.winnerSlot === playerSlot,
    ).length;
    return {
      band,
      count: rallies.length,
      sampleSize: rallies.length,
      winRate: rallies.length ? won / rallies.length : null,
    };
  });
};

export interface LandingPoint {
  shotId: string;
  strokeType: ShotRecord['strokeType'];
  result: ShotRecord['result'];
  errorClassification: ShotRecord['errorClassification'];
  isError: boolean;
  positionSource: 'bounce' | 'end';
  x: number;
  y: number;
}

export const getLandingPointsByPlayer = (
  bundle: DemoMatchBundle,
  playerSlot: PlayerSlot,
): LandingPoint[] =>
  bundle.shots.flatMap((shot) => {
    if (shot.playerSlot !== playerSlot || shot.strokeType === 'serve') return [];
    const isError =
      ['net', 'long', 'wide'].includes(shot.result) ||
      shot.errorClassification === 'forced' ||
      shot.errorClassification === 'unforced';
    const position = shot.bouncePoint ?? (isError ? shot.endPoint : null);
    if (
      position === null ||
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y) ||
      position.x < 0 ||
      position.x > 1 ||
      position.y < 0 ||
      position.y > 1
    )
      return [];
    return [
      {
        shotId: shot.id,
        strokeType: shot.strokeType,
        result: shot.result,
        errorClassification: shot.errorClassification,
        isError,
        positionSource: shot.bouncePoint ? 'bounce' : 'end',
        x: position.x,
        y: position.y,
      },
    ];
  });

export interface ServeLandingPoint {
  shotId: string;
  serveNumber: 'first' | 'second';
  direction: 'wide' | 'body' | 't' | 'unknown';
  courtSide: 'deuce' | 'ad';
  outcome: 'in' | 'fault' | 'ace' | 'service_winner';
  positionSource: 'bounce' | 'end';
  x: number;
  y: number;
}

export const getServeLandingPoints = (
  bundle: DemoMatchBundle,
  playerSlot: PlayerSlot,
): ServeLandingPoint[] =>
  bundle.shots.flatMap((shot) => {
    if (shot.playerSlot !== playerSlot || shot.serve === null) return [];
    const position = shot.bouncePoint ?? shot.endPoint;
    if (
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y) ||
      position.x < 0 ||
      position.x > 1 ||
      position.y < 0 ||
      position.y > 1
    )
      return [];
    return [
      {
        shotId: shot.id,
        serveNumber: shot.serve.serveNumber,
        direction: shot.serve.direction,
        courtSide: shot.serve.courtSide,
        outcome: shot.serve.outcome,
        positionSource: shot.bouncePoint ? 'bounce' : 'end',
        x: position.x,
        y: position.y,
      },
    ];
  });

export interface ServeDirectionSummary {
  direction: 'wide' | 'body' | 't';
  count: number;
  rate: number | null;
  sampleSize: number;
}

export const getServeDirectionSummary = (
  bundle: DemoMatchBundle,
  playerSlot: PlayerSlot,
): ServeDirectionSummary[] => {
  const serves = bundle.shots.filter(
    (shot) =>
      shot.playerSlot === playerSlot && shot.serve !== null && shot.serve.direction !== 'unknown',
  );
  return (['wide', 'body', 't'] as const).map((direction) => {
    const count = serves.filter((shot) => shot.serve?.direction === direction).length;
    return {
      direction,
      count,
      sampleSize: serves.length,
      rate: serves.length ? count / serves.length : null,
    };
  });
};

export interface OverviewInsight {
  kind: 'advantage' | 'issue' | 'neutral';
  playerSlot: MetricPlayerSlot;
  title: string;
  evidenceCode: string;
  sampleSize: number;
  dataTier: 'P0' | 'P1';
}

export const getOverviewInsights = (bundle: DemoMatchBundle): OverviewInsight[] => {
  const playerA = getRallyDistribution(bundle, 'A');
  const playerB = getRallyDistribution(bundle, 'B');
  const shortA = playerA.find((item) => item.band === 'short')!;
  const shortB = playerB.find((item) => item.band === 'short')!;
  const errorA = getMetricByCode(bundle, 'unforced_error_count', 'A')!;
  const errorB = getMetricByCode(bundle, 'unforced_error_count', 'B')!;
  const forcedA = getMetricByCode(bundle, 'forced_error_count', 'A')!;
  const forcedB = getMetricByCode(bundle, 'forced_error_count', 'B')!;
  const errorIssue: Omit<OverviewInsight, 'kind'> =
    (errorA.metricValue ?? 0) !== (errorB.metricValue ?? 0)
      ? {
          playerSlot: (errorA.metricValue ?? 0) > (errorB.metricValue ?? 0) ? 'A' : 'B',
          title: '非受迫失误更多，需要关注稳定性',
          evidenceCode: 'unforced_error_count',
          sampleSize: Math.max(errorA.sampleSize, errorB.sampleSize),
          dataTier: 'P1' as const,
        }
      : (forcedA.metricValue ?? 0) !== (forcedB.metricValue ?? 0)
        ? {
            playerSlot: (forcedA.metricValue ?? 0) > (forcedB.metricValue ?? 0) ? 'A' : 'B',
            title: '受迫失误更多，需要关注受压回合',
            evidenceCode: 'forced_error_count',
            sampleSize: Math.max(forcedA.sampleSize, forcedB.sampleSize),
            dataTier: 'P1' as const,
          }
        : {
            playerSlot: 'ALL' as const,
            title: '双方主要失误指标持平',
            evidenceCode: 'unforced_error_count',
            sampleSize: Math.max(errorA.sampleSize, errorB.sampleSize),
            dataTier: 'P1' as const,
          };
  return [
    {
      kind: 'advantage',
      playerSlot: (shortA.winRate ?? 0) >= (shortB.winRate ?? 0) ? 'A' : 'B',
      title: '短回合得分率更高',
      evidenceCode: 'short_rally_win_rate',
      sampleSize: shortA.sampleSize,
      dataTier: 'P0',
    },
    {
      kind: errorIssue.playerSlot === 'ALL' ? 'neutral' : 'issue',
      ...errorIssue,
    },
  ];
};
