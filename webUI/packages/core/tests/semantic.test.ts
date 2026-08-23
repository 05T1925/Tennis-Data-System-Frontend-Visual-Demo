import { describe, expect, it } from 'vitest';
import {
  demoMatchFixture,
  getMetricByCode,
  getMetricDefinition,
  getRallyLengthCategory,
  safeMax,
  validateDemoMatchBundle,
} from '../src/index';
import type { DemoMatchBundle } from '../src/index';

const point = (id: string) => demoMatchFixture.points.find((entry) => entry.id === id)!;
const rally = (id: string) => demoMatchFixture.rallies.find((entry) => entry.id === id)!;
const terminal = (pointId: string) => {
  const currentPoint = point(pointId);
  const currentRally = rally(currentPoint.rallyId);
  return demoMatchFixture.shots.find(
    (shot) => shot.id === currentRally.shotIds[currentRally.shotIds.length - 1],
  )!;
};
const metric = (code: string, slot: 'A' | 'B' | 'ALL') =>
  getMetricByCode(demoMatchFixture, code, slot)!;
const invalid = (change: (bundle: DemoMatchBundle) => void, code: string) => {
  const copy = structuredClone(demoMatchFixture);
  change(copy);
  expect(validateDemoMatchBundle(copy).issues.some((issue) => issue.code === code)).toBe(true);
};

describe('First-1R tennis event semantics', () => {
  it('models Ace, service winner, and double fault correctly', () => {
    expect(rally('rally-1').shotCount).toBe(1);
    expect(terminal('point-1').serve?.outcome).toBe('ace');
    expect(point('point-1').winnerSlot).toBe(point('point-1').serverSlot);
    expect(rally('rally-9').shotCount).toBe(1);
    expect(terminal('point-9').serve?.outcome).toBe('service_winner');
    expect(rally('rally-2').shotCount).toBe(2);
    expect(
      rally('rally-2').shotIds.map(
        (id) => demoMatchFixture.shots.find((shot) => shot.id === id)?.serve?.serveNumber,
      ),
    ).toEqual(['first', 'second']);
    expect(point('point-2').winnerSlot).toBe(point('point-2').receiverSlot);
  });

  it('derives winner from terminal event for winners and errors', () => {
    expect(terminal('point-3').playerSlot).toBe(point('point-3').winnerSlot);
    for (const id of [
      'point-4',
      'point-5',
      'point-6',
      'point-7',
      'point-8',
      'point-11',
      'point-12',
    ]) {
      expect(terminal(id).playerSlot).not.toBe(point(id).winnerSlot);
    }
    expect(terminal('point-4').errorClassification).toBe('forced');
    expect(terminal('point-5').errorClassification).toBe('unforced');
  });

  it('rejects semantic counterexamples', () => {
    invalid((bundle) => {
      bundle.points[0]!.winnerSlot = 'B';
    }, 'ACE_TERMINAL_SHOT_INVALID');
    invalid((bundle) => {
      bundle.rallies[0]!.shotIds.push('rally-1-shot-2');
    }, 'RALLY_SHOT_MISSING');
    invalid((bundle) => {
      bundle.rallies[1]!.shotIds.pop();
    }, 'DOUBLE_FAULT_STRUCTURE_INVALID');
    invalid((bundle) => {
      bundle.points[1]!.winnerSlot = 'B';
    }, 'DOUBLE_FAULT_STRUCTURE_INVALID');
    invalid((bundle) => {
      bundle.shots[1]!.serve = null;
    }, 'SERVE_METADATA_REQUIRED');
    invalid((bundle) => {
      bundle.shots[0]!.serve = null;
    }, 'SERVE_METADATA_REQUIRED');
    invalid((bundle) => {
      bundle.shots[1]!.strokeType = 'forehand';
    }, 'SERVE_METADATA_FORBIDDEN');
    invalid((bundle) => {
      bundle.clips[0]!.pointId = 'missing';
    }, 'CLIP_POINT_MISSING');
    invalid((bundle) => {
      bundle.clips[0]!.rallyId = 'rally-2';
    }, 'CLIP_POINT_RALLY_MISMATCH');
    invalid((bundle) => {
      bundle.metrics.find(
        (entry) => entry.metricCode === 'point_count' && entry.playerSlot === 'ALL',
      )!.metricName = 'bad';
    }, 'METRIC_NAME_MISMATCH');
    invalid((bundle) => {
      bundle.metrics.find(
        (entry) => entry.metricCode === 'point_count' && entry.playerSlot === 'ALL',
      )!.sampleSize = 1;
    }, 'METRIC_SAMPLE_SIZE_INVALID');
  });

  it('provides A, B, and ALL metrics without ambiguity', () => {
    expect(metric('point_win_rate', 'A').playerSlot).toBe('A');
    expect(metric('point_win_rate', 'B').playerSlot).toBe('B');
    expect(metric('video_duration_ms', 'ALL').playerSlot).toBe('ALL');
    expect(getMetricByCode(demoMatchFixture, 'point_win_rate')).toBeNull();
    expect(getMetricDefinition('first_serve_in_rate')?.name).toBe('一发成功率');
    expect(getMetricDefinition('video_duration_ms')?.playerScope).toBe('ALL');
  });

  it('uses metric-specific sample sizes and safe null maxima for zero denominators', () => {
    expect(metric('forehand_in_rate', 'A').sampleSize).toBeGreaterThan(0);
    expect(metric('backhand_in_rate', 'B').sampleSize).toBeGreaterThan(0);
    expect(metric('first_serve_in_rate', 'A').sampleSize).toBeGreaterThan(0);
    expect(metric('second_serve_in_rate', 'B').sampleSize).toBeGreaterThan(0);
    expect(metric('long_rally_win_rate', 'A').sampleSize).toBe(2);
    expect(metric('max_serve_speed_mps', 'B').sampleSize).toBeGreaterThan(0);
    for (const slot of ['A', 'B'] as const) {
      const serves = demoMatchFixture.shots.filter(
        (shot) => shot.playerSlot === slot && shot.serve,
      );
      const validServes = serves.filter((shot) => shot.serve?.outcome !== 'fault');
      expect(metric('double_fault_rate', slot).sampleSize).toBe(
        demoMatchFixture.points.filter((entry) => entry.serverSlot === slot).length,
      );
      expect(metric('ace_rate', slot).sampleSize).toBe(validServes.length);
      expect(metric('service_winner_rate', slot).sampleSize).toBe(validServes.length);
      expect(metric('first_serve_avg_speed_mps', slot).sampleSize).toBe(
        validServes.filter((shot) => shot.serve?.serveNumber === 'first' && shot.speedMps !== null)
          .length,
      );
      expect(metric('second_serve_avg_speed_mps', slot).sampleSize).toBe(
        validServes.filter((shot) => shot.serve?.serveNumber === 'second' && shot.speedMps !== null)
          .length,
      );
      expect(metric('wide_serve_rate', slot).sampleSize).toBe(
        serves.filter((shot) => shot.serve?.direction !== 'unknown').length,
      );
      const servingPoints = demoMatchFixture.points.filter((entry) => entry.serverSlot === slot);
      expect(metric('first_serve_point_win_rate', slot).sampleSize).toBe(
        servingPoints.filter((entry) => {
          const entryRally = rally(entry.rallyId);
          return entryRally.shotIds.some((id) => {
            const shot = demoMatchFixture.shots.find((candidate) => candidate.id === id);
            return shot?.serve?.serveNumber === 'first' && shot.serve.outcome !== 'fault';
          });
        }).length,
      );
      expect(metric('second_serve_point_win_rate', slot).sampleSize).toBe(
        servingPoints.filter((entry) => {
          const entryRally = rally(entry.rallyId);
          return entryRally.shotIds.some((id) => {
            const shot = demoMatchFixture.shots.find((candidate) => candidate.id === id);
            return shot?.serve?.serveNumber === 'second' && shot.serve.outcome !== 'fault';
          });
        }).length,
      );
    }
    const noServeSpeed = structuredClone(demoMatchFixture);
    noServeSpeed.shots.forEach((shot) => {
      if (shot.serve) shot.speedMps = null;
    });
    const noServeSpeedMetric = noServeSpeed.metrics.find(
      (entry) => entry.metricCode === 'max_serve_speed_mps' && entry.playerSlot === 'A',
    )!;
    noServeSpeedMetric.metricValue = null;
    noServeSpeedMetric.sampleSize = 0;
    expect(validateDemoMatchBundle(noServeSpeed).issues).not.toContainEqual(
      expect.objectContaining({ code: 'METRIC_VALUE_INVALID' }),
    );
    expect(safeMax([])).toBeNull();
    expect(safeMax([Number.NaN, Number.POSITIVE_INFINITY])).toBeNull();
  });

  it('links player-isolated evidence, clips, and winner metrics', () => {
    expect(demoMatchFixture.evidences.length).toBeGreaterThanOrEqual(6);
    const errorEvidence = demoMatchFixture.evidences.find(
      (entry) => entry.evidenceId === 'evidence-unforced-b',
    )!;
    expect(errorEvidence.pointIds).toEqual(['point-12']);
    expect(errorEvidence.shotIds).toContain('rally-12-shot-8');
    for (const slot of ['A', 'B'] as const) {
      const fastest = demoMatchFixture.shots
        .filter((shot) => shot.playerSlot === slot && shot.serve && shot.serve.outcome !== 'fault')
        .sort((left, right) => right.speedMps! - left.speedMps!)[0]!;
      const fastestMetric = metric('max_serve_speed_mps', slot);
      const evidence = demoMatchFixture.evidences.find((entry) =>
        fastestMetric.evidenceIds.includes(entry.evidenceId),
      )!;
      expect(evidence.shotIds).toContain(fastest.id);
      expect(
        evidence.shotIds.every(
          (id) => demoMatchFixture.shots.find((shot) => shot.id === id)?.playerSlot === slot,
        ),
      ).toBe(true);
    }
    expect(metric('ace_rate', 'B').metricValue).toBe(0);
    expect(metric('ace_rate', 'B').evidenceIds).not.toContain('evidence-ace');
    expect(metric('winner_count', 'A').metricValue).toBe(1);
    expect(metric('winner_count', 'B').metricValue).toBe(1);
    const fastestServe = demoMatchFixture.shots
      .filter((shot) => shot.serve?.outcome !== 'fault' && shot.speedMps !== null)
      .sort((left, right) => right.speedMps! - left.speedMps!)[0]!;
    const fastestClip = demoMatchFixture.clips.find((clip) => clip.clipId === 'clip-fast-serve')!;
    expect(fastestClip.pointId).toBe(fastestServe.pointId);
    expect(fastestClip.playerSlot).toBe(fastestServe.playerSlot);
    expect(demoMatchFixture.clips.every((clip) => clip.pointId && clip.rallyId)).toBe(true);
    expect(validateDemoMatchBundle(demoMatchFixture).issues).toEqual([]);
    expect([1, 4, 5, 8, 9].map(getRallyLengthCategory)).toEqual([
      'short',
      'short',
      'medium',
      'medium',
      'long',
    ]);
  });

  it('rejects cross-linked evidence, duplicate metrics, missing P1 evidence, bad clip players, and score chains', () => {
    invalid((bundle) => {
      bundle.evidences.find((entry) => entry.evidenceId === 'evidence-ace')!.shotIds = [
        'rally-2-shot-1',
      ];
    }, 'EVIDENCE_SHOT_LINK_INVALID');
    invalid((bundle) => {
      bundle.evidences.find((entry) => entry.evidenceId === 'evidence-ace')!.rallyIds = ['rally-2'];
    }, 'EVIDENCE_RALLY_POINT_MISMATCH');
    invalid((bundle) => {
      bundle.metrics.push(structuredClone(bundle.metrics[0]!));
    }, 'METRIC_KEY_DUPLICATE');
    invalid((bundle) => {
      bundle.metrics.find((entry) => entry.dataTier === 'P1')!.evidenceIds = [];
    }, 'METRIC_EVIDENCE_REQUIRED');
    invalid((bundle) => {
      bundle.clips.find((entry) => entry.type === 'serve')!.playerSlot = 'B';
    }, 'CLIP_PLAYER_MISMATCH');
    invalid((bundle) => {
      bundle.clips.find((entry) => entry.type === 'winner')!.playerSlot = 'B';
    }, 'CLIP_PLAYER_MISMATCH');
    invalid((bundle) => {
      bundle.points[1]!.scoreBefore = '9-9';
    }, 'SCORE_CHAIN_INVALID');
  });

  it('uses non-serve Player B samples for the zero forced-error metric', () => {
    const forcedB = metric('forced_error_count', 'B');
    const evidence = demoMatchFixture.evidences.find((entry) =>
      forcedB.evidenceIds.includes(entry.evidenceId),
    )!;
    expect(forcedB.metricValue).toBe(0);
    expect(evidence.label).toContain('未检测到 Player B 受迫失误');
    expect(evidence.shotIds.length).toBeGreaterThan(0);
    expect(
      evidence.shotIds.every((id) => {
        const shot = demoMatchFixture.shots.find((entry) => entry.id === id);
        return shot?.playerSlot === 'B' && shot.strokeType !== 'serve';
      }),
    ).toBe(true);
  });
});
