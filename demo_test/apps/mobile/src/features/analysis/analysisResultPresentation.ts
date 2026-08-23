import type {
  AnalysisResult,
  AnalysisStatus,
  AnalysisSummary,
  CourtPoint,
  PlayerProfile,
  RallyRecord,
  ShotRecord,
} from '@tennis/shared-types';

export type AnalysisMetricItem = {
  key: string;
  label: string;
  value: string;
  unit: string;
  explanation: string;
  accessibilityLabel: string;
};

export type AnalysisMetricGroup = {
  key: 'overview' | 'performance';
  title: string;
  items: AnalysisMetricItem[];
};

export type BallSpeedTrendPoint = {
  key: string;
  shotIndex: number;
  label: string;
  speedKmh: number;
  yRatio: number;
};

export type BallSpeedTrend = {
  points: BallSpeedTrendPoint[];
  minimumKmh: number | null;
  maximumKmh: number | null;
  direction: '整体上升' | '整体下降' | '基本稳定' | '数据点不足';
  accessibilitySummary: string;
};

export type RallyLengthItem = {
  key: string;
  rallyIndex: number;
  label: string;
  shotCount: number;
  heightRatio: number;
};

export type RallyLengthData = {
  items: RallyLengthItem[];
  invalidCount: number;
  longestShots: number | null;
  accessibilitySummary: string;
};

export type LandingDistributionPoint = {
  key: string;
  xRatio: number;
  yRatio: number;
  opacity: number;
};

export type LandingDistributionData = {
  points: LandingDistributionPoint[];
  invalidCount: number;
  accessibilitySummary: string;
};

export type PlayerAbilityItem = {
  key: keyof PlayerProfile;
  label: string;
  value: number | null;
  valueText: string;
  relativeWidth: number;
  explanation: string;
  accessibilityLabel: string;
};

export type PlayerAbilityData = {
  items: PlayerAbilityItem[];
  accessibilitySummary: string;
};

type ResultDisplayQualification = {
  identityValid: boolean;
  videoQueryFetching: boolean;
  taskQuerySuccess: boolean;
  taskQueryFetching: boolean;
  taskStatus: AnalysisStatus | string | null | undefined;
  resultQuerySuccess: boolean;
  resultQueryFetching: boolean;
  result: AnalysisResult | null | undefined;
};

function isFiniteNonNegative(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: number | null | undefined): value is number {
  return isFiniteNonNegative(value) && Number.isInteger(value);
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits }).format(value);
}

function formatDuration(value: number) {
  if (!isFiniteNonNegative(value)) return '数据待确认';
  const seconds = Math.floor(value);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes === 0) return `${seconds}秒`;
  return `${minutes}分${remainder.toString().padStart(2, '0')}秒`;
}

function formatInteger(value: number | undefined) {
  return isNonNegativeInteger(value) ? formatNumber(value, 0) : '数据待确认';
}

function formatDecimal(value: number | undefined) {
  return isFiniteNonNegative(value) ? formatNumber(value) : '数据待确认';
}

function metric(
  key: string,
  label: string,
  value: string,
  unit: string,
  explanation: string,
): AnalysisMetricItem {
  return {
    key,
    label,
    value,
    unit,
    explanation,
    accessibilityLabel: `${label}：${value}，单位${unit}。${explanation}`,
  };
}

export function createAnalysisMetricGroups(summary: AnalysisSummary): AnalysisMetricGroup[] {
  return [
    {
      key: 'overview',
      title: '本次分析概览',
      items: [
        metric(
          'duration',
          '视频时长',
          formatDuration(summary.durationSeconds),
          '分/秒',
          '本次视频纳入分析的总时长。',
        ),
        metric(
          'total-shots',
          '总击球次数',
          formatInteger(summary.totalShots),
          '次',
          '本次视频中识别到的击球总数。',
        ),
        metric(
          'total-rallies',
          '总回合数',
          formatInteger(summary.totalRallies),
          '回合',
          '本次视频中识别到的连续击球回合数。',
        ),
        metric(
          'average-shots',
          '平均每回合拍数',
          formatDecimal(summary.averageShotsPerRally),
          '拍/回合',
          '反映每个回合通常包含多少次击球。',
        ),
        metric(
          'longest-rally',
          '最长回合',
          formatInteger(summary.longestRallyShots),
          '拍',
          '本次视频中连续击球次数最多的回合。',
        ),
      ],
    },
    {
      key: 'performance',
      title: '运动表现',
      items: [
        metric(
          'average-speed',
          '平均球速',
          formatDecimal(summary.averageBallSpeedKmh),
          'km/h',
          '所有有效击球速度的平均值。',
        ),
        metric(
          'maximum-speed',
          '最高球速',
          formatDecimal(summary.maxBallSpeedKmh),
          'km/h',
          '本次视频中识别到的最高击球速度。',
        ),
        metric(
          'distance',
          '跑动距离',
          formatDecimal(summary.playerDistanceMeters),
          'm',
          '本次视频中识别到的球员累计移动距离。',
        ),
        metric(
          'unforced-errors',
          '非受迫性失误',
          formatInteger(summary.unforcedErrors),
          '次',
          '在没有明显外部压迫时出现的失误次数。当前为Demo识别结果，不构成正式比赛裁决。',
        ),
      ],
    },
  ];
}

function stableSortByIndex<T>(items: readonly T[], getIndex: (item: T) => number) {
  return items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort(
      (left, right) =>
        getIndex(left.item) - getIndex(right.item) || left.originalIndex - right.originalIndex,
    )
    .map(({ item }) => item);
}

export function createBallSpeedTrend(shots: readonly ShotRecord[]): BallSpeedTrend {
  const validShots = stableSortByIndex(shots, (shot) => shot.shotIndex).filter(
    (shot) => Number.isFinite(shot.shotIndex) && isFiniteNonNegative(shot.speedKmh),
  );
  const speeds = validShots.map(({ speedKmh }) => speedKmh as number);
  const minimumKmh = speeds.length > 0 ? Math.min(...speeds) : null;
  const maximumKmh = speeds.length > 0 ? Math.max(...speeds) : null;
  const displayMinimum =
    minimumKmh === maximumKmh && minimumKmh !== null ? minimumKmh - 1 : minimumKmh;
  const displayMaximum =
    minimumKmh === maximumKmh && maximumKmh !== null ? maximumKmh + 1 : maximumKmh;
  const range =
    displayMinimum !== null && displayMaximum !== null ? displayMaximum - displayMinimum : 0;
  const points = validShots.map((shot, index) => {
    const speedKmh = shot.speedKmh as number;
    return {
      key: `${shot.id}-${index}`,
      shotIndex: shot.shotIndex,
      label: `第${shot.shotIndex + 1}次击球`,
      speedKmh,
      yRatio: range > 0 && displayMinimum !== null ? (speedKmh - displayMinimum) / range : 0.5,
    };
  });
  let direction: BallSpeedTrend['direction'] = '数据点不足';
  if (points.length >= 2) {
    const difference = points[points.length - 1].speedKmh - points[0].speedKmh;
    direction = difference > 0.5 ? '整体上升' : difference < -0.5 ? '整体下降' : '基本稳定';
  }
  const accessibilitySummary =
    points.length === 0
      ? '没有有效球速数据。'
      : `共${points.length}次有效击球，最低${formatNumber(minimumKmh as number)} km/h，最高${formatNumber(maximumKmh as number)} km/h，${direction}。`;
  return { points, minimumKmh, maximumKmh, direction, accessibilitySummary };
}

export function createRallyLengthData(rallies: readonly RallyRecord[]): RallyLengthData {
  const sorted = stableSortByIndex(rallies, (rally) => rally.rallyIndex);
  const valid = sorted.filter(
    (rally) =>
      isNonNegativeInteger(rally.rallyIndex) &&
      isNonNegativeInteger(rally.shotCount) &&
      rally.shotCount === rally.shotIds.length,
  );
  const longestShots =
    valid.length > 0 ? Math.max(...valid.map(({ shotCount }) => shotCount)) : null;
  const items = valid.map((rally, index) => ({
    key: `${rally.id}-${index}`,
    rallyIndex: rally.rallyIndex,
    label: `第${rally.rallyIndex + 1}回合`,
    shotCount: rally.shotCount,
    heightRatio: longestShots && longestShots > 0 ? rally.shotCount / longestShots : 0,
  }));
  const invalidCount = rallies.length - valid.length;
  const accessibilitySummary =
    items.length === 0
      ? `暂无可展示的回合统计，${invalidCount}条记录待确认。`
      : `共${items.length}个有效回合，最长回合${longestShots}拍，${invalidCount}条记录待确认。`;
  return { items, invalidCount, longestShots, accessibilitySummary };
}

function landingOpacity(point: CourtPoint) {
  return typeof point.confidence === 'number' &&
    Number.isFinite(point.confidence) &&
    point.confidence >= 0 &&
    point.confidence <= 1
    ? 0.45 + point.confidence * 0.55
    : 0.8;
}

export function createLandingDistribution(
  heatmapPoints: readonly CourtPoint[],
): LandingDistributionData {
  const valid = heatmapPoints.filter(
    ({ x, y }) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1 && y >= 0 && y <= 1,
  );
  const points = valid.map((point, index) => ({
    key: `landing-${index}`,
    xRatio: point.x,
    yRatio: point.y,
    opacity: landingOpacity(point),
  }));
  const invalidCount = heatmapPoints.length - valid.length;
  return {
    points,
    invalidCount,
    accessibilitySummary: `共有${points.length}个有效相对落点，${invalidCount}个点位待确认。Demo相对位置示意，不代表精确球场坐标或米制落点。`,
  };
}

const abilityDefinitions: readonly {
  key: keyof PlayerProfile;
  label: string;
  explanation: string;
}[] = [
  { key: 'consistency', label: '稳定性', explanation: '展示本次四项中的相对稳定表现。' },
  { key: 'attack', label: '进攻', explanation: '展示本次四项中的相对进攻表现。' },
  { key: 'defense', label: '防守', explanation: '展示本次四项中的相对防守表现。' },
  { key: 'movement', label: '移动', explanation: '展示本次四项中的相对移动表现。' },
];

export function createPlayerAbilityData(
  profile: PlayerProfile | null | undefined,
): PlayerAbilityData | null {
  if (!profile) return null;
  const values = abilityDefinitions.map(({ key }) => profile[key]);
  const validValues = values.filter(isFiniteNonNegative);
  const maximum = validValues.length > 0 ? Math.max(...validValues) : 0;
  const items = abilityDefinitions.map(({ key, label, explanation }) => {
    const candidate = profile[key];
    const value = isFiniteNonNegative(candidate) ? candidate : null;
    const valueText = value === null ? '数据待确认' : formatNumber(value);
    return {
      key,
      label,
      value,
      valueText,
      relativeWidth: value !== null && maximum > 0 ? value / maximum : 0,
      explanation,
      accessibilityLabel: `${label}：${valueText}。${explanation}`,
    };
  });
  const validCount = items.filter(({ value }) => value !== null).length;
  return {
    items,
    accessibilitySummary: `能力画像包含${validCount}项有效Demo展示分，仅用于比较本次四项相对高低，不是百分制或专业评级。`,
  };
}

export function canDisplayAnalysisResult(options: ResultDisplayQualification) {
  return (
    options.identityValid &&
    !options.videoQueryFetching &&
    options.taskQuerySuccess &&
    !options.taskQueryFetching &&
    options.taskStatus === 'succeeded' &&
    options.resultQuerySuccess &&
    !options.resultQueryFetching &&
    options.result !== null &&
    options.result !== undefined
  );
}

export function canOpenFullAnalysisResult(options: ResultDisplayQualification) {
  return canDisplayAnalysisResult(options);
}
