import type {
  DemoMatchBundle,
  ErrorClassification,
  MetricRecord,
  PointRecord,
  PlayerSlot,
  RallyRecord,
  ServeDirection,
  ServeMetadata,
  ServeOutcome,
  ShotRecord,
} from '../domain/types';
import { getMetricDefinition, metricDefinitions } from '../domain/metricDefinitions';

const uploadId = 'demo-upload-001';
const algorithmVersion = 'fixture-v1.1.0';
const createdAt = '2026-07-24T12:00:00.000Z';
const durationMs = 120_000;
type Scenario = {
  serverSlot: PlayerSlot;
  endReason: PointRecord['endReason'];
  serveOutcomes: ServeOutcome[];
  serveDirections: ServeDirection[];
  rallyShotCount: number;
  terminalStroke: ShotRecord['strokeType'];
};
const scenarios: readonly Scenario[] = [
  {
    serverSlot: 'A',
    endReason: 'ace',
    serveOutcomes: ['ace'],
    serveDirections: ['t'],
    rallyShotCount: 0,
    terminalStroke: 'serve',
  },
  {
    serverSlot: 'B',
    endReason: 'double_fault',
    serveOutcomes: ['fault', 'fault'],
    serveDirections: ['wide', 'body'],
    rallyShotCount: 0,
    terminalStroke: 'serve',
  },
  {
    serverSlot: 'A',
    endReason: 'winner',
    serveOutcomes: ['fault', 'in'],
    serveDirections: ['wide', 't'],
    rallyShotCount: 4,
    terminalStroke: 'forehand',
  },
  {
    serverSlot: 'B',
    endReason: 'forced_error',
    serveOutcomes: ['in'],
    serveDirections: ['body'],
    rallyShotCount: 5,
    terminalStroke: 'backhand',
  },
  {
    serverSlot: 'A',
    endReason: 'unforced_error',
    serveOutcomes: ['in'],
    serveDirections: ['wide'],
    rallyShotCount: 6,
    terminalStroke: 'forehand',
  },
  {
    serverSlot: 'B',
    endReason: 'net',
    serveOutcomes: ['fault', 'in'],
    serveDirections: ['t', 'body'],
    rallyShotCount: 6,
    terminalStroke: 'backhand',
  },
  {
    serverSlot: 'A',
    endReason: 'long',
    serveOutcomes: ['in'],
    serveDirections: ['t'],
    rallyShotCount: 8,
    terminalStroke: 'forehand',
  },
  {
    serverSlot: 'B',
    endReason: 'wide',
    serveOutcomes: ['in'],
    serveDirections: ['wide'],
    rallyShotCount: 9,
    terminalStroke: 'backhand',
  },
  {
    serverSlot: 'A',
    endReason: 'service_winner',
    serveOutcomes: ['service_winner'],
    serveDirections: ['body'],
    rallyShotCount: 0,
    terminalStroke: 'serve',
  },
  {
    serverSlot: 'B',
    endReason: 'winner',
    serveOutcomes: ['in'],
    serveDirections: ['t'],
    rallyShotCount: 4,
    terminalStroke: 'backhand',
  },
  {
    serverSlot: 'A',
    endReason: 'forced_error',
    serveOutcomes: ['fault', 'in'],
    serveDirections: ['wide', 'body'],
    rallyShotCount: 4,
    terminalStroke: 'forehand',
  },
  {
    serverSlot: 'B',
    endReason: 'unforced_error',
    serveOutcomes: ['fault', 'in'],
    serveDirections: ['t', 'wide'],
    rallyShotCount: 6,
    terminalStroke: 'backhand',
  },
];

const opponent = (slot: PlayerSlot): PlayerSlot => (slot === 'A' ? 'B' : 'A');
const errorClassificationFor = (reason: PointRecord['endReason']): ErrorClassification | null =>
  reason === 'forced_error' ? 'forced' : reason === 'unforced_error' ? 'unforced' : null;
const resultFor = (reason: PointRecord['endReason'], terminal: boolean): ShotRecord['result'] => {
  if (!terminal) return 'in';
  if (reason === 'winner' || reason === 'ace' || reason === 'service_winner') return 'winner';
  if (reason === 'net') return 'net';
  if (reason === 'long') return 'long';
  if (reason === 'wide' || reason === 'double_fault') return 'wide';
  return 'unknown';
};
const serveResult = (outcome: ServeOutcome): ShotRecord['result'] =>
  outcome === 'fault' ? 'wide' : outcome === 'in' ? 'in' : 'winner';

const points: PointRecord[] = [];
const rallies: RallyRecord[] = [];
const shots: ShotRecord[] = [];
let clock = 5_000;
scenarios.forEach((scenario, pointIndex) => {
  const pointId = `point-${pointIndex + 1}`;
  const rallyId = `rally-${pointIndex + 1}`;
  const receiverSlot = opponent(scenario.serverSlot);
  const shotIds: string[] = [];
  let shotIndex = 0;
  const addShot = (
    playerSlot: PlayerSlot,
    strokeType: ShotRecord['strokeType'],
    result: ShotRecord['result'],
    serve: ServeMetadata | null,
    errorClassification: ErrorClassification | null,
  ) => {
    shotIndex += 1;
    const id = `${rallyId}-shot-${shotIndex}`;
    const startTimeMs = clock + (shotIndex - 1) * 650;
    const endTimeMs = startTimeMs + 480;
    shots.push({
      id,
      pointId,
      rallyId,
      shotIndex,
      playerSlot,
      startTimeMs,
      endTimeMs,
      strokeType,
      serve,
      result,
      errorClassification,
      speedMps:
        result === 'wide' && serve?.outcome === 'fault'
          ? null
          : 23 + ((pointIndex * 5 + shotIndex) % 15),
      startPoint: { x: playerSlot === 'A' ? 0.25 : 0.75, y: playerSlot === 'A' ? 0.8 : 0.2 },
      bouncePoint:
        result === 'net' || result === 'wide'
          ? null
          : {
              x: 0.2 + ((pointIndex + shotIndex) % 5) * 0.14,
              y: 0.25 + ((pointIndex + shotIndex) % 4) * 0.16,
            },
      endPoint: { x: playerSlot === 'A' ? 0.7 : 0.3, y: playerSlot === 'A' ? 0.25 : 0.75 },
      confidence: 0.9 - (shotIndex % 3) * 0.02,
    });
    shotIds.push(id);
  };
  scenario.serveOutcomes.forEach((outcome, serveIndex) => {
    addShot(
      scenario.serverSlot,
      'serve',
      serveResult(outcome),
      {
        serveNumber: serveIndex === 0 ? 'first' : 'second',
        direction: scenario.serveDirections[serveIndex] ?? 'unknown',
        courtSide: pointIndex % 2 === 0 ? 'deuce' : 'ad',
        outcome,
      },
      null,
    );
  });
  for (let rallyIndex = 1; rallyIndex <= scenario.rallyShotCount; rallyIndex += 1) {
    const playerSlot = rallyIndex % 2 === 1 ? receiverSlot : scenario.serverSlot;
    const terminal = rallyIndex === scenario.rallyShotCount;
    const strokeType = terminal
      ? scenario.terminalStroke
      : rallyIndex % 3 === 0
        ? 'volley'
        : rallyIndex % 2 === 0
          ? 'backhand'
          : 'forehand';
    addShot(
      playerSlot,
      strokeType,
      resultFor(scenario.endReason, terminal),
      null,
      terminal ? errorClassificationFor(scenario.endReason) : null,
    );
  }
  const firstShot = shots.find((shot) => shot.id === shotIds[0])!;
  const lastShot = shots.find((shot) => shot.id === shotIds[shotIds.length - 1])!;
  const winnerSlot =
    scenario.endReason === 'ace' || scenario.endReason === 'service_winner'
      ? scenario.serverSlot
      : scenario.endReason === 'double_fault'
        ? receiverSlot
        : scenario.endReason === 'winner'
          ? lastShot.playerSlot
          : opponent(lastShot.playerSlot);
  const scoreBeforeA =
    points.length === 0 ? 0 : Number(points[points.length - 1]!.scoreAfter.split('-')[0]);
  const scoreBeforeB =
    points.length === 0 ? 0 : Number(points[points.length - 1]!.scoreAfter.split('-')[1]);
  const scoreAfter = `${scoreBeforeA + (winnerSlot === 'A' ? 1 : 0)}-${scoreBeforeB + (winnerSlot === 'B' ? 1 : 0)}`;
  rallies.push({
    id: rallyId,
    pointId,
    shotIds,
    startTimeMs: firstShot.startTimeMs,
    endTimeMs: lastShot.endTimeMs,
    shotCount: shotIds.length,
  });
  points.push({
    id: pointId,
    pointIndex: pointIndex + 1,
    rallyId,
    serverSlot: scenario.serverSlot,
    receiverSlot,
    winnerSlot,
    startTimeMs: firstShot.startTimeMs,
    endTimeMs: lastShot.endTimeMs + 250,
    scoreBefore: `${scoreBeforeA}-${scoreBeforeB}`,
    scoreAfter,
    endReason: scenario.endReason,
    isKeyPoint: pointIndex === 7 || pointIndex === 10,
  });
  clock = lastShot.endTimeMs + 2_000;
});

const pointFor = (id: string): PointRecord => points.find((point) => point.id === id)!;
const rallyFor = (id: string): RallyRecord => rallies.find((rally) => rally.id === id)!;
const shotFor = (id: string): ShotRecord => shots.find((shot) => shot.id === id)!;
export const safeMax = (values: readonly number[]): number | null => {
  const finiteValues = values.filter(Number.isFinite);
  return finiteValues.length > 0 ? Math.max(...finiteValues) : null;
};
const isValidServeWithSpeed = (shot: ShotRecord): boolean =>
  shot.serve !== null &&
  shot.serve.outcome !== 'fault' &&
  shot.speedMps !== null &&
  Number.isFinite(shot.speedMps) &&
  shot.speedMps >= 0;
export const findFastestServe = (
  source: readonly ShotRecord[],
  playerSlot?: PlayerSlot,
): ShotRecord | null =>
  [...source]
    .filter(
      (shot) =>
        isValidServeWithSpeed(shot) && (playerSlot === undefined || shot.playerSlot === playerSlot),
    )
    .sort(
      (left, right) =>
        right.speedMps! - left.speedMps! ||
        left.startTimeMs - right.startTimeMs ||
        left.id.localeCompare(right.id),
    )[0] ?? null;
const fastestServe = findFastestServe(shots)!;
const fastestServeA = findFastestServe(shots, 'A')!;
const fastestServeB = findFastestServe(shots, 'B')!;
const evidence = (
  evidenceId: string,
  label: string,
  pointId: string,
  shotIds: string[] = rallyFor(pointFor(pointId).rallyId).shotIds,
): {
  evidenceId: string;
  evidenceType: 'point' | 'rally' | 'shot' | 'derived';
  pointIds: string[];
  rallyIds: string[];
  shotIds: string[];
  clipStartMs: number;
  clipEndMs: number;
  label: string;
} => {
  const point = pointFor(pointId);
  const rally = rallyFor(point.rallyId);
  return {
    evidenceId,
    evidenceType: 'derived',
    pointIds: [point.id],
    rallyIds: [rally.id],
    shotIds,
    clipStartMs: point.startTimeMs,
    clipEndMs: point.endTimeMs,
    label,
  };
};
const evidences = [
  {
    evidenceId: 'evidence-all',
    evidenceType: 'derived' as const,
    pointIds: points.map((point) => point.id),
    rallyIds: rallies.map((rally) => rally.id),
    shotIds: shots.map((shot) => shot.id),
    clipStartMs: 0,
    clipEndMs: durationMs,
    label: '整场基础统计证据',
  },
  evidence('evidence-ace', 'Ace 发球证据', 'point-1', ['rally-1-shot-1']),
  evidence('evidence-longest', '最长回合证据', 'point-8'),
  evidence('evidence-fast-serve-a', 'Player A 最快发球证据', fastestServeA.pointId, [
    fastestServeA.id,
  ]),
  evidence('evidence-fast-serve-b', 'Player B 最快发球证据', fastestServeB.pointId, [
    fastestServeB.id,
  ]),
  evidence('evidence-serve-sample-a', 'Player A 发球样本证据', 'point-1', ['rally-1-shot-1']),
  evidence('evidence-serve-sample-b', 'Player B 发球样本证据', 'point-4', ['rally-4-shot-1']),
  evidence('evidence-service-winner-a', 'Player A 发球直接得分证据', 'point-9', ['rally-9-shot-1']),
  evidence('evidence-forehand-winner', '正手制胜分证据', 'point-3'),
  evidence('evidence-forced-a', 'Player A 受迫失误证据', 'point-11', ['rally-11-shot-6']),
  evidence(
    'evidence-forced-b',
    'Player B 击球样本证据（样本中未检测到 Player B 受迫失误）',
    'point-4',
    ['rally-4-shot-3', 'rally-4-shot-5'],
  ),
  evidence('evidence-unforced-a', 'Player A 非受迫失误证据', 'point-5', ['rally-5-shot-7']),
  evidence('evidence-unforced-b', 'Player B 反手非受迫失误证据', 'point-12', ['rally-12-shot-8']),
];
const clips = [
  {
    clipId: 'clip-ace',
    title: 'Ace 发球',
    startMs: pointFor('point-1').startTimeMs,
    endMs: pointFor('point-1').endTimeMs,
    type: 'serve' as const,
    playerSlot: 'A' as const,
    pointId: 'point-1',
    rallyId: 'rally-1',
  },
  {
    clipId: 'clip-longest',
    title: '最长回合',
    startMs: pointFor('point-8').startTimeMs,
    endMs: pointFor('point-8').endTimeMs,
    type: 'long_rally' as const,
    playerSlot: 'B' as const,
    pointId: 'point-8',
    rallyId: 'rally-8',
  },
  {
    clipId: 'clip-fast-serve',
    title: '最快发球',
    startMs: pointFor(fastestServe.pointId).startTimeMs,
    endMs: pointFor(fastestServe.pointId).endTimeMs,
    type: 'serve' as const,
    playerSlot: fastestServe.playerSlot,
    pointId: fastestServe.pointId,
    rallyId: fastestServe.rallyId,
  },
  {
    clipId: 'clip-forehand-winner',
    title: '正手制胜分',
    startMs: pointFor('point-3').startTimeMs,
    endMs: pointFor('point-3').endTimeMs,
    type: 'winner' as const,
    playerSlot: 'A' as const,
    pointId: 'point-3',
    rallyId: 'rally-3',
  },
  {
    clipId: 'clip-backhand-error',
    title: '反手非受迫失误',
    startMs: pointFor('point-12').startTimeMs,
    endMs: pointFor('point-12').endTimeMs,
    type: 'error' as const,
    playerSlot: 'B' as const,
    pointId: 'point-12',
    rallyId: 'rally-12',
  },
];

const playerShots = (slot: PlayerSlot) => shots.filter((shot) => shot.playerSlot === slot);
const playerPoints = (slot: PlayerSlot) =>
  points.filter((point) => point.serverSlot === slot || point.receiverSlot === slot);
const playerServes = (slot: PlayerSlot) => playerShots(slot).filter((shot) => shot.serve !== null);
const serves = (slot: PlayerSlot, number: 'first' | 'second') =>
  playerServes(slot).filter((shot) => shot.serve?.serveNumber === number);
const validServes = (slot: PlayerSlot) =>
  playerServes(slot).filter((shot) => shot.serve?.outcome !== 'fault');
const nonServeShots = (slot: PlayerSlot) =>
  playerShots(slot).filter((shot) => shot.strokeType !== 'serve');
const average = (values: number[]): number | null =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null;
const count = <T>(items: readonly T[], predicate: (item: T) => boolean): number =>
  items.filter(predicate).length;
const servingPoints = (slot: PlayerSlot) => points.filter((point) => point.serverSlot === slot);
const validServeSpeeds = (source: readonly ShotRecord[]) =>
  source
    .filter(isValidServeWithSpeed)
    .map((shot) => shot.speedMps)
    .filter((speed): speed is number => speed !== null);
const validFirstServes = (slot: PlayerSlot) =>
  serves(slot, 'first').filter((shot) => shot.serve?.outcome !== 'fault');
const validSecondServes = (slot: PlayerSlot) =>
  serves(slot, 'second').filter((shot) => shot.serve?.outcome !== 'fault');
const firstServePoints = (slot: PlayerSlot) =>
  servingPoints(slot).filter((point) =>
    rallyFor(point.rallyId).shotIds.some((id) => {
      const shot = shotFor(id);
      return shot.serve?.serveNumber === 'first' && shot.serve.outcome !== 'fault';
    }),
  );
const secondServePoints = (slot: PlayerSlot) =>
  servingPoints(slot).filter((point) =>
    rallyFor(point.rallyId).shotIds.some((id) => {
      const shot = shotFor(id);
      return shot.serve?.serveNumber === 'second' && shot.serve.outcome !== 'fault';
    }),
  );
const sampleFor = (code: string, slot: PlayerSlot | 'ALL'): number => {
  if (slot === 'ALL') {
    switch (code) {
      case 'video_duration_ms':
        return 1;
      case 'active_duration_ms':
      case 'point_count':
      case 'avg_point_duration_ms':
        return points.length;
      case 'shot_count':
        return shots.length;
      case 'avg_rally_shot_count':
      case 'max_rally_shot_count':
        return rallies.length;
      default:
        return 0;
    }
  }
  const pPoints = playerPoints(slot);
  const servePoints = servingPoints(slot);
  const first = serves(slot, 'first');
  const second = serves(slot, 'second');
  const ns = nonServeShots(slot);
  const forehands = ns.filter((shot) => shot.strokeType === 'forehand');
  const backhands = ns.filter((shot) => shot.strokeType === 'backhand');
  const directedServes = playerServes(slot).filter((shot) => shot.serve?.direction !== 'unknown');
  const nonServeSpeedSamples = ns.filter(
    (shot) => shot.speedMps !== null && Number.isFinite(shot.speedMps) && shot.speedMps >= 0,
  );
  switch (code) {
    case 'point_won_count':
    case 'point_lost_count':
    case 'point_win_rate':
    case 'winner_count':
    case 'total_move_distance_m':
    case 'avg_move_speed_mps':
    case 'max_move_speed_mps':
      return pPoints.length;
    case 'forced_error_count':
    case 'unforced_error_count':
    case 'shot_in_rate':
    case 'forehand_shot_count':
    case 'forehand_shot_rate':
    case 'backhand_shot_count':
    case 'backhand_shot_rate':
    case 'unforced_error_rate':
      return ns.length;
    case 'max_shot_speed_mps':
      return nonServeSpeedSamples.length;
    case 'forehand_in_rate':
    case 'forehand_unforced_error_rate':
    case 'forehand_winner_count':
      return forehands.length;
    case 'backhand_in_rate':
    case 'backhand_unforced_error_rate':
    case 'backhand_winner_count':
      return backhands.length;
    case 'short_rally_count':
    case 'medium_rally_count':
    case 'long_rally_count':
      return rallies.length;
    case 'short_rally_win_rate':
      return rallies.filter((rally) => rally.shotCount <= 4).length;
    case 'medium_rally_win_rate':
      return rallies.filter((rally) => rally.shotCount >= 5 && rally.shotCount <= 8).length;
    case 'long_rally_win_rate':
      return rallies.filter((rally) => rally.shotCount >= 9).length;
    case 'first_serve_attempt_count':
    case 'second_serve_attempt_count':
    case 'double_fault_rate':
      return servePoints.length;
    case 'first_serve_in_count':
    case 'first_serve_in_rate':
    case 'first_serve_fault_count':
      return first.length;
    case 'second_serve_in_count':
    case 'second_serve_in_rate':
      return second.length;
    case 'ace_rate':
    case 'service_winner_rate':
      return validServes(slot).length;
    case 'first_serve_point_win_rate':
      return firstServePoints(slot).length;
    case 'second_serve_point_win_rate':
      return secondServePoints(slot).length;
    case 'first_serve_avg_speed_mps':
      return validServeSpeeds(validFirstServes(slot)).length;
    case 'second_serve_avg_speed_mps':
      return validServeSpeeds(validSecondServes(slot)).length;
    case 'serve_avg_speed_mps':
    case 'serve_speed_std_mps':
    case 'max_serve_speed_mps':
      return validServeSpeeds(validServes(slot)).length;
    case 'wide_serve_rate':
    case 'body_serve_rate':
    case 't_serve_rate':
      return directedServes.length;
    default:
      return 0;
  }
};
const metricValue = (code: string, slot: PlayerSlot | 'ALL'): number | null => {
  if (slot === 'ALL') {
    if (code === 'video_duration_ms') return durationMs;
    if (code === 'active_duration_ms')
      return points.reduce((sum, point) => sum + point.endTimeMs - point.startTimeMs, 0);
    if (code === 'point_count') return points.length;
    if (code === 'shot_count') return shots.length;
    if (code === 'avg_rally_shot_count') return average(rallies.map((rally) => rally.shotCount));
    if (code === 'max_rally_shot_count')
      return Math.max(...rallies.map((rally) => rally.shotCount));
    if (code === 'avg_point_duration_ms')
      return average(points.map((point) => point.endTimeMs - point.startTimeMs));
  }
  if (slot === 'ALL') return null;
  const ps = playerShots(slot);
  const pp = playerPoints(slot);
  const pv = playerServes(slot);
  const first = serves(slot, 'first');
  const second = serves(slot, 'second');
  const valid = validServes(slot);
  const ns = nonServeShots(slot);
  const winnerPoints = pp.filter((point) => point.winnerSlot === slot);
  const category = (min: number, max: number | null) =>
    rallies.filter((rally) => rally.shotCount >= min && (max === null || rally.shotCount <= max));
  const categoryWinRate = (min: number, max: number | null) => {
    const items = category(min, max);
    return ratio(
      items.filter((rally) => pointFor(rally.pointId).winnerSlot === slot).length,
      items.length,
    );
  };
  if (code === 'point_won_count') return winnerPoints.length;
  if (code === 'point_lost_count') return pp.length - winnerPoints.length;
  if (code === 'point_win_rate') return ratio(winnerPoints.length, pp.length);
  if (code === 'winner_count')
    return winnerPoints.filter((point) => point.endReason === 'winner').length;
  if (code === 'forced_error_count')
    return count(ps, (shot) => shot.errorClassification === 'forced');
  if (code === 'unforced_error_count')
    return count(ps, (shot) => shot.errorClassification === 'unforced');
  if (code === 'max_serve_speed_mps') return safeMax(validServeSpeeds(valid));
  if (code === 'max_shot_speed_mps')
    return safeMax(
      ns
        .map((shot) => shot.speedMps)
        .filter((speed): speed is number => speed !== null && Number.isFinite(speed) && speed >= 0),
    );
  if (code === 'total_move_distance_m') return slot === 'A' ? 238.4 : 214.2;
  if (code === 'avg_move_speed_mps') return slot === 'A' ? 2.8 : 2.5;
  if (code === 'max_move_speed_mps') return slot === 'A' ? 5.9 : 5.4;
  if (code === 'shot_in_rate')
    return ratio(
      count(ns, (shot) => shot.result === 'in' || shot.result === 'winner'),
      ns.length,
    );
  if (code === 'forehand_shot_count') return count(ns, (shot) => shot.strokeType === 'forehand');
  if (code === 'forehand_shot_rate')
    return ratio(
      count(ns, (shot) => shot.strokeType === 'forehand'),
      ns.length,
    );
  if (code === 'forehand_in_rate')
    return ratio(
      count(
        ns,
        (shot) =>
          shot.strokeType === 'forehand' && (shot.result === 'in' || shot.result === 'winner'),
      ),
      count(ns, (shot) => shot.strokeType === 'forehand'),
    );
  if (code === 'backhand_shot_count') return count(ns, (shot) => shot.strokeType === 'backhand');
  if (code === 'backhand_shot_rate')
    return ratio(
      count(ns, (shot) => shot.strokeType === 'backhand'),
      ns.length,
    );
  if (code === 'backhand_in_rate')
    return ratio(
      count(
        ns,
        (shot) =>
          shot.strokeType === 'backhand' && (shot.result === 'in' || shot.result === 'winner'),
      ),
      count(ns, (shot) => shot.strokeType === 'backhand'),
    );
  if (code === 'unforced_error_rate')
    return ratio(
      count(ns, (shot) => shot.errorClassification === 'unforced'),
      ns.length,
    );
  if (code === 'forehand_unforced_error_rate')
    return ratio(
      count(
        ns,
        (shot) => shot.strokeType === 'forehand' && shot.errorClassification === 'unforced',
      ),
      count(ns, (shot) => shot.strokeType === 'forehand'),
    );
  if (code === 'backhand_unforced_error_rate')
    return ratio(
      count(
        ns,
        (shot) => shot.strokeType === 'backhand' && shot.errorClassification === 'unforced',
      ),
      count(ns, (shot) => shot.strokeType === 'backhand'),
    );
  if (code === 'forehand_winner_count')
    return count(ns, (shot) => shot.strokeType === 'forehand' && shot.result === 'winner');
  if (code === 'backhand_winner_count')
    return count(ns, (shot) => shot.strokeType === 'backhand' && shot.result === 'winner');
  if (code === 'short_rally_count') return category(1, 4).length;
  if (code === 'short_rally_win_rate') return categoryWinRate(1, 4);
  if (code === 'medium_rally_count') return category(5, 8).length;
  if (code === 'medium_rally_win_rate') return categoryWinRate(5, 8);
  if (code === 'long_rally_count') return category(9, null).length;
  if (code === 'long_rally_win_rate') return categoryWinRate(9, null);
  if (code === 'first_serve_attempt_count') return first.length;
  if (code === 'first_serve_in_count')
    return count(first, (shot) => shot.serve?.outcome !== 'fault');
  if (code === 'first_serve_in_rate')
    return ratio(
      count(first, (shot) => shot.serve?.outcome !== 'fault'),
      first.length,
    );
  if (code === 'first_serve_fault_count')
    return count(first, (shot) => shot.serve?.outcome === 'fault');
  if (code === 'second_serve_attempt_count') return second.length;
  if (code === 'second_serve_in_count')
    return count(second, (shot) => shot.serve?.outcome !== 'fault');
  if (code === 'second_serve_in_rate')
    return ratio(
      count(second, (shot) => shot.serve?.outcome !== 'fault'),
      second.length,
    );
  if (code === 'double_fault_rate')
    return ratio(
      count(pp, (point) => point.serverSlot === slot && point.endReason === 'double_fault'),
      pp.filter((point) => point.serverSlot === slot).length,
    );
  if (code === 'ace_rate')
    return ratio(
      count(valid, (shot) => shot.serve?.outcome === 'ace'),
      valid.length,
    );
  if (code === 'service_winner_rate')
    return ratio(
      count(valid, (shot) => shot.serve?.outcome === 'service_winner'),
      valid.length,
    );
  if (code === 'first_serve_point_win_rate') {
    const items = firstServePoints(slot);
    return ratio(items.filter((point) => point.winnerSlot === slot).length, items.length);
  }
  if (code === 'second_serve_point_win_rate') {
    const items = secondServePoints(slot);
    return ratio(items.filter((point) => point.winnerSlot === slot).length, items.length);
  }
  if (code === 'first_serve_avg_speed_mps')
    return average(validServeSpeeds(validFirstServes(slot)));
  if (code === 'second_serve_avg_speed_mps')
    return average(validServeSpeeds(validSecondServes(slot)));
  if (code === 'serve_avg_speed_mps') return average(validServeSpeeds(valid));
  if (code === 'serve_speed_std_mps') {
    const values = validServeSpeeds(valid);
    const mean = average(values) ?? 0;
    return values.length
      ? Math.sqrt(average(values.map((value) => (value - mean) ** 2)) ?? 0)
      : null;
  }
  if (code.endsWith('_serve_rate')) {
    const direction = code.startsWith('wide') ? 'wide' : code.startsWith('body') ? 'body' : 't';
    const directed = pv.filter((shot) => shot.serve?.direction !== 'unknown');
    return ratio(
      count(directed, (shot) => shot.serve?.direction === direction),
      directed.length,
    );
  }
  return null;
};
const evidenceIdsFor = (code: string, slot: PlayerSlot | 'ALL'): string[] => {
  if (slot === 'ALL') return ['evidence-all'];
  if (code.includes('forced_error'))
    return [slot === 'A' ? 'evidence-forced-a' : 'evidence-forced-b'];
  if (code.includes('unforced_error'))
    return [slot === 'A' ? 'evidence-unforced-a' : 'evidence-unforced-b'];
  if (code === 'ace_rate') return [slot === 'A' ? 'evidence-ace' : 'evidence-serve-sample-b'];
  if (code === 'service_winner_rate')
    return [slot === 'A' ? 'evidence-service-winner-a' : 'evidence-serve-sample-b'];
  if (code === 'max_serve_speed_mps' || code === 'serve_speed_std_mps')
    return [slot === 'A' ? 'evidence-fast-serve-a' : 'evidence-fast-serve-b'];
  if (getMetricDefinition(code)?.dimension === 'serve')
    return [slot === 'A' ? 'evidence-serve-sample-a' : 'evidence-serve-sample-b'];
  return ['evidence-all'];
};
const metrics: MetricRecord[] = metricDefinitions.flatMap((definition) => {
  const slots: readonly (PlayerSlot | 'ALL')[] =
    definition.playerScope === 'ALL' ? ['ALL'] : ['A', 'B'];
  return slots.map((slot) => {
    const value = metricValue(definition.code, slot);
    return {
      uploadId,
      playerSlot: slot,
      metricCode: definition.code,
      metricName: definition.name,
      metricValue: value,
      metricUnit: definition.unit,
      sampleSize: sampleFor(definition.code, slot),
      scopeType: 'upload' as const,
      scopeId: uploadId,
      dimension: definition.dimension,
      confidence: definition.dataTier === 'P0' ? 0.96 : 0.74,
      algorithmVersion,
      createdAt,
      dataTier: definition.dataTier,
      evidenceIds: evidenceIdsFor(definition.code, slot),
    };
  });
});

export const demoMatchFixture: DemoMatchBundle = {
  video: {
    id: 'video-demo-001',
    uploadId,
    title: '网球分析示例比赛',
    originalFileName: 'demo-match.mp4',
    durationMs,
    matchType: 'match',
    playMode: 'singles',
    courtType: 'hard',
    algorithmVersion,
    createdAt,
  },
  players: { A: { displayName: 'Player A' }, B: { displayName: 'Player B' } },
  shots,
  rallies,
  points,
  evidences,
  clips,
  metrics,
};

export const getFixtureMetric = (code: string, slot: PlayerSlot | 'ALL'): MetricRecord | null => {
  const definition = getMetricDefinition(code);
  if (!definition || (definition.playerScope === 'ALL') !== (slot === 'ALL')) return null;
  return metrics.find((metric) => metric.metricCode === code && metric.playerSlot === slot) ?? null;
};
