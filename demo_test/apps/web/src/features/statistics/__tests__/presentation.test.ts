import { describe, expect, it } from 'vitest';

import {
  durationBucketPresentation,
  formatAnalysisSuccessRate,
  formatAverageAnalysisDuration,
  formatOverviewDateTime,
  formatSafeProgress,
  formatVideoTooltip,
  getFailureTypeLabel,
  getOverviewAnalysisLabel,
  getOverviewStageLabel,
  getOverviewUploadLabel,
  overviewStatusPresentation,
} from '../presentation';

describe('Overview presentation', () => {
  it('formats seconds, minutes and missing duration safely', () => {
    expect(formatAverageAnalysisDuration(45)).toBe('45 秒');
    expect(formatAverageAnalysisDuration(420)).toBe('7 分钟');
    expect(formatAverageAnalysisDuration(425)).toBe('7 分 5 秒');
    expect(formatAverageAnalysisDuration(null)).toBe('—');
    expect(formatAverageAnalysisDuration(Number.NaN)).toBe('—');
  });

  it('formats rates without NaN, Infinity or zero-as-missing errors', () => {
    expect(formatAnalysisSuccessRate(0.6)).toBe('60%');
    expect(formatAnalysisSuccessRate(0)).toBe('0%');
    expect(formatAnalysisSuccessRate(null)).toBe('—');
    expect(formatAnalysisSuccessRate(Number.POSITIVE_INFINITY)).toBe('—');
  });

  it('formats labels, progress, dates and Tooltip units', () => {
    expect(getOverviewUploadLabel('uploaded')).toBe('上传完成');
    expect(getOverviewAnalysisLabel('failed')).toBe('分析失败');
    expect(getOverviewStageLabel('ball_tracking')).toBe('追踪网球');
    expect(getFailureTypeLabel('upload')).toBe('上传失败');
    expect(formatSafeProgress(0)).toBe('0%');
    expect(formatSafeProgress(Number.NaN)).toBe('数据待确认');
    expect(formatOverviewDateTime('invalid')).toBe('数据待确认');
    expect(formatVideoTooltip(3)).toBe('3 个视频');
  });

  it('defines all status and duration display labels', () => {
    expect(Object.keys(overviewStatusPresentation)).toHaveLength(10);
    expect(Object.keys(durationBucketPresentation)).toHaveLength(6);
  });
});
