import { describe, expect, it } from 'vitest';

import { createWebDemoSeed } from '../../demo-data';
import {
  formatDateTime,
  formatDuration,
  formatFileSize,
  formatVideoTitle,
  getAnalysisStageLabel,
  getAnalysisStatusPresentation,
  getSafeProgress,
} from '../presentation';
import { getWebAnalysisStatus } from '../videoStatus';

const seed = createWebDemoSeed();

describe('video presentation', () => {
  it('falls back from empty title to file name and then a safe label', () => {
    expect(formatVideoTitle('', 'sample.mp4')).toBe('sample.mp4');
    expect(formatVideoTitle(' ', ' ')).toBe('未命名视频');
  });

  it.each([
    [0, '0 B'],
    [1_024, '1.0 KB'],
    [1_024 ** 2, '1.0 MB'],
    [1_024 ** 3, '1.0 GB'],
  ])('formats file size %s', (value, expected) => {
    expect(formatFileSize(value)).toBe(expected);
  });

  it('rejects invalid file sizes', () => {
    expect(formatFileSize(-1)).toBe('数据待确认');
    expect(formatFileSize(Number.NaN)).toBe('数据待确认');
  });

  it.each([
    [0, '0 秒'],
    [65, '1 分 5 秒'],
    [120, '2 分钟'],
  ])('formats duration %s', (value, expected) => {
    expect(formatDuration(value)).toBe(expected);
  });

  it('rejects invalid duration and date values', () => {
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('数据待确认');
    expect(formatDateTime('invalid')).toBe('数据待确认');
  });

  it('distinguishes not-ready and not-created analysis states', () => {
    expect(getAnalysisStatusPresentation({ video: seed.videos[6], analysisTask: null }).label).toBe(
      '不可分析',
    );
    expect(getAnalysisStatusPresentation({ video: seed.videos[5], analysisTask: null }).label).toBe(
      '未创建任务',
    );
  });

  it.each([
    ['video-web-demo-07', 'not_ready'],
    ['video-web-demo-06', 'not_created'],
    ['video-web-demo-03', 'queued'],
    ['video-web-demo-02', 'processing'],
    ['video-web-demo-01', 'succeeded'],
    ['video-web-demo-04', 'failed'],
    ['video-web-demo-05', 'canceled'],
  ] as const)('derives the pure Web analysis status for %s', (videoId, expected) => {
    const video = seed.videos.find((candidate) => candidate.id === videoId);
    const analysisTask = seed.analysisTasks.find((task) => task.videoId === videoId) ?? null;
    expect(video).toBeDefined();
    expect(getWebAnalysisStatus({ video: video!, analysisTask })).toBe(expected);
  });

  it('handles missing, succeeded, excessive and invalid progress', () => {
    expect(getSafeProgress(undefined).label).toBe('—');
    expect(getSafeProgress(20, { succeeded: true })).toEqual({ value: 100, label: '100%' });
    expect(getSafeProgress(120)).toEqual({ value: 100, label: '100%' });
    expect(getSafeProgress(Number.NaN).label).toBe('数据待确认');
    expect(getSafeProgress(Number.POSITIVE_INFINITY).label).toBe('数据待确认');
    expect(getSafeProgress(-1).label).toBe('数据待确认');
  });

  it('falls back for an unknown analysis stage', () => {
    expect(getAnalysisStageLabel('unknown')).toBe('阶段待确认');
  });
});
