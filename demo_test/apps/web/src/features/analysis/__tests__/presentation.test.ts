import { describe, expect, it } from 'vitest';

import { createWebDemoSeed } from '../../demo-data';
import {
  createSafeResultStatistic,
  createCvSummary,
  formatConfidence,
  formatLogTime,
  formatOptionalNumber,
  getResultCompleteness,
  sortAnalysisLogs,
  sortPoints,
  sortRallies,
  sortShots,
} from '../presentation';

describe('Web Analysis presentation', () => {
  const seed = createWebDemoSeed();
  const full = requireValue(
    seed.analysisResults.find(({ videoId }) => videoId === 'video-web-demo-01'),
  );
  const partial = requireValue(
    seed.analysisResults.find(({ videoId }) => videoId === 'video-web-demo-11'),
  );

  it('formats optional and invalid numbers safely', () => {
    expect(formatOptionalNumber(undefined)).toBe('未提供');
    expect(formatOptionalNumber(Number.NaN)).toBe('数据待确认');
    expect(formatConfidence(0.91)).toBe('91%');
  });

  it('rejects invalid required result statistics from runtime defensive fixtures', () => {
    for (const value of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -1,
      undefined,
      null,
    ]) {
      expect(createSafeResultStatistic(value, { suffix: '秒', precision: 1 })).toEqual({
        value: '数据待确认',
      });
    }
  });

  it('validates integer result statistics while preserving zero and normal integers', () => {
    expect(createSafeResultStatistic(3.5, { integer: true, suffix: '拍' })).toEqual({
      value: '数据待确认',
    });
    expect(createSafeResultStatistic(0, { integer: true })).toEqual({
      value: 0,
      suffix: undefined,
      precision: undefined,
    });
    expect(createSafeResultStatistic(3, { integer: true, suffix: '拍' })).toEqual({
      value: 3,
      suffix: '拍',
      precision: undefined,
    });
  });

  it('distinguishes missing optional statistics from present invalid values', () => {
    expect(createSafeResultStatistic(undefined, { optional: true })).toEqual({
      value: '未提供',
    });
    expect(createSafeResultStatistic(null, { optional: true })).toEqual({ value: '未提供' });
    expect(createSafeResultStatistic(Number.NaN, { optional: true, suffix: ' km/h' })).toEqual({
      value: '数据待确认',
    });
  });

  it('preserves valid result statistic precision and suffix', () => {
    expect(createSafeResultStatistic(4.25, { precision: 1, suffix: ' km/h' })).toEqual({
      value: 4.25,
      suffix: ' km/h',
      precision: 1,
    });
  });

  it('classifies full and legal partial results', () => {
    expect(getResultCompleteness(full)).toBe('完整数据');
    expect(getResultCompleteness(partial)).toBe('部分数据');
  });

  it('sorts copies of Shot, Rally and Point arrays', () => {
    expect(sortShots([...full.shots].reverse()).map(({ shotIndex }) => shotIndex)).toEqual([
      0, 1, 2,
    ]);
    expect(sortRallies([...full.rallies].reverse())[0].rallyIndex).toBe(0);
    expect(sortPoints([...(full.points ?? [])].reverse())[0].pointIndex).toBe(0);
    expect(full.shots[0].shotIndex).toBe(0);
  });

  it('sorts logs by time then ID and summarizes CV', () => {
    const sameTime = '2026-01-01T00:00:00.000Z';
    const logs = sortAnalysisLogs([
      {
        id: 'b',
        taskId: 't',
        timestamp: sameTime,
        level: 'info',
        audience: 'user',
        userMessage: 'b',
      },
      {
        id: 'a',
        taskId: 't',
        timestamp: sameTime,
        level: 'info',
        audience: 'user',
        userMessage: 'a',
      },
    ]);
    expect(logs.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(formatLogTime('invalid')).toBe('时间待确认');
    const cv = requireValue(
      seed.cvDemoOutputs.find(({ output }) => output.videoId === 'video-web-demo-01'),
    );
    expect(createCvSummary(cv)).toMatchObject({ courtKeypointCount: 4, playerTrackCount: 2 });
  });
});

function requireValue<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Expected deterministic fixture value.');
  return value;
}
