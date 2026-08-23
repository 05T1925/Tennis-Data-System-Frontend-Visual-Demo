import type { Video } from '@tennis/shared-types';
import { describe, expect, it } from 'vitest';

import {
  createVideoDetailFields,
  formatCourtType,
  formatMatchType,
  formatPlayMode,
  formatVideoFileSize,
  formatVideoNote,
  formatVideoTitle,
  normalizeVideoId,
} from '../videoDetailPresentation';

function video(overrides: Partial<Video> = {}): Video {
  return {
    id: 'video-1',
    userId: 'user-1',
    title: '训练视频',
    originalFileName: 'training.mp4',
    mimeType: 'video/mp4',
    fileSizeBytes: 1_048_576,
    durationSeconds: 90,
    matchType: 'training',
    playMode: 'singles',
    courtType: 'hard',
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    createdAt: '2026-07-15T00:00:00.000Z',
    updatedAt: '2026-07-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('video detail route normalization', () => {
  it('normalizes string and array route values', () => {
    expect(normalizeVideoId(' video-1 ')).toBe('video-1');
    expect(normalizeVideoId([' first ', 'second'])).toBe('first');
  });

  it.each([undefined, '', '   ', []])('rejects an empty route value', (value) => {
    expect(normalizeVideoId(value)).toBeNull();
  });
});

describe('video detail formatting', () => {
  it('uses a safe title fallback without truncating long text', () => {
    expect(formatVideoTitle('   ')).toBe('未命名训练');
    expect(formatVideoTitle('长'.repeat(120))).toHaveLength(120);
  });

  it('formats valid fields and safely falls back for invalid fields', () => {
    const valid = createVideoDetailFields(video());
    expect(valid.find(({ key }) => key === 'created-at')?.value).not.toBe('时间待确认');
    expect(valid.find(({ key }) => key === 'duration')?.value).toBe('1 分 30 秒');
    expect(createVideoDetailFields(video({ createdAt: 'invalid' }))[0].value).toBe('时间待确认');
    expect(createVideoDetailFields(video({ durationSeconds: 0 }))[1].value).toBe('0 秒');
    expect(createVideoDetailFields(video({ durationSeconds: undefined }))[1].value).toBe(
      '时长待确认',
    );
    expect(createVideoDetailFields(video({ durationSeconds: -1 }))[1].value).toBe('时长待确认');
  });

  it('formats file sizes and rejects invalid values', () => {
    expect(formatVideoFileSize(1_048_576)).toBe('1.0 MB');
    expect(formatVideoFileSize(-1)).toBe('文件大小待确认');
    expect(formatVideoFileSize(Number.NaN)).toBe('文件大小待确认');
  });

  it('maps match attributes and empty notes safely', () => {
    expect(formatMatchType('training')).toBe('训练');
    expect(formatMatchType('match')).toBe('比赛');
    expect(formatPlayMode('singles')).toBe('单打');
    expect(formatPlayMode('doubles')).toBe('双打');
    expect(formatCourtType('clay')).toBe('红土');
    expect(formatVideoNote('   ')).toBe('未填写备注');
  });

  it('does not truncate long notes', () => {
    expect(formatVideoNote('注'.repeat(500))).toHaveLength(500);
  });
});
