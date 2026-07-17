import { describe, expect, it } from 'vitest';

import { DefaultWebDemoDataRepository } from '../../demo-data';
import { MemoryWebDemoDataStorage } from '../../demo-data/__tests__/testUtils';
import { MockWebVideoService, WEB_DEMO_ADMIN_ID } from '../mockVideoService';
import type { ListWebVideosParams } from '../types';
import { getWebAnalysisStatus } from '../videoStatus';

function setup(scenario: 'success' | 'empty' | 'error-once' = 'success') {
  const storage = new MemoryWebDemoDataStorage();
  const repository = new DefaultWebDemoDataRepository(storage);
  return { storage, repository, service: new MockWebVideoService(repository, scenario, 0) };
}

function params(overrides: Partial<ListWebVideosParams> = {}): ListWebVideosParams {
  return {
    actorUserId: WEB_DEMO_ADMIN_ID,
    keyword: '',
    uploadStatus: 'all',
    analysisStatus: 'all',
    from: null,
    to: null,
    page: 1,
    pageSize: 10,
    ...overrides,
  };
}

describe('MockWebVideoService', () => {
  it('requires the Demo administrator but lists videos from multiple users', async () => {
    const { service } = setup();
    await expect(service.listVideos(params({ actorUserId: 'demo-user-1' }))).rejects.toMatchObject({
      code: 'WEB_VIDEO_ACCESS_DENIED',
    });
    const result = await service.listVideos(params({ pageSize: 50 }));
    expect(new Set(result.items.map((record) => record.video.userId)).size).toBe(4);
  });

  it.each([
    ['video ID', 'VIDEO-WEB-DEMO-01', 'video-web-demo-01'],
    ['user ID', ' DEMO-USER-2 ', 'demo-user-2'],
    ['title', '底线稳定性', 'video-web-demo-01'],
    ['original filename', 'SESSION-03.MP4', 'video-web-demo-03'],
  ])('searches by %s with trim and case folding', async (_, keyword, expected) => {
    const result = await setup().service.listVideos(params({ keyword, pageSize: 50 }));
    expect(
      result.items.some(
        (record) => record.video.id === expected || record.video.userId === expected,
      ),
    ).toBe(true);
  });

  it.each(['idle', 'uploading', 'uploaded', 'failed', 'canceled'] as const)(
    'filters upload status %s',
    async (uploadStatus) => {
      const result = await setup().service.listVideos(params({ uploadStatus, pageSize: 50 }));
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every((record) => record.video.uploadStatus === uploadStatus)).toBe(true);
    },
  );

  it.each([
    'not_ready',
    'not_created',
    'queued',
    'processing',
    'succeeded',
    'failed',
    'canceled',
  ] as const)('filters analysis status %s', async (analysisStatus) => {
    const result = await setup().service.listVideos(params({ analysisStatus, pageSize: 50 }));
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((record) => getWebAnalysisStatus(record) === analysisStatus)).toBe(
      true,
    );
  });

  it('applies inclusive local date boundaries and combined filters', async () => {
    const result = await setup().service.listVideos(
      params({ from: '2026-06-01', to: '2026-06-01', uploadStatus: 'uploaded', pageSize: 50 }),
    );
    expect(result.items.map((record) => record.video.id)).toEqual(['video-web-demo-01']);
  });

  it('sorts newest first without mutating repository order', async () => {
    const { service, repository } = setup();
    const before = (await repository.getSnapshot()).videos.map((video) => video.id);
    const result = await service.listVideos(params({ pageSize: 50 }));
    expect(result.items[0].video.id).toBe('video-web-demo-24');
    expect((await repository.getSnapshot()).videos.map((video) => video.id)).toEqual(before);
  });

  it('paginates, reports filtered total, and clamps excessive pages', async () => {
    const first = await setup().service.listVideos(params({ page: 2, pageSize: 10 }));
    expect(first.items).toHaveLength(10);
    expect(first.total).toBe(24);
    expect(first.page).toBe(2);
    const clamped = await setup().service.listVideos(params({ page: 99, pageSize: 10 }));
    expect(clamped.page).toBe(3);
    expect(clamped.items).toHaveLength(4);
  });

  it('supports empty and deterministic error-once list scenarios', async () => {
    const empty = await setup('empty').service.listVideos(params());
    expect(empty).toMatchObject({ items: [], total: 0, unfilteredTotal: 0, page: 1 });
    const service = setup('error-once').service;
    await expect(service.listVideos(params())).rejects.toMatchObject({
      code: 'WEB_VIDEO_LIST_FAILED',
    });
    await expect(service.listVideos(params())).resolves.toMatchObject({ total: 24 });
  });

  it('does not consume error-once for an aborted or invalid request', async () => {
    const service = setup('error-once').service;
    const controller = new AbortController();
    controller.abort();
    await expect(service.listVideos(params({ signal: controller.signal }))).rejects.toMatchObject({
      name: 'AbortError',
    });
    await expect(service.listVideos(params({ actorUserId: 'invalid' }))).rejects.toMatchObject({
      code: 'WEB_VIDEO_ACCESS_DENIED',
    });
    await expect(service.listVideos(params())).rejects.toMatchObject({
      code: 'WEB_VIDEO_LIST_FAILED',
    });
  });

  it('loads detail and returns safe not-found errors', async () => {
    const service = setup().service;
    await expect(
      service.getVideoById({ actorUserId: WEB_DEMO_ADMIN_ID, videoId: ' video-web-demo-01 ' }),
    ).resolves.toMatchObject({ video: { id: 'video-web-demo-01' } });
    await expect(
      service.getVideoById({ actorUserId: WEB_DEMO_ADMIN_ID, videoId: 'missing' }),
    ).rejects.toMatchObject({ code: 'WEB_VIDEO_NOT_FOUND' });
  });

  it('deletes one video and cascades its task', async () => {
    const { service, repository } = setup();
    await service.deleteVideo({ actorUserId: WEB_DEMO_ADMIN_ID, videoId: 'video-web-demo-01' });
    const snapshot = await repository.getSnapshot();
    expect(snapshot.videos.some((video) => video.id === 'video-web-demo-01')).toBe(false);
    expect(snapshot.analysisTasks.some((task) => task.videoId === 'video-web-demo-01')).toBe(false);
  });

  it('keeps data when delete persistence fails', async () => {
    const { service, repository, storage } = setup();
    await repository.getSnapshot();
    storage.failWrites = true;
    await expect(
      service.deleteVideo({ actorUserId: WEB_DEMO_ADMIN_ID, videoId: 'video-web-demo-01' }),
    ).rejects.toMatchObject({ code: 'WEB_DEMO_DATA_SAVE_FAILED' });
    storage.failWrites = false;
    expect(await repository.getVideoRecordById('video-web-demo-01')).not.toBeNull();
  });
});
