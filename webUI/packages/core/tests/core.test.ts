import { describe, expect, it } from 'vitest';
import {
  adaptMetricDto,
  demoMatchFixture,
  findPointAtTime,
  findRallyAtTime,
  findShotAtTime,
  formatPercentage,
  formatSpeedKmh,
  getPlaybackContextAtTime,
  getEvidenceForMetric,
  getLandingPointsByPlayer,
  getMetricsByDimension,
  getMetricsByPlayer,
  getOverviewInsights,
  getRallyLengthCategory,
  getRallyDistribution,
  getServeDirectionSummary,
  getServeLandingPoints,
  getShotSpeedSummary,
  mapAnalysisTimeToMediaTime,
  mapMediaTimeToAnalysisTime,
  parseAnalysisTimeParam,
  parsePlayerSlotParam,
  validateDemoMatchBundle,
} from '../src/index';
import type { MetricDto } from '../src/index';
const dto: MetricDto = {
  upload_id: 'demo-upload-001',
  player_slot: 'A',
  metric_code: 'point_win_rate',
  metric_name: '得分率',
  metric_value: 0.5,
  metric_unit: 'rate',
  sample_size: 12,
  scope_type: 'upload',
  scope_id: 'demo-upload-001',
  dimension: 'scoring',
  confidence: 0.9,
  algorithm_version: 'v1',
  created_at: '2026-07-23T12:00:00.000Z',
  data_tier: 'P0',
  evidence_ids: ['evidence-all'],
};
describe('core foundation', () => {
  it('adapts snake_case without mutating input', () => {
    const before = structuredClone(dto);
    const adapted = adaptMetricDto(dto);
    expect(adapted.uploadId).toBe(dto.upload_id);
    expect(dto).toEqual(before);
  });
  it('rejects invalid rate and ISO time', () => {
    expect(() => adaptMetricDto({ ...dto, metric_value: 1.2 })).toThrow();
    expect(() => adaptMetricDto({ ...dto, created_at: 'not-a-date' })).toThrow();
  });
  it('validates the deterministic fixture', () =>
    expect(validateDemoMatchBundle(demoMatchFixture).valid).toBe(true));
  it('detects duplicate shot IDs, bad links, duplicate rally IDs, and bad evidence', () => {
    const duplicate = structuredClone(demoMatchFixture);
    duplicate.shots[1]!.id = duplicate.shots[0]!.id;
    expect(
      validateDemoMatchBundle(duplicate).issues.some((issue) => issue.code === 'duplicate_id'),
    ).toBe(true);
    const links = structuredClone(demoMatchFixture);
    links.points[0]!.rallyId = 'rally-2';
    expect(
      validateDemoMatchBundle(links).issues.some((issue) => issue.code === 'point_rally_link'),
    ).toBe(true);
    const rally = structuredClone(demoMatchFixture);
    rally.rallies[0]!.shotIds[1] = rally.rallies[0]!.shotIds[0]!;
    expect(
      validateDemoMatchBundle(rally).issues.some((issue) => issue.code === 'duplicate_shot_id'),
    ).toBe(true);
    const evidence = structuredClone(demoMatchFixture);
    evidence.evidences[0]!.pointIds.push('missing');
    expect(
      validateDemoMatchBundle(evidence).issues.some((issue) => issue.code === 'evidence_point'),
    ).toBe(true);
  });
  it('uses half-open time ranges', () => {
    const point = demoMatchFixture.points[0]!;
    expect(findPointAtTime(demoMatchFixture, point.startTimeMs)).toEqual(point);
    expect(findPointAtTime(demoMatchFixture, point.endTimeMs)).toBeNull();
    const shot = demoMatchFixture.shots[0]!;
    expect(findShotAtTime(demoMatchFixture, shot.startTimeMs)).toEqual(shot);
    expect(findShotAtTime(demoMatchFixture, shot.endTimeMs)).toBeNull();
    const rally = demoMatchFixture.rallies[0]!;
    expect(findRallyAtTime(demoMatchFixture, rally.startTimeMs)).toEqual(rally);
    expect(findRallyAtTime(demoMatchFixture, -1)).toBeNull();
  });
  it('categorizes rally lengths and selectors', () => {
    expect([1, 4, 5, 8, 9].map(getRallyLengthCategory)).toEqual([
      'short',
      'short',
      'medium',
      'medium',
      'long',
    ]);
    expect(getMetricsByPlayer(demoMatchFixture, 'A').length).toBeGreaterThan(0);
    expect(getMetricsByDimension(demoMatchFixture, 'serve').length).toBeGreaterThan(0);
    expect(getEvidenceForMetric(demoMatchFixture, demoMatchFixture.metrics[0]!).length).toBe(1);
  });
  it('formats safely', () => {
    expect(formatPercentage(0.675)).toBe('67.5%');
    expect(formatSpeedKmh(20)).toBe('72.0 km/h');
    expect(formatPercentage(null)).toBe('—');
    expect(formatSpeedKmh(Number.NaN)).toBe('—');
  });
  it('maps analysis and media time with clamping and invalid-duration safety', () => {
    expect(mapAnalysisTimeToMediaTime(30_000, 60_000, 60)).toBe(30);
    expect(mapAnalysisTimeToMediaTime(30_000, 60_000, 120)).toBe(60);
    expect(mapAnalysisTimeToMediaTime(80_000, 60_000, 120)).toBe(120);
    expect(mapAnalysisTimeToMediaTime(1, 60_000, 0)).toBeNull();
    expect(mapMediaTimeToAnalysisTime(60, 120, 60_000)).toBe(30_000);
    expect(mapMediaTimeToAnalysisTime(-10, 120, 60_000)).toBe(0);
    expect(mapMediaTimeToAnalysisTime(1, Number.NaN, 60_000)).toBeNull();
  });
  it('parses URL time and selects point, gap, and final-score contexts', () => {
    expect(parseAnalysisTimeParam('35000.6', 120_000)).toBe(35_001);
    expect(parseAnalysisTimeParam('-5', 120_000)).toBe(0);
    expect(parseAnalysisTimeParam('bad', 120_000)).toBe(0);
    expect(parseAnalysisTimeParam('999999', 120_000)).toBe(120_000);
    const first = demoMatchFixture.points[0]!;
    expect(getPlaybackContextAtTime(demoMatchFixture, first.startTimeMs).point?.id).toBe(first.id);
    const gapTime = first.endTimeMs + 1;
    const gap = getPlaybackContextAtTime(demoMatchFixture, gapTime);
    expect(gap.phase).toBe('gap');
    expect(gap.point).toBeNull();
    expect(gap.score).toBe(first.scoreAfter);
    const ended = getPlaybackContextAtTime(demoMatchFixture, 120_000);
    expect(ended.phase).toBe('ended');
    expect(ended.score).toBe(demoMatchFixture.points.at(-1)?.scoreAfter);
  });

  it('derives reusable statistics selectors from shared Shots and Rallies', () => {
    expect(parsePlayerSlotParam('B')).toBe('B');
    expect(parsePlayerSlotParam('invalid')).toBe('A');
    const speed = getShotSpeedSummary(demoMatchFixture, 'A');
    expect(speed.sampleSize).toBeGreaterThan(0);
    expect(speed.avgSpeedMps).not.toBeNull();
    expect(speed.p90SpeedMps).toBeGreaterThanOrEqual(speed.avgSpeedMps!);
    const empty = structuredClone(demoMatchFixture);
    empty.shots.forEach((shot) => {
      if (shot.strokeType !== 'serve') shot.speedMps = null;
    });
    expect(getShotSpeedSummary(empty, 'A').maxSpeedMps).toBeNull();
    const rallyA = getRallyDistribution(demoMatchFixture, 'A');
    const rallyB = getRallyDistribution(demoMatchFixture, 'B');
    expect(rallyA.map((item) => item.band)).toEqual(['short', 'medium', 'long']);
    expect(rallyA.reduce((sum, item) => sum + item.count, 0)).toBe(demoMatchFixture.rallies.length);
    expect(rallyB.every((item) => item.winRate === null || item.winRate <= 1)).toBe(true);
  });

  it('keeps landing and serve-direction derivations finite and traceable', () => {
    expect(
      getLandingPointsByPlayer(demoMatchFixture, 'A').every((item) => Number.isFinite(item.x)),
    ).toBe(true);
    expect(getServeLandingPoints(demoMatchFixture, 'B').every((item) => item.serveNumber)).toBe(
      true,
    );
    const direction = getServeDirectionSummary(demoMatchFixture, 'A');
    expect(direction).toHaveLength(3);
    expect(direction.reduce((sum, item) => sum + item.count, 0)).toBe(direction[0]!.sampleSize);
    expect(getOverviewInsights(demoMatchFixture).every((item) => item.evidenceCode)).toBe(true);
  });

  it('handles tied Overview errors without inventing a problem player', () => {
    const currentIssue = getOverviewInsights(demoMatchFixture).find(
      (item) => item.kind !== 'advantage',
    )!;
    expect(currentIssue.playerSlot).not.toBe('B');
    const aHigher = structuredClone(demoMatchFixture);
    aHigher.metrics.find(
      (metric) => metric.metricCode === 'unforced_error_count' && metric.playerSlot === 'A',
    )!.metricValue = 3;
    expect(getOverviewInsights(aHigher).at(-1)).toMatchObject({
      kind: 'issue',
      playerSlot: 'A',
      evidenceCode: 'unforced_error_count',
    });
    const bothTied = structuredClone(demoMatchFixture);
    for (const code of ['unforced_error_count', 'forced_error_count']) {
      for (const player of ['A', 'B'] as const) {
        bothTied.metrics.find(
          (metric) => metric.metricCode === code && metric.playerSlot === player,
        )!.metricValue = 1;
      }
    }
    expect(getOverviewInsights(bothTied).at(-1)).toMatchObject({
      kind: 'neutral',
      playerSlot: 'ALL',
    });
  });

  it('uses error end points and fault end points when bounce data is absent', () => {
    const rallyLanding = [
      ...getLandingPointsByPlayer(demoMatchFixture, 'A'),
      ...getLandingPointsByPlayer(demoMatchFixture, 'B'),
    ];
    expect(
      rallyLanding.some((point) => point.errorClassification === 'forced' && point.isError),
    ).toBe(true);
    expect(
      rallyLanding.every(
        (point) =>
          Number.isFinite(point.x) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1,
      ),
    ).toBe(true);
    const noBounceError = structuredClone(demoMatchFixture);
    noBounceError.shots.find((shot) => shot.errorClassification === 'forced')!.bouncePoint = null;
    expect(
      [
        ...getLandingPointsByPlayer(noBounceError, 'A'),
        ...getLandingPointsByPlayer(noBounceError, 'B'),
      ].some((point) => point.errorClassification === 'forced' && point.positionSource === 'end'),
    ).toBe(true);
    const serves = [
      ...getServeLandingPoints(demoMatchFixture, 'A'),
      ...getServeLandingPoints(demoMatchFixture, 'B'),
    ];
    const faults = serves.filter((point) => point.outcome === 'fault');
    expect(faults.length).toBeGreaterThanOrEqual(2);
    expect(faults.every((point) => point.positionSource === 'end')).toBe(true);
    expect(new Set(faults.map((point) => point.serveNumber))).toEqual(new Set(['first', 'second']));
  });
});
