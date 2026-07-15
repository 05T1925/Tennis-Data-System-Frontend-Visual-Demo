import type { AnalysisTask, Video } from '@tennis/shared-types';
import { describe, expect, it } from 'vitest';

import {
  createVideoListViewModels,
  filterVideoListItems,
  formatVideoCreatedAt,
  formatVideoDuration,
  formatVideoTitle,
  getUniqueValidVideoIds,
  getVideoStatusPresentation,
  pruneRetryErrorsByVideoItems,
  type TaskQuerySnapshot,
  type VideoFilter,
} from '../videoPresentation';

function video(overrides: Partial<Video> = {}): Video {
  return {
    id: 'video-1',
    userId: 'user-1',
    title: '训练视频',
    originalFileName: 'training.mp4',
    mimeType: 'video/mp4',
    fileSizeBytes: 1_000,
    durationSeconds: 90,
    matchType: 'training',
    playMode: 'singles',
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    createdAt: '2026-07-14T08:00:00.000Z',
    updatedAt: '2026-07-14T08:00:00.000Z',
    ...overrides,
  };
}

function task(overrides: Partial<AnalysisTask> = {}): AnalysisTask {
  return {
    id: 'task-1',
    videoId: 'video-1',
    status: 'queued',
    stage: 'queued',
    progress: 0,
    retryCount: 0,
    createdAt: '2026-07-14T08:00:00.000Z',
    updatedAt: '2026-07-14T08:00:00.000Z',
    ...overrides,
  };
}

const settledMissing: TaskQuerySnapshot = { task: null, pending: false, error: false };

describe('video status presentation', () => {
  it.each([
    ['idle', '等待上传', 'upload-stage'],
    ['uploading', '正在上传', 'upload-stage'],
    ['failed', '上传失败', 'exception'],
    ['canceled', '上传已取消', 'exception'],
  ] as const)('prioritizes upload status %s', (uploadStatus, label, filter) => {
    const result = getVideoStatusPresentation(video({ uploadStatus }), {
      task: task({ status: 'failed' }),
      pending: false,
      error: false,
    });
    expect(result).toMatchObject({ label, filter, retryAllowed: false });
  });

  it('maps a missing task to waiting analysis', () => {
    expect(getVideoStatusPresentation(video(), settledMissing)).toMatchObject({
      label: '等待分析',
      filter: 'waiting-analysis',
    });
  });

  it.each([
    ['queued', '等待分析', 'waiting-analysis', false],
    ['processing', '正在分析', 'analyzing', false],
    ['succeeded', '分析完成', 'completed', false],
    ['failed', '分析失败', 'exception', true],
    ['canceled', '分析已取消', 'exception', false],
  ] as const)('maps analysis status %s', (analysisStatus, label, filter, retryAllowed) => {
    expect(
      getVideoStatusPresentation(video(), {
        task: task({ status: analysisStatus }),
        pending: false,
        error: false,
      }),
    ).toMatchObject({ label, filter, retryAllowed });
  });

  it('maps task pending and task error independently', () => {
    expect(
      getVideoStatusPresentation(video(), { task: undefined, pending: true, error: false }).label,
    ).toBe('正在确认分析状态');
    expect(
      getVideoStatusPresentation(video(), { task: undefined, pending: false, error: true }).label,
    ).toBe('分析状态暂不可用');
  });

  it('falls back for unknown upload and analysis statuses', () => {
    expect(
      getVideoStatusPresentation(
        video({ uploadStatus: 'future' as unknown as Video['uploadStatus'] }),
        settledMissing,
      ).label,
    ).toBe('状态待确认');
    expect(
      getVideoStatusPresentation(video(), {
        task: task({ status: 'future' as unknown as AnalysisTask['status'] }),
        pending: false,
        error: false,
      }).label,
    ).toBe('状态待确认');
  });
});

describe('video list view models and filters', () => {
  const cases: readonly [Video, AnalysisTask | null, VideoFilter][] = [
    [video({ id: 'idle', uploadStatus: 'idle' }), null, 'upload-stage'],
    [video({ id: 'uploading', uploadStatus: 'uploading' }), null, 'upload-stage'],
    [video({ id: 'upload-failed', uploadStatus: 'failed' }), null, 'exception'],
    [video({ id: 'upload-canceled', uploadStatus: 'canceled' }), null, 'exception'],
    [video({ id: 'missing-task' }), null, 'waiting-analysis'],
    [video({ id: 'queued' }), task({ videoId: 'queued' }), 'waiting-analysis'],
    [
      video({ id: 'processing' }),
      task({ videoId: 'processing', status: 'processing' }),
      'analyzing',
    ],
    [video({ id: 'succeeded' }), task({ videoId: 'succeeded', status: 'succeeded' }), 'completed'],
    [video({ id: 'failed' }), task({ videoId: 'failed', status: 'failed' }), 'exception'],
    [video({ id: 'canceled' }), task({ videoId: 'canceled', status: 'canceled' }), 'exception'],
  ];

  const snapshots = new Map(
    cases.map(([item, analysisTask]) => [
      item.id,
      { task: analysisTask, pending: false, error: false },
    ]),
  );
  const items = createVideoListViewModels(
    cases.map(([item]) => item),
    snapshots,
  );

  it.each([
    ['all', 10],
    ['upload-stage', 2],
    ['waiting-analysis', 2],
    ['analyzing', 1],
    ['completed', 1],
    ['exception', 4],
  ] as const)('filters %s locally', (filter, count) => {
    expect(filterVideoListItems(items, filter)).toHaveLength(count);
  });

  it('allows retry only for an uploaded failed analysis with a valid ID', () => {
    expect(items.find(({ videoId }) => videoId === 'failed')?.canRetry).toBe(true);
    expect(items.find(({ videoId }) => videoId === 'upload-failed')?.canRetry).toBe(false);
    const missingId = createVideoListViewModels(
      [video({ id: '' })],
      new Map([['', { task: task({ status: 'failed' }), pending: false, error: false }]]),
    )[0];
    expect(missingId).toMatchObject({ canNavigate: false, canRetry: false });
  });

  it('deduplicates task IDs and creates stable fallback keys for malformed rows', () => {
    const malformed = [video({ id: 'same' }), video({ id: 'same' }), video({ id: '  ' })];
    expect(getUniqueValidVideoIds(malformed)).toEqual(['same']);
    const viewModels = createVideoListViewModels(malformed, new Map());
    expect(new Set(viewModels.map(({ key }) => key)).size).toBe(3);
    expect(viewModels[2].canNavigate).toBe(false);
  });

  it('keeps a task error local to its own view model', () => {
    const snapshotsWithError = new Map<string, TaskQuerySnapshot>([
      ['one', { task: undefined, pending: false, error: true }],
      [
        'two',
        { task: task({ videoId: 'two', status: 'succeeded' }), pending: false, error: false },
      ],
    ]);
    const result = createVideoListViewModels(
      [video({ id: 'one' }), video({ id: 'two' })],
      snapshotsWithError,
    );
    expect(result.map(({ status }) => status.label)).toEqual(['分析状态暂不可用', '分析完成']);
  });

  it('keeps task pending local to its own view model', () => {
    const result = createVideoListViewModels(
      [video({ id: 'pending' }), video({ id: 'ready' })],
      new Map([
        ['pending', { task: undefined, pending: true, error: false }],
        ['ready', { task: null, pending: false, error: false }],
      ]),
    );
    expect(result.map(({ status }) => status.label)).toEqual(['正在确认分析状态', '等待分析']);
  });
});

describe('safe video formatting', () => {
  it('falls back for empty titles but preserves long content for UI line limiting', () => {
    expect(formatVideoTitle('   ')).toBe('未命名训练');
    expect(formatVideoTitle('长'.repeat(120))).toHaveLength(120);
  });

  it('formats valid dates and safely rejects invalid dates', () => {
    expect(formatVideoCreatedAt('2026-07-14T08:00:00.000Z')).not.toBe('时间待确认');
    expect(formatVideoCreatedAt('not-a-date')).toBe('时间待确认');
  });

  it.each([
    [undefined, '时长待确认'],
    [0, '0 秒'],
    [-1, '时长待确认'],
    [Number.NaN, '时长待确认'],
    [Number.POSITIVE_INFINITY, '时长待确认'],
    [59, '59 秒'],
    [90, '1 分 30 秒'],
  ] as const)('formats duration %s safely', (duration, expected) => {
    expect(formatVideoDuration(duration)).toBe(expected);
  });
});

describe('retry error pruning', () => {
  function itemForStatus(videoId: string, status: AnalysisTask['status']) {
    return createVideoListViewModels(
      [video({ id: videoId })],
      new Map([[videoId, { task: task({ videoId, status }), pending: false, error: false }]]),
    )[0];
  }

  it('keeps errors for videos that are still failed and retryable', () => {
    const errors = new Map([['failed', '重试失败']]);
    expect(pruneRetryErrorsByVideoItems(errors, [itemForStatus('failed', 'failed')])).toBe(errors);
  });

  it.each(['queued', 'processing', 'succeeded'] as const)(
    'removes a stale error after the task becomes %s',
    (status) => {
      const errors = new Map([['video-1', '重试失败']]);
      expect(pruneRetryErrorsByVideoItems(errors, [itemForStatus('video-1', status)])).toEqual(
        new Map(),
      );
    },
  );

  it('removes errors after a video leaves the list', () => {
    expect(pruneRetryErrorsByVideoItems(new Map([['removed', '重试失败']]), [])).toEqual(new Map());
  });

  it('preserves other retryable video errors while pruning stale entries', () => {
    const result = pruneRetryErrorsByVideoItems(
      new Map([
        ['failed', '保留错误'],
        ['queued', '过期错误'],
        ['removed', '已删除视频错误'],
      ]),
      [itemForStatus('failed', 'failed'), itemForStatus('queued', 'queued')],
    );
    expect(result).toEqual(new Map([['failed', '保留错误']]));
  });
});
