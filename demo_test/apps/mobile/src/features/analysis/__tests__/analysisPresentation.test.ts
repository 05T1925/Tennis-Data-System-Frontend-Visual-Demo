import type { AnalysisResult, AnalysisTask } from '@tennis/shared-types';
import { describe, expect, it } from 'vitest';

import {
  canRetryAnalysis,
  createAnalysisSummaryItems,
  getAnalysisStageLabel,
  getSafeAnalysisProgress,
  shouldEnableAnalysisResult,
} from '../analysisPresentation';

function task(overrides: Partial<AnalysisTask> = {}): AnalysisTask {
  return {
    id: 'task-1',
    videoId: 'video-1',
    status: 'processing',
    stage: 'ball_tracking',
    progress: 45,
    retryCount: 0,
    createdAt: '2026-07-15T00:00:00.000Z',
    updatedAt: '2026-07-15T00:00:00.000Z',
    ...overrides,
  };
}

function result(overrides: Partial<AnalysisResult['summary']> = {}): AnalysisResult {
  return {
    id: 'result-1',
    videoId: 'video-1',
    version: 'demo-v1',
    summary: {
      durationSeconds: 90,
      totalShots: 12,
      totalRallies: 3,
      totalPoints: 3,
      averageShotsPerRally: 4,
      longestRallyShots: 6,
      maxBallSpeedKmh: 108.5,
      ...overrides,
    },
    shots: [],
    rallies: [],
    points: [],
    heatmapPoints: [],
    createdAt: '2026-07-15T00:00:00.000Z',
  };
}

describe('analysis stage and progress presentation', () => {
  it.each([
    ['queued', '等待分析'],
    ['court_detection', '识别球场'],
    ['player_detection', '识别球员'],
    ['ball_tracking', '追踪网球'],
    ['trajectory_processing', '处理运动轨迹'],
    ['event_extraction', '提取击球事件'],
    ['statistics_generation', '生成统计结果'],
    ['completed', '分析完成'],
  ] as const)('maps stage %s', (stage, label) => {
    expect(getAnalysisStageLabel(stage)).toBe(label);
  });

  it('falls back for an unknown stage', () => {
    expect(getAnalysisStageLabel('future-stage')).toBe('当前阶段待确认');
  });

  it.each([
    [-1, 0],
    [101, 100],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
  ])('clamps progress %s safely', (progress, expected) => {
    expect(getSafeAnalysisProgress(task({ progress }))).toBe(expected);
  });

  it('forces succeeded to 100 and preserves failed progress', () => {
    expect(getSafeAnalysisProgress(task({ status: 'succeeded', progress: 41 }))).toBe(100);
    expect(getSafeAnalysisProgress(task({ status: 'failed', progress: 45 }))).toBe(45);
    expect(getSafeAnalysisProgress(null)).toBeNull();
  });
});

describe('analysis eligibility', () => {
  it('allows retry only for a valid uploaded failed task', () => {
    expect(
      canRetryAnalysis({
        userId: 'user-1',
        videoId: 'video-1',
        uploadStatus: 'uploaded',
        taskStatus: 'failed',
      }),
    ).toBe(true);
    expect(
      canRetryAnalysis({
        userId: '',
        videoId: 'video-1',
        uploadStatus: 'uploaded',
        taskStatus: 'failed',
      }),
    ).toBe(false);
    expect(
      canRetryAnalysis({
        userId: 'user-1',
        videoId: 'video-1',
        uploadStatus: 'failed',
        taskStatus: 'failed',
      }),
    ).toBe(false);
    expect(
      canRetryAnalysis({
        userId: 'user-1',
        videoId: 'video-1',
        uploadStatus: 'uploaded',
        taskStatus: 'processing',
      }),
    ).toBe(false);
  });

  it('enables Result only for a valid uploaded succeeded task', () => {
    const base = { userId: 'user-1', videoId: 'video-1', uploadStatus: 'uploaded' };
    expect(shouldEnableAnalysisResult({ ...base, taskStatus: 'succeeded' })).toBe(true);
    expect(shouldEnableAnalysisResult({ ...base, taskStatus: 'processing' })).toBe(false);
    expect(shouldEnableAnalysisResult({ ...base, taskStatus: 'failed' })).toBe(false);
  });
});

describe('analysis result summary', () => {
  it('formats at most six real summary fields', () => {
    expect(createAnalysisSummaryItems(result())).toEqual([
      { key: 'duration', label: '分析时长', value: '1 分 30 秒' },
      { key: 'shots', label: '击球总数', value: '12 次' },
      { key: 'rallies', label: '回合总数', value: '3 个' },
      { key: 'points', label: '得分点总数', value: '3 个' },
      { key: 'average-shots', label: '平均每回合击球', value: '4 次' },
      { key: 'max-speed', label: '最高球速', value: '108.5 km/h' },
    ]);
  });

  it('omits missing optional fields', () => {
    const value = result();
    value.summary.totalPoints = undefined;
    value.summary.maxBallSpeedKmh = undefined;
    expect(createAnalysisSummaryItems(value).map(({ key }) => key)).toEqual([
      'duration',
      'shots',
      'rallies',
      'average-shots',
    ]);
  });

  it('degrades required invalid metrics and omits invalid optional metrics', () => {
    const items = createAnalysisSummaryItems(
      result({ totalShots: Number.NaN, totalPoints: -1, maxBallSpeedKmh: Infinity }),
    );
    expect(items.find(({ key }) => key === 'shots')?.value).toBe('数据待确认');
    expect(items.some(({ key }) => key === 'points' || key === 'max-speed')).toBe(false);
  });

  it('returns no summary for a null result', () => {
    expect(createAnalysisSummaryItems(null)).toEqual([]);
  });
});
