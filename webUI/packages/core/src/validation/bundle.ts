import type { DemoMatchBundle, ShotRecord } from '../domain/types';
import { getMetricDefinition, metricDefinitions } from '../domain/metricDefinitions';

export interface ValidationIssue {
  code: string;
  message: string;
  entityType?: string;
  entityId?: string;
}
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
const issue = (
  issues: ValidationIssue[],
  code: string,
  message: string,
  entityType?: string,
  entityId?: string,
): void => {
  issues.push({
    code,
    message,
    ...(entityType ? { entityType } : {}),
    ...(entityId ? { entityId } : {}),
  });
};
const inRange = (value: number, min: number, max: number): boolean =>
  Number.isFinite(value) && value >= min && value <= max;
const terminalShot = (bundle: DemoMatchBundle, pointId: string): ShotRecord | null => {
  const point = bundle.points.find((entry) => entry.id === pointId);
  const rally = point ? bundle.rallies.find((entry) => entry.id === point.rallyId) : undefined;
  const id = rally?.shotIds[rally.shotIds.length - 1];
  return id ? (bundle.shots.find((shot) => shot.id === id) ?? null) : null;
};
const parseScore = (score: string): [number, number] | null => {
  const parts = score.split('-').map(Number);
  return parts.length === 2 && parts.every((part) => Number.isInteger(part) && part >= 0)
    ? [parts[0]!, parts[1]!]
    : null;
};

export function validateDemoMatchBundle(bundle: DemoMatchBundle): ValidationResult {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const addId = (id: string, type: string) => {
    if (!id || ids.has(id)) issue(issues, 'duplicate_id', 'ID must be globally unique', type, id);
    ids.add(id);
  };
  addId(bundle.video.id, 'video');
  bundle.points.forEach((point) => addId(point.id, 'point'));
  bundle.rallies.forEach((rally) => addId(rally.id, 'rally'));
  bundle.shots.forEach((shot) => addId(shot.id, 'shot'));
  bundle.evidences.forEach((evidence) => addId(evidence.evidenceId, 'evidence'));
  bundle.clips.forEach((clip) => addId(clip.clipId, 'clip'));
  const points = new Map(bundle.points.map((point) => [point.id, point]));
  const rallies = new Map(bundle.rallies.map((rally) => [rally.id, rally]));
  const shots = new Map(bundle.shots.map((shot) => [shot.id, shot]));
  const evidences = new Map(bundle.evidences.map((evidence) => [evidence.evidenceId, evidence]));
  const timeline = (
    items: readonly { id: string; startTimeMs: number; endTimeMs: number }[],
    type: string,
  ) => {
    const sorted = [...items].sort((a, b) => a.startTimeMs - b.startTimeMs);
    sorted.forEach((item, index) => {
      if (
        item.startTimeMs > item.endTimeMs ||
        item.startTimeMs < 0 ||
        item.endTimeMs > bundle.video.durationMs
      )
        issue(issues, 'TIME_OUT_OF_RANGE', 'Time range is outside the video', type, item.id);
      if (index > 0 && item.startTimeMs < sorted[index - 1]!.endTimeMs)
        issue(issues, 'TIME_OVERLAP', 'Sibling time ranges overlap', type, item.id);
    });
  };
  timeline(bundle.points, 'point');
  timeline(bundle.rallies, 'rally');
  bundle.points.forEach((point, index) => {
    const rally = rallies.get(point.rallyId);
    const before = parseScore(point.scoreBefore);
    const after = parseScore(point.scoreAfter);
    if (!rally || rally.pointId !== point.id)
      issue(
        issues,
        'point_rally_link',
        'Point/Rally link must be bidirectional',
        'point',
        point.id,
      );
    if (point.pointIndex !== index + 1)
      issue(issues, 'POINT_INDEX_INVALID', 'pointIndex must be sequential', 'point', point.id);
    if (index > 0 && point.scoreBefore !== bundle.points[index - 1]!.scoreAfter)
      issue(
        issues,
        'SCORE_CHAIN_INVALID',
        'Each point scoreBefore must equal the previous point scoreAfter',
        'point',
        point.id,
      );
    if (point.serverSlot === point.receiverSlot)
      issue(issues, 'POINT_PLAYERS_INVALID', 'Server and receiver must differ', 'point', point.id);
    if (!rally || point.startTimeMs > rally.startTimeMs || point.endTimeMs < rally.endTimeMs)
      issue(issues, 'POINT_TIME_MISMATCH', 'Point must contain Rally time', 'point', point.id);
    if (
      !before ||
      !after ||
      after[0] + after[1] !== before[0] + before[1] + 1 ||
      after[point.winnerSlot === 'A' ? 0 : 1] !== before[point.winnerSlot === 'A' ? 0 : 1] + 1 ||
      after[point.winnerSlot === 'A' ? 1 : 0] !== before[point.winnerSlot === 'A' ? 1 : 0]
    )
      issue(
        issues,
        'SCORE_WINNER_DIRECTION_MISMATCH',
        'Score must advance for winnerSlot',
        'point',
        point.id,
      );
    const terminal = terminalShot(bundle, point.id);
    if (!terminal) return;
    if (point.endReason === 'ace') {
      if (
        terminal.strokeType !== 'serve' ||
        terminal.playerSlot !== point.serverSlot ||
        terminal.serve?.outcome !== 'ace' ||
        point.winnerSlot !== point.serverSlot ||
        rally?.shotIds.length !== 1
      )
        issue(
          issues,
          'ACE_TERMINAL_SHOT_INVALID',
          'Ace must be one serving shot won by server',
          'point',
          point.id,
        );
    } else if (point.endReason === 'service_winner') {
      if (
        terminal.strokeType !== 'serve' ||
        terminal.playerSlot !== point.serverSlot ||
        terminal.serve?.outcome !== 'service_winner' ||
        point.winnerSlot !== point.serverSlot ||
        rally?.shotIds.length !== 1
      )
        issue(
          issues,
          'SERVICE_WINNER_MISMATCH',
          'Service winner must be a single serving shot',
          'point',
          point.id,
        );
    } else if (point.endReason === 'double_fault') {
      const serveShots = (rally?.shotIds ?? [])
        .map((id) => shots.get(id))
        .filter((shot): shot is ShotRecord => Boolean(shot));
      if (
        serveShots.length !== 2 ||
        !serveShots.every(
          (shot) =>
            shot.strokeType === 'serve' &&
            shot.playerSlot === point.serverSlot &&
            shot.serve?.outcome === 'fault',
        ) ||
        serveShots[0]?.serve?.serveNumber !== 'first' ||
        serveShots[1]?.serve?.serveNumber !== 'second' ||
        point.winnerSlot !== point.receiverSlot
      )
        issue(
          issues,
          'DOUBLE_FAULT_STRUCTURE_INVALID',
          'Double fault must contain first and second faults won by receiver',
          'point',
          point.id,
        );
    } else if (point.endReason === 'winner') {
      if (
        terminal.result !== 'winner' ||
        terminal.playerSlot !== point.winnerSlot ||
        terminal.errorClassification !== null
      )
        issue(
          issues,
          'WINNER_TERMINAL_SHOT_INVALID',
          'Winner must be hit by winnerSlot',
          'point',
          point.id,
        );
    } else if (['net', 'long', 'wide'].includes(point.endReason)) {
      if (terminal.result !== point.endReason || terminal.playerSlot === point.winnerSlot)
        issue(
          issues,
          'ERROR_WINNER_MISMATCH',
          'Error must be hit by the losing player',
          'point',
          point.id,
        );
    } else if (point.endReason === 'forced_error' || point.endReason === 'unforced_error') {
      if (
        terminal.errorClassification !== point.endReason.replace('_error', '') ||
        terminal.playerSlot === point.winnerSlot
      )
        issue(
          issues,
          'ERROR_CLASSIFICATION_MISMATCH',
          'Error classification and winner are inconsistent',
          'point',
          point.id,
        );
    }
  });
  const usedShots = new Set<string>();
  bundle.rallies.forEach((rally) => {
    const unique = new Set(rally.shotIds);
    if (!points.has(rally.pointId))
      issue(issues, 'RALLY_POINT_MISSING', 'Rally point is missing', 'rally', rally.id);
    if (unique.size !== rally.shotIds.length)
      issue(issues, 'duplicate_shot_id', 'Rally contains duplicate shots', 'rally', rally.id);
    if (rally.shotCount !== rally.shotIds.length)
      issue(
        issues,
        'SHOT_COUNT_MISMATCH',
        'shotCount must equal shotIds length',
        'rally',
        rally.id,
      );
    rally.shotIds.forEach((id, index) => {
      const shot = shots.get(id);
      if (!shot) issue(issues, 'RALLY_SHOT_MISSING', 'Rally shot is missing', 'rally', rally.id);
      else {
        if (usedShots.has(id))
          issue(issues, 'SHOT_REUSED', 'Shot belongs to multiple rallies', 'shot', id);
        usedShots.add(id);
        if (
          shot.rallyId !== rally.id ||
          shot.pointId !== rally.pointId ||
          shot.shotIndex !== index + 1
        )
          issue(issues, 'SHOT_LINK_INVALID', 'Shot linkage is invalid', 'shot', id);
        if (shot.startTimeMs < rally.startTimeMs || shot.endTimeMs > rally.endTimeMs)
          issue(issues, 'RALLY_TIME_MISMATCH', 'Rally must contain Shot time', 'shot', id);
      }
    });
  });
  bundle.shots.forEach((shot) => {
    if (!points.has(shot.pointId) || !rallies.has(shot.rallyId))
      issue(issues, 'SHOT_PARENT_MISSING', 'Shot parent is missing', 'shot', shot.id);
    if (
      shot.startTimeMs > shot.endTimeMs ||
      shot.startTimeMs < 0 ||
      shot.endTimeMs > bundle.video.durationMs
    )
      issue(issues, 'SHOT_TIME_INVALID', 'Shot time is invalid', 'shot', shot.id);
    if (!inRange(shot.confidence, 0, 1))
      issue(issues, 'CONFIDENCE_INVALID', 'Confidence must be between 0 and 1', 'shot', shot.id);
    if (shot.speedMps !== null && (!Number.isFinite(shot.speedMps) || shot.speedMps < 0))
      issue(issues, 'SPEED_INVALID', 'Speed must be finite and non-negative', 'shot', shot.id);
    if (shot.strokeType === 'serve' && shot.serve === null)
      issue(
        issues,
        'SERVE_METADATA_REQUIRED',
        'Serve shot requires serve metadata',
        'shot',
        shot.id,
      );
    if (shot.strokeType !== 'serve' && shot.serve !== null)
      issue(
        issues,
        'SERVE_METADATA_FORBIDDEN',
        'Non-serve shot cannot have serve metadata',
        'shot',
        shot.id,
      );
    if (
      shot.serve &&
      (!['first', 'second'].includes(shot.serve.serveNumber) ||
        !['wide', 'body', 't', 'unknown'].includes(shot.serve.direction) ||
        !['deuce', 'ad'].includes(shot.serve.courtSide) ||
        !['in', 'fault', 'ace', 'service_winner'].includes(shot.serve.outcome))
    )
      issue(
        issues,
        'SERVE_METADATA_INVALID',
        'Serve metadata contains an invalid enum',
        'shot',
        shot.id,
      );
    [shot.startPoint, shot.bouncePoint, shot.endPoint]
      .filter((point): point is NonNullable<typeof point> => point !== null)
      .forEach((point) => {
        if (!inRange(point.x, 0, 1) || !inRange(point.y, 0, 1))
          issue(issues, 'COURT_POINT_INVALID', 'Court point must be normalized', 'shot', shot.id);
      });
  });
  bundle.evidences.forEach((entry) => {
    if (
      entry.clipStartMs > entry.clipEndMs ||
      entry.clipStartMs < 0 ||
      entry.clipEndMs > bundle.video.durationMs
    )
      issue(
        issues,
        'EVIDENCE_TIME_MISMATCH',
        'Evidence time is invalid',
        'evidence',
        entry.evidenceId,
      );
    entry.pointIds.forEach((id) => {
      if (!points.has(id))
        issue(issues, 'evidence_point', 'Evidence point is missing', 'evidence', entry.evidenceId);
    });
    entry.rallyIds.forEach((id) => {
      if (!rallies.has(id))
        issue(
          issues,
          'EVIDENCE_RALLY_MISSING',
          'Evidence rally is missing',
          'evidence',
          entry.evidenceId,
        );
    });
    entry.shotIds.forEach((id) => {
      if (!shots.has(id))
        issue(
          issues,
          'EVIDENCE_SHOT_MISSING',
          'Evidence shot is missing',
          'evidence',
          entry.evidenceId,
        );
    });
    const referencedPoints = entry.pointIds
      .map((id) => points.get(id))
      .filter((point): point is NonNullable<typeof point> => Boolean(point));
    const referencedRallies = entry.rallyIds
      .map((id) => rallies.get(id))
      .filter((rally): rally is NonNullable<typeof rally> => Boolean(rally));
    const referencedShots = entry.shotIds
      .map((id) => shots.get(id))
      .filter((shot): shot is NonNullable<typeof shot> => Boolean(shot));
    referencedRallies.forEach((rally) => {
      if (!referencedPoints.some((point) => point.id === rally.pointId))
        issue(
          issues,
          'EVIDENCE_RALLY_POINT_MISMATCH',
          'Evidence rally must belong to a referenced point',
          'evidence',
          entry.evidenceId,
        );
    });
    referencedShots.forEach((shot) => {
      if (
        !referencedPoints.some((point) => point.id === shot.pointId) ||
        !referencedRallies.some((rally) => rally.id === shot.rallyId)
      )
        issue(
          issues,
          'EVIDENCE_SHOT_LINK_INVALID',
          'Evidence shot must belong to its referenced point and rally',
          'evidence',
          entry.evidenceId,
        );
    });
    const evidencePoints = entry.pointIds.map((id) => points.get(id)).filter((point) => point);
    if (
      evidencePoints.some(
        (point) =>
          point && (entry.clipStartMs > point.startTimeMs || entry.clipEndMs < point.endTimeMs),
      )
    )
      issue(
        issues,
        'EVIDENCE_TIME_MISMATCH',
        'Evidence must cover referenced Point',
        'evidence',
        entry.evidenceId,
      );
  });
  bundle.clips.forEach((clip) => {
    const point = clip.pointId ? points.get(clip.pointId) : undefined;
    const rally = clip.rallyId ? rallies.get(clip.rallyId) : undefined;
    if (clip.startMs > clip.endMs || clip.startMs < 0 || clip.endMs > bundle.video.durationMs)
      issue(issues, 'CLIP_TIME_MISMATCH', 'Clip time is invalid', 'clip', clip.clipId);
    if (clip.pointId && !point)
      issue(issues, 'CLIP_POINT_MISSING', 'Clip point is missing', 'clip', clip.clipId);
    if (clip.rallyId && !rally)
      issue(issues, 'CLIP_RALLY_MISSING', 'Clip rally is missing', 'clip', clip.clipId);
    if (
      point &&
      rally &&
      (point.rallyId !== rally.id ||
        clip.startMs > point.startTimeMs ||
        clip.endMs < point.endTimeMs)
    )
      issue(
        issues,
        'CLIP_POINT_RALLY_MISMATCH',
        'Clip must cover its matching Point/Rally',
        'clip',
        clip.clipId,
      );
    if (
      clip.type === 'error' &&
      point &&
      clip.playerSlot &&
      terminalShot(bundle, point.id)?.playerSlot !== clip.playerSlot
    )
      issue(
        issues,
        'CLIP_PLAYER_MISMATCH',
        'Error clip player must be terminal error player',
        'clip',
        clip.clipId,
      );
    if (clip.playerSlot && point) {
      const expectedPlayer =
        clip.type === 'serve'
          ? point.serverSlot
          : clip.type === 'winner'
            ? point.winnerSlot
            : clip.type === 'error'
              ? terminalShot(bundle, point.id)?.playerSlot
              : clip.type === 'long_rally'
                ? point.winnerSlot
                : clip.playerSlot;
      if (expectedPlayer && clip.playerSlot !== expectedPlayer)
        issue(
          issues,
          'CLIP_PLAYER_MISMATCH',
          'Clip player must match the referenced event',
          'clip',
          clip.clipId,
        );
    }
  });
  const expectedKeys = new Set<string>();
  metricDefinitions.forEach((definition) =>
    (definition.playerScope === 'ALL' ? ['ALL'] : ['A', 'B']).forEach((slot) =>
      expectedKeys.add(`${definition.code}:${slot}`),
    ),
  );
  const actualKeys = new Set<string>();
  bundle.metrics.forEach((metric) => {
    const definition = getMetricDefinition(metric.metricCode);
    const key = `${metric.metricCode}:${metric.playerSlot}`;
    if (actualKeys.has(key))
      issue(
        issues,
        'METRIC_KEY_DUPLICATE',
        'Metric code and playerSlot must be unique',
        'metric',
        key,
      );
    actualKeys.add(key);
    if (!definition)
      issue(
        issues,
        'METRIC_DEFINITION_MISSING',
        'Metric definition is missing',
        'metric',
        metric.metricCode,
      );
    else {
      if (metric.metricName !== definition.name)
        issue(
          issues,
          'METRIC_NAME_MISMATCH',
          'Metric name differs from registry',
          'metric',
          metric.metricCode,
        );
      if (metric.metricUnit !== definition.unit)
        issue(
          issues,
          'METRIC_UNIT_MISMATCH',
          'Metric unit differs from registry',
          'metric',
          metric.metricCode,
        );
      if (metric.dimension !== definition.dimension)
        issue(
          issues,
          'METRIC_DIMENSION_MISMATCH',
          'Metric dimension differs from registry',
          'metric',
          metric.metricCode,
        );
      if (metric.dataTier !== definition.dataTier)
        issue(
          issues,
          'METRIC_TIER_MISMATCH',
          'Metric tier differs from registry',
          'metric',
          metric.metricCode,
        );
      if ((definition.playerScope === 'ALL') !== (metric.playerSlot === 'ALL'))
        issue(
          issues,
          'METRIC_PLAYER_SCOPE_MISMATCH',
          'Metric player scope differs from registry',
          'metric',
          metric.metricCode,
        );
    }
    if (!Number.isInteger(metric.sampleSize) || metric.sampleSize < 0)
      issue(
        issues,
        'METRIC_SAMPLE_SIZE_INVALID',
        'Metric sampleSize must be a non-negative integer',
        'metric',
        metric.metricCode,
      );
    const player =
      metric.playerSlot === 'A' || metric.playerSlot === 'B' ? metric.playerSlot : null;
    const pShots = player ? bundle.shots.filter((shot) => shot.playerSlot === player) : [];
    const nonServe = pShots.filter((shot) => shot.strokeType !== 'serve');
    const first = pShots.filter((shot) => shot.serve?.serveNumber === 'first');
    const second = pShots.filter((shot) => shot.serve?.serveNumber === 'second');
    const validServes = pShots.filter((shot) => shot.serve && shot.serve.outcome !== 'fault');
    const directedServes = pShots.filter(
      (shot) => shot.serve && shot.serve.direction !== 'unknown',
    );
    const servePoints = player ? bundle.points.filter((point) => point.serverSlot === player) : [];
    const firstServePoints = servePoints.filter((point) => {
      const rally = rallies.get(point.rallyId);
      return rally?.shotIds.some((id) => {
        const shot = shots.get(id);
        return shot?.serve?.serveNumber === 'first' && shot.serve.outcome !== 'fault';
      });
    });
    const secondServePoints = servePoints.filter((point) => {
      const rally = rallies.get(point.rallyId);
      return rally?.shotIds.some((id) => {
        const shot = shots.get(id);
        return shot?.serve?.serveNumber === 'second' && shot.serve.outcome !== 'fault';
      });
    });
    const speedSamples = (source: readonly ShotRecord[]) =>
      source.filter(
        (shot) => shot.speedMps !== null && Number.isFinite(shot.speedMps) && shot.speedMps >= 0,
      ).length;
    const expectedSample =
      metric.playerSlot === 'ALL'
        ? metric.metricCode === 'video_duration_ms'
          ? 1
          : metric.metricCode === 'point_count' ||
              metric.metricCode === 'active_duration_ms' ||
              metric.metricCode === 'avg_point_duration_ms'
            ? bundle.points.length
            : metric.metricCode === 'shot_count'
              ? bundle.shots.length
              : metric.metricCode === 'avg_rally_shot_count' ||
                  metric.metricCode === 'max_rally_shot_count'
                ? bundle.rallies.length
                : undefined
        : (() => {
            switch (metric.metricCode) {
              case 'point_won_count':
              case 'point_lost_count':
              case 'point_win_rate':
              case 'winner_count':
              case 'total_move_distance_m':
              case 'avg_move_speed_mps':
              case 'max_move_speed_mps':
                return bundle.points.filter(
                  (point) => point.serverSlot === player || point.receiverSlot === player,
                ).length;
              case 'forced_error_count':
              case 'unforced_error_count':
              case 'shot_in_rate':
              case 'forehand_shot_count':
              case 'forehand_shot_rate':
              case 'backhand_shot_count':
              case 'backhand_shot_rate':
              case 'unforced_error_rate':
                return nonServe.length;
              case 'forehand_in_rate':
              case 'forehand_unforced_error_rate':
              case 'forehand_winner_count':
                return nonServe.filter((shot) => shot.strokeType === 'forehand').length;
              case 'backhand_in_rate':
              case 'backhand_unforced_error_rate':
              case 'backhand_winner_count':
                return nonServe.filter((shot) => shot.strokeType === 'backhand').length;
              case 'short_rally_count':
              case 'medium_rally_count':
              case 'long_rally_count':
                return bundle.rallies.length;
              case 'short_rally_win_rate':
                return bundle.rallies.filter((rally) => rally.shotCount <= 4).length;
              case 'medium_rally_win_rate':
                return bundle.rallies.filter(
                  (rally) => rally.shotCount >= 5 && rally.shotCount <= 8,
                ).length;
              case 'first_serve_in_rate':
                return first.length;
              case 'first_serve_in_count':
              case 'first_serve_fault_count':
                return first.length;
              case 'second_serve_in_rate':
                return second.length;
              case 'second_serve_in_count':
                return second.length;
              case 'long_rally_win_rate':
                return bundle.rallies.filter((rally) => rally.shotCount >= 9).length;
              case 'max_serve_speed_mps':
                return speedSamples(validServes);
              case 'ace_rate':
              case 'service_winner_rate':
                return validServes.length;
              case 'double_fault_rate':
              case 'first_serve_attempt_count':
              case 'second_serve_attempt_count':
                return servePoints.length;
              case 'first_serve_point_win_rate':
                return firstServePoints.length;
              case 'second_serve_point_win_rate':
                return secondServePoints.length;
              case 'first_serve_avg_speed_mps':
                return speedSamples(first.filter((shot) => shot.serve?.outcome !== 'fault'));
              case 'second_serve_avg_speed_mps':
                return speedSamples(second.filter((shot) => shot.serve?.outcome !== 'fault'));
              case 'serve_avg_speed_mps':
              case 'serve_speed_std_mps':
                return speedSamples(validServes);
              case 'wide_serve_rate':
              case 'body_serve_rate':
              case 't_serve_rate':
                return directedServes.length;
              case 'max_shot_speed_mps':
                return speedSamples(nonServe);
              default:
                return undefined;
            }
          })();
    if (expectedSample !== undefined && metric.sampleSize !== expectedSample)
      issue(
        issues,
        'METRIC_SAMPLE_SIZE_INVALID',
        'Metric sampleSize does not match its denominator',
        'metric',
        metric.metricCode,
      );
    if (metric.metricValue !== null && !Number.isFinite(metric.metricValue))
      issue(
        issues,
        'METRIC_VALUE_INVALID',
        'Metric value must be finite',
        'metric',
        metric.metricCode,
      );
    if (
      metric.metricCode.endsWith('_rate') &&
      metric.metricValue !== null &&
      !inRange(metric.metricValue, 0, 1)
    )
      issue(
        issues,
        'METRIC_RATE_OUT_OF_RANGE',
        'Rate must be between 0 and 1',
        'metric',
        metric.metricCode,
      );
    if (!inRange(metric.confidence, 0, 1) || !metric.algorithmVersion.trim())
      issue(
        issues,
        'METRIC_METADATA_INVALID',
        'Metric confidence or algorithm version is invalid',
        'metric',
        metric.metricCode,
      );
    metric.evidenceIds.forEach((id) => {
      if (!evidences.has(id))
        issue(
          issues,
          'METRIC_EVIDENCE_MISSING',
          'Metric evidence is missing',
          'metric',
          metric.metricCode,
        );
    });
    if (definition?.dataTier === 'P1' && metric.evidenceIds.length === 0)
      issue(
        issues,
        'METRIC_EVIDENCE_REQUIRED',
        'P1 metrics must include evidence',
        'metric',
        metric.metricCode,
      );
    if (definition?.dataTier === 'P1' && player) {
      metric.evidenceIds
        .flatMap((id) => evidences.get(id)?.shotIds ?? [])
        .map((id) => shots.get(id))
        .filter((shot): shot is ShotRecord => Boolean(shot))
        .forEach((shot) => {
          if (shot.playerSlot !== player)
            issue(
              issues,
              'METRIC_EVIDENCE_PLAYER_MISMATCH',
              'P1 evidence must belong to the metric player',
              'metric',
              metric.metricCode,
            );
        });
    }
  });
  expectedKeys.forEach((key) => {
    if (!actualKeys.has(key))
      issue(issues, 'METRIC_DEFINITION_MISSING', `Missing metric ${key}`, 'metric', key);
  });
  const allMetric = (code: string) =>
    bundle.metrics.find((metric) => metric.metricCode === code && metric.playerSlot === 'ALL')
      ?.metricValue;
  if (allMetric('point_count') !== bundle.points.length)
    issue(
      issues,
      'METRIC_VALUE_INCONSISTENT',
      'point_count does not match points',
      'metric',
      'point_count',
    );
  if (allMetric('shot_count') !== bundle.shots.length)
    issue(
      issues,
      'METRIC_VALUE_INCONSISTENT',
      'shot_count does not match shots',
      'metric',
      'shot_count',
    );
  if (
    allMetric('max_rally_shot_count') !==
    Math.max(...bundle.rallies.map((rally) => rally.shotCount))
  )
    issue(
      issues,
      'METRIC_VALUE_INCONSISTENT',
      'max_rally_shot_count does not match rallies',
      'metric',
      'max_rally_shot_count',
    );
  return { valid: issues.length === 0, issues };
}
