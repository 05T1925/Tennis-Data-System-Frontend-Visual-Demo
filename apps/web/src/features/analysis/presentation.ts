import type { AnalysisResult, PointRecord, RallyRecord, ShotRecord } from '@tennis/shared-types';

import type { WebAnalysisTaskLogEntry, WebCvDemoOutput } from '../demo-data';

export type SafeResultStatistic = {
  value: number | string;
  suffix?: string;
  precision?: number;
};

export function createSafeResultStatistic(
  value: number | null | undefined,
  options: {
    optional?: boolean;
    integer?: boolean;
    minimum?: number;
    suffix?: string;
    precision?: number;
  } = {},
): SafeResultStatistic {
  if (value === null || value === undefined) {
    return { value: options.optional ? '未提供' : '数据待确认' };
  }
  const minimum = options.minimum ?? 0;
  if (!Number.isFinite(value) || value < minimum || (options.integer && !Number.isInteger(value))) {
    return { value: '数据待确认' };
  }
  return { value, suffix: options.suffix, precision: options.precision };
}

export function formatOptionalNumber(
  value: number | undefined,
  options: { suffix?: string; digits?: number } = {},
): string {
  if (value === undefined) return '未提供';
  if (!Number.isFinite(value)) return '数据待确认';
  return `${value.toFixed(options.digits ?? 0)}${options.suffix ?? ''}`;
}

export function formatMilliseconds(value: number): string {
  return Number.isFinite(value) && value >= 0 ? `${(value / 1_000).toFixed(2)} 秒` : '数据待确认';
}

export function formatConfidence(value: number | undefined): string {
  return formatOptionalNumber(value === undefined ? undefined : value * 100, {
    suffix: '%',
    digits: 0,
  });
}

export function formatCoordinate(value: number | undefined): string {
  return formatOptionalNumber(value, { digits: 3 });
}

export function formatLogTime(value: string): string {
  return Number.isFinite(Date.parse(value)) ? value : '时间待确认';
}

export function sortShots(shots: readonly ShotRecord[]): ShotRecord[] {
  return [...shots].sort(
    (left, right) => left.shotIndex - right.shotIndex || left.id.localeCompare(right.id),
  );
}

export function sortRallies(rallies: readonly RallyRecord[]): RallyRecord[] {
  return [...rallies].sort(
    (left, right) => left.rallyIndex - right.rallyIndex || left.id.localeCompare(right.id),
  );
}

export function sortPoints(points: readonly PointRecord[]): PointRecord[] {
  return [...points].sort(
    (left, right) => left.pointIndex - right.pointIndex || left.id.localeCompare(right.id),
  );
}

export function sortAnalysisLogs(
  logs: readonly WebAnalysisTaskLogEntry[],
): WebAnalysisTaskLogEntry[] {
  return [...logs].sort((left, right) => {
    const leftTime = Date.parse(left.timestamp);
    const rightTime = Date.parse(right.timestamp);
    const leftValid = Number.isFinite(leftTime);
    const rightValid = Number.isFinite(rightTime);
    if (leftValid && rightValid) return leftTime - rightTime || left.id.localeCompare(right.id);
    if (leftValid) return -1;
    if (rightValid) return 1;
    return left.id.localeCompare(right.id);
  });
}

export function getResultCompleteness(result: AnalysisResult): '完整数据' | '部分数据' {
  return result.points === undefined || result.playerProfile === undefined
    ? '部分数据'
    : '完整数据';
}

export function createCvSummary(cv: WebCvDemoOutput) {
  const payload = cv.output.payload;
  return {
    frameCount: payload.frameCount,
    courtKeypointCount: payload.courtKeypoints?.length,
    playerTrackCount: payload.playerTracks?.length,
    playerSampleCount: payload.playerTracks?.reduce((sum, track) => sum + track.samples.length, 0),
    ballTrackCount: payload.ballTrack?.length,
    confidenceFrameCount: payload.frameConfidences?.length,
  };
}
