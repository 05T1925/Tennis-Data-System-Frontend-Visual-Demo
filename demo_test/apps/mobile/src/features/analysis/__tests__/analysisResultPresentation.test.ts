import type {
  AnalysisResult,
  AnalysisSummary,
  CourtPoint,
  PlayerProfile,
  RallyRecord,
  ShotRecord,
} from '@tennis/shared-types';
import { describe, expect, it } from 'vitest';

import {
  canDisplayAnalysisResult,
  canOpenFullAnalysisResult,
  createAnalysisMetricGroups,
  createBallSpeedTrend,
  createLandingDistribution,
  createPlayerAbilityData,
  createRallyLengthData,
} from '../analysisResultPresentation';

const completeSummary: AnalysisSummary = {
  durationSeconds: 125,
  totalShots: 12,
  totalRallies: 3,
  averageShotsPerRally: 4,
  longestRallyShots: 6,
  averageBallSpeedKmh: 88.25,
  maxBallSpeedKmh: 102.4,
  playerDistanceMeters: 238.25,
  unforcedErrors: 2,
};

function shot(overrides: Partial<ShotRecord> = {}): ShotRecord {
  return {
    id: 'shot-1',
    videoId: 'video-1',
    rallyId: 'rally-1',
    shotIndex: 0,
    startedAtMs: 0,
    endedAtMs: 500,
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
    speedKmh: 80,
    ...overrides,
  };
}

function rally(overrides: Partial<RallyRecord> = {}): RallyRecord {
  return {
    id: 'rally-1',
    videoId: 'video-1',
    rallyIndex: 0,
    startedAtMs: 0,
    endedAtMs: 1_000,
    shotIds: ['shot-1', 'shot-2'],
    shotCount: 2,
    ...overrides,
  };
}

const result: AnalysisResult = {
  id: 'result-1',
  videoId: 'video-1',
  version: 'test',
  summary: completeSummary,
  shots: [],
  rallies: [],
  heatmapPoints: [],
  createdAt: '2026-07-16T00:00:00.000Z',
};

function metrics(summary: AnalysisSummary) {
  return createAnalysisMetricGroups(summary).flatMap(({ items }) => items);
}

describe('analysis result metrics', () => {
  it('creates all nine fixed metrics', () => {
    expect(metrics(completeSummary)).toHaveLength(9);
  });

  it('keeps the expected units for all nine metrics', () => {
    expect(metrics(completeSummary).map(({ unit }) => unit)).toEqual([
      '分/秒',
      '次',
      '回合',
      '拍/回合',
      '拍',
      'km/h',
      'km/h',
      'm',
      '次',
    ]);
  });

  it('formats a zero duration', () => {
    expect(metrics({ ...completeSummary, durationSeconds: 0 })[0].value).toBe('0秒');
  });

  it('formats minutes and zero-padded seconds', () => {
    expect(metrics(completeSummary)[0].value).toBe('2分05秒');
  });

  it('rejects a negative duration', () => {
    expect(metrics({ ...completeSummary, durationSeconds: -1 })[0].value).toBe('数据待确认');
  });

  it.each([
    ['totalShots', 0, 1],
    ['totalRallies', 0, 2],
    ['longestRallyShots', 0, 4],
    ['unforcedErrors', 0, 8],
  ] as const)('keeps zero for integer metric %s', (key, value, index) => {
    expect(metrics({ ...completeSummary, [key]: value })[index].value).toBe('0');
  });

  it.each([
    ['totalShots', 1.5, 1],
    ['totalRallies', 1.5, 2],
    ['longestRallyShots', 1.5, 4],
    ['unforcedErrors', 1.5, 8],
  ] as const)('rejects fractional integer metric %s', (key, value, index) => {
    expect(metrics({ ...completeSummary, [key]: value })[index].value).toBe('数据待确认');
  });

  it('formats an integer average without a decimal suffix', () => {
    expect(metrics(completeSummary)[3].value).toBe('4');
  });

  it('formats an average with one decimal place', () => {
    expect(metrics({ ...completeSummary, averageShotsPerRally: 4.25 })[3].value).toBe('4.3');
  });

  it('rejects a negative average', () => {
    expect(metrics({ ...completeSummary, averageShotsPerRally: -1 })[3].value).toBe('数据待确认');
  });

  it.each([
    ['averageBallSpeedKmh', 5],
    ['maxBallSpeedKmh', 6],
    ['playerDistanceMeters', 7],
    ['unforcedErrors', 8],
  ] as const)('keeps optional metric %s when missing', (key, index) => {
    expect(metrics({ ...completeSummary, [key]: undefined })[index].value).toBe('数据待确认');
  });

  it.each([
    ['averageBallSpeedKmh', Number.NaN, 5],
    ['maxBallSpeedKmh', Number.POSITIVE_INFINITY, 6],
    ['playerDistanceMeters', -1, 7],
    ['unforcedErrors', -1, 8],
  ] as const)('rejects invalid optional metric %s', (key, value, index) => {
    expect(metrics({ ...completeSummary, [key]: value })[index].value).toBe('数据待确认');
  });

  it('does not modify the summary', () => {
    const summary = { ...completeSummary };
    const before = { ...summary };
    createAnalysisMetricGroups(summary);
    expect(summary).toEqual(before);
  });

  it('includes the Demo adjudication disclaimer', () => {
    expect(metrics(completeSummary)[8].explanation).toContain('不构成正式比赛裁决');
  });
});

describe('ball speed trend', () => {
  it('creates valid speed points', () => {
    expect(createBallSpeedTrend([shot()]).points).toHaveLength(1);
  });

  it('sorts by shotIndex', () => {
    const trend = createBallSpeedTrend([
      shot({ id: 'second', shotIndex: 2 }),
      shot({ id: 'first', shotIndex: 0 }),
    ]);
    expect(trend.points.map(({ shotIndex }) => shotIndex)).toEqual([0, 2]);
  });

  it('keeps original order for duplicate shotIndex values', () => {
    const trend = createBallSpeedTrend([
      shot({ id: 'first', speedKmh: 80 }),
      shot({ id: 'second', speedKmh: 90 }),
    ]);
    expect(trend.points.map(({ speedKmh }) => speedKmh)).toEqual([80, 90]);
  });

  it.each([
    ['missing', undefined],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['negative', -1],
  ] as const)('filters %s speed', (_name, speedKmh) => {
    expect(createBallSpeedTrend([shot({ speedKmh })]).points).toHaveLength(0);
  });

  it('keeps zero speed', () => {
    expect(createBallSpeedTrend([shot({ speedKmh: 0 })]).points[0].speedKmh).toBe(0);
  });

  it('handles an empty list', () => {
    expect(createBallSpeedTrend([])).toMatchObject({ points: [], direction: '数据点不足' });
  });

  it('handles one point without a trend conclusion', () => {
    expect(createBallSpeedTrend([shot()]).direction).toBe('数据点不足');
  });

  it('handles two points', () => {
    expect(
      createBallSpeedTrend([
        shot({ speedKmh: 80 }),
        shot({ id: 'shot-2', shotIndex: 1, speedKmh: 90 }),
      ]).points,
    ).toHaveLength(2);
  });

  it('uses safe coordinates for equal speeds', () => {
    const trend = createBallSpeedTrend([
      shot({ speedKmh: 80 }),
      shot({ id: 'shot-2', shotIndex: 1, speedKmh: 80 }),
    ]);
    expect(trend.points.every(({ yRatio }) => Number.isFinite(yRatio))).toBe(true);
  });

  it('does not modify the shots array', () => {
    const shots = [shot({ id: 'second', shotIndex: 2 }), shot({ id: 'first', shotIndex: 0 })];
    const ids = shots.map(({ id }) => id);
    createBallSpeedTrend(shots);
    expect(shots.map(({ id }) => id)).toEqual(ids);
  });

  it.each([
    ['整体上升', 80, 90],
    ['整体下降', 90, 80],
    ['基本稳定', 80, 80.4],
  ] as const)('reports %s', (direction, first, last) => {
    expect(
      createBallSpeedTrend([
        shot({ speedKmh: first }),
        shot({ id: 'shot-2', shotIndex: 1, speedKmh: last }),
      ]).direction,
    ).toBe(direction);
  });

  it('summarizes valid point count and range', () => {
    expect(createBallSpeedTrend([shot({ speedKmh: 80 })]).accessibilitySummary).toContain(
      '共1次有效击球',
    );
  });
});

describe('rally length data', () => {
  it('creates a valid rally item', () => {
    expect(createRallyLengthData([rally()]).items).toHaveLength(1);
  });

  it('sorts by rallyIndex', () => {
    const data = createRallyLengthData([
      rally({ id: 'second', rallyIndex: 2 }),
      rally({ id: 'first', rallyIndex: 0 }),
    ]);
    expect(data.items.map(({ rallyIndex }) => rallyIndex)).toEqual([0, 2]);
  });

  it('keeps duplicate indexes stable', () => {
    const data = createRallyLengthData([
      rally({ id: 'first', shotCount: 1, shotIds: ['a'] }),
      rally({ id: 'second', shotCount: 2 }),
    ]);
    expect(data.items.map(({ shotCount }) => shotCount)).toEqual([1, 2]);
  });

  it('handles an empty list', () => {
    expect(createRallyLengthData([]).items).toEqual([]);
  });

  it('handles one rally', () => {
    expect(createRallyLengthData([rally()]).longestShots).toBe(2);
  });

  it('handles multiple rallies', () => {
    expect(
      createRallyLengthData([rally(), rally({ id: 'rally-2', rallyIndex: 1 })]).items,
    ).toHaveLength(2);
  });

  it.each([
    ['negative shotCount', { shotCount: -1 }],
    ['fractional shotCount', { shotCount: 1.5 }],
    ['mismatched shotIds', { shotCount: 1 }],
    ['negative rallyIndex', { rallyIndex: -1 }],
    ['NaN rallyIndex', { rallyIndex: Number.NaN }],
  ] satisfies readonly [string, Partial<RallyRecord>][])('filters %s', (_name, overrides) => {
    const data = createRallyLengthData([rally(overrides)]);
    expect(data).toMatchObject({ items: [], invalidCount: 1 });
  });

  it('keeps a valid zero-shot rally', () => {
    expect(createRallyLengthData([rally({ shotCount: 0, shotIds: [] })]).items[0].shotCount).toBe(
      0,
    );
  });

  it('does not modify rallies', () => {
    const rallies = [rally({ id: 'second', rallyIndex: 2 }), rally({ id: 'first', rallyIndex: 0 })];
    const ids = rallies.map(({ id }) => id);
    createRallyLengthData(rallies);
    expect(rallies.map(({ id }) => id)).toEqual(ids);
  });
});

describe('landing distribution', () => {
  it('keeps a point inside the Demo window', () => {
    expect(createLandingDistribution([{ x: 0.5, y: 0.5 }]).points).toHaveLength(1);
  });

  it('handles an empty list', () => {
    expect(createLandingDistribution([]).points).toEqual([]);
  });

  it.each([
    ['NaN x', { x: Number.NaN, y: 0.5 }],
    ['Infinity y', { x: 0.5, y: Number.POSITIVE_INFINITY }],
    ['x below zero', { x: -0.1, y: 0.5 }],
    ['x above one', { x: 1.1, y: 0.5 }],
    ['y below zero', { x: 0.5, y: -0.1 }],
    ['y above one', { x: 0.5, y: 1.1 }],
  ] satisfies readonly [string, CourtPoint][])('filters %s', (_name, point) => {
    expect(createLandingDistribution([point])).toMatchObject({ points: [], invalidCount: 1 });
  });

  it.each([
    ['zero boundary', { x: 0, y: 0 }],
    ['one boundary', { x: 1, y: 1 }],
  ] satisfies readonly [string, CourtPoint][])('keeps %s', (_name, point) => {
    expect(createLandingDistribution([point]).points).toHaveLength(1);
  });

  it('keeps overlapping points without jitter', () => {
    const data = createLandingDistribution([
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.5 },
    ]);
    expect(data.points.map(({ xRatio, yRatio }) => [xRatio, yRatio])).toEqual([
      [0.5, 0.5],
      [0.5, 0.5],
    ]);
  });

  it('uses visible fallback opacity without confidence', () => {
    expect(createLandingDistribution([{ x: 0.5, y: 0.5 }]).points[0].opacity).toBeGreaterThan(0);
  });

  it('uses bounded confidence for opacity', () => {
    expect(createLandingDistribution([{ x: 0.5, y: 0.5, confidence: 1 }]).points[0].opacity).toBe(
      1,
    );
  });

  it('does not modify point input', () => {
    const points = [{ x: 0.5, y: 0.5 }];
    const before = points.map((point) => ({ ...point }));
    createLandingDistribution(points);
    expect(points).toEqual(before);
  });

  it('reports valid and invalid point counts', () => {
    const data = createLandingDistribution([
      { x: 0.5, y: 0.5 },
      { x: 2, y: 0.5 },
    ]);
    expect(data.accessibilitySummary).toContain('1个有效相对落点，1个点位待确认');
  });
});

describe('player ability data', () => {
  const profile: PlayerProfile = { consistency: 72, attack: 76, defense: 68, movement: 74 };

  it('creates all four profile items', () => {
    expect(createPlayerAbilityData(profile)?.items).toHaveLength(4);
  });

  it('returns null when the profile is missing', () => {
    expect(createPlayerAbilityData(undefined)).toBeNull();
  });

  it.each([
    ['NaN', { consistency: Number.NaN }],
    ['Infinity', { attack: Number.POSITIVE_INFINITY }],
    ['negative', { defense: -1 }],
  ] satisfies readonly [string, Partial<PlayerProfile>][])(
    'marks %s values invalid',
    (_name, overrides) => {
      const data = createPlayerAbilityData({ ...profile, ...overrides });
      expect(data?.items.some(({ valueText }) => valueText === '数据待确认')).toBe(true);
    },
  );

  it('keeps all-zero values with zero relative widths', () => {
    const data = createPlayerAbilityData({ consistency: 0, attack: 0, defense: 0, movement: 0 });
    expect(
      data?.items.every(({ value, relativeWidth }) => value === 0 && relativeWidth === 0),
    ).toBe(true);
  });

  it('uses the largest valid value as the relative width baseline', () => {
    expect(
      createPlayerAbilityData(profile)?.items.find(({ key }) => key === 'attack')?.relativeWidth,
    ).toBe(1);
  });

  it('does not add a percent sign', () => {
    expect(
      createPlayerAbilityData(profile)?.items.every(({ valueText }) => !valueText.includes('%')),
    ).toBe(true);
  });

  it('keeps raw values', () => {
    expect(createPlayerAbilityData(profile)?.items.map(({ value }) => value)).toEqual([
      72, 76, 68, 74,
    ]);
  });

  it('does not modify the profile', () => {
    const before = { ...profile };
    createPlayerAbilityData(profile);
    expect(profile).toEqual(before);
  });

  it('states that the profile is not a percentage or professional rating', () => {
    expect(createPlayerAbilityData(profile)?.accessibilitySummary).toContain(
      '不是百分制或专业评级',
    );
  });
});

describe('result qualification', () => {
  const valid = {
    identityValid: true,
    videoQueryFetching: false,
    taskQuerySuccess: true,
    taskQueryFetching: false,
    taskStatus: 'succeeded',
    resultQuerySuccess: true,
    resultQueryFetching: false,
    result,
  } as const;

  it('allows a succeeded task with a result', () => {
    expect(canDisplayAnalysisResult(valid)).toBe(true);
  });

  it('uses the same strict rule for the detail entry', () => {
    expect(canOpenFullAnalysisResult(valid)).toBe(true);
  });

  it.each([
    ['invalid identity', { identityValid: false }],
    ['video refetch in progress', { videoQueryFetching: true }],
    ['task query error', { taskQuerySuccess: false }],
    ['task refetch in progress', { taskQueryFetching: true }],
    ['task null', { taskStatus: null }],
    ['queued task', { taskStatus: 'queued' }],
    ['processing task', { taskStatus: 'processing' }],
    ['failed task', { taskStatus: 'failed' }],
    ['canceled task', { taskStatus: 'canceled' }],
    ['result query error', { resultQuerySuccess: false }],
    ['result refetch in progress', { resultQueryFetching: true }],
    ['result null', { result: null }],
  ] as const)('rejects %s', (_name, overrides) => {
    expect(canDisplayAnalysisResult({ ...valid, ...overrides })).toBe(false);
  });

  it('rejects stale cached result while the current task is queued', () => {
    expect(canDisplayAnalysisResult({ ...valid, taskStatus: 'queued', result })).toBe(false);
  });
});
