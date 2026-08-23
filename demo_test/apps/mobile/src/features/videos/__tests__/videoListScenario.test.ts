import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseVideoListMockScenario } from '@/config/env';
import { DEMO_USER_ID } from '@/features/demo-data/types';
import { createTestContext } from '@/features/demo-data/__tests__/testUtils';

import { MockVideoService } from '../services/MockVideoService';
import { VIDEO_LIST_MOCK_DELAY_MS } from '../services/videoListMockScenario';

function service(scenario: 'success' | 'empty' | 'error') {
  const context = createTestContext();
  return {
    ...context,
    videos: new MockVideoService(
      'success',
      context.repository,
      context.clock,
      context.idGenerator,
      'success',
      scenario,
    ),
  };
}

async function advance<T>(promise: Promise<T>, milliseconds = VIDEO_LIST_MOCK_DELAY_MS) {
  void promise.catch(() => undefined);
  await vi.advanceTimersByTimeAsync(milliseconds);
  return promise;
}

describe('video list Mock scenarios', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns Repository data in success', async () => {
    const { videos } = service('success');
    await expect(advance(videos.listVideos({ userId: DEMO_USER_ID }))).resolves.toHaveLength(4);
  });

  it('returns empty without changing the Repository', async () => {
    const { videos, repository } = service('empty');
    const before = await repository.getSnapshot();
    await expect(advance(videos.listVideos({ userId: DEMO_USER_ID }))).resolves.toEqual([]);
    expect(await repository.getSnapshot()).toEqual(before);
  });

  it('fails the first valid error request and succeeds on real refetch', async () => {
    const { videos } = service('error');
    await expect(advance(videos.listVideos({ userId: DEMO_USER_ID }))).rejects.toMatchObject({
      code: 'MOCK_VIDEO_LIST_QUERY_FAILED',
    });
    await expect(advance(videos.listVideos({ userId: DEMO_USER_ID }))).resolves.toHaveLength(4);
  });

  it('does not consume error after Abort or an unknown user', async () => {
    const { videos } = service('error');
    expect(await videos.listVideos({ userId: 'unknown-user' })).toEqual([]);
    const controller = new AbortController();
    const aborted = videos.listVideos({ userId: DEMO_USER_ID, signal: controller.signal });
    controller.abort();
    await expect(aborted).rejects.toThrow('aborted');
    await expect(advance(videos.listVideos({ userId: DEMO_USER_ID }))).rejects.toMatchObject({
      code: 'MOCK_VIDEO_LIST_QUERY_FAILED',
    });
  });

  it('falls back unknown configuration to success', () => {
    expect(parseVideoListMockScenario('unknown')).toBe('success');
    expect(parseVideoListMockScenario(undefined)).toBe('success');
  });

  it('does not affect recent videos, details, creation, or upload start', async () => {
    const { videos } = service('empty');
    await expect(
      advance(videos.getRecentVideos({ userId: DEMO_USER_ID }), 700),
    ).resolves.toHaveLength(3);
    await expect(
      videos.getVideoById({ userId: DEMO_USER_ID, videoId: 'video-demo-succeeded' }),
    ).resolves.toMatchObject({ id: 'video-demo-succeeded' });
    const created = await videos.createVideo({
      userId: DEMO_USER_ID,
      input: {
        title: '新训练',
        originalFileName: 'new.mp4',
        mimeType: 'video/mp4',
        fileSizeBytes: 1_000,
        matchType: 'training',
        playMode: 'singles',
      },
    });
    await expect(
      videos.startUpload({ userId: DEMO_USER_ID, videoId: created.id }),
    ).resolves.toMatchObject({ uploadStatus: 'uploading' });
  });
});
