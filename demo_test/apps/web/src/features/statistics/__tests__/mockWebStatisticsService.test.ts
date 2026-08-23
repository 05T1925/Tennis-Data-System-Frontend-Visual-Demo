import { describe, expect, it } from 'vitest';

import { DefaultWebDemoDataRepository, type WebDemoDataRepository } from '../../demo-data';
import { MemoryWebDemoDataStorage, MutableWebClock } from '../../demo-data/__tests__/testUtils';
import { WEB_DEMO_ADMIN_ID } from '../../videos/mockVideoService';
import { MockWebStatisticsService } from '../mockWebStatisticsService';

describe('MockWebStatisticsService', () => {
  it('uses the injected Clock, reads one Snapshot and returns defensive results', async () => {
    const storage = new MemoryWebDemoDataStorage();
    const repository = new DefaultWebDemoDataRepository(storage);
    const clock = new MutableWebClock();
    const service = new MockWebStatisticsService(repository, clock, 0);
    const first = await service.getOverview({ actorUserId: WEB_DEMO_ADMIN_ID });
    expect(first.generatedAt).toBe(clock.now().toISOString());
    first.recentUploads.splice(0);
    const second = await service.getOverview({ actorUserId: WEB_DEMO_ADMIN_ID });
    expect(second.recentUploads.length).toBeGreaterThan(0);
  });

  it('rejects invalid actors and supports Abort', async () => {
    const repository = new DefaultWebDemoDataRepository(new MemoryWebDemoDataStorage());
    const service = new MockWebStatisticsService(repository, new MutableWebClock(), 0);
    await expect(service.getOverview({ actorUserId: 'other' })).rejects.toMatchObject({
      code: 'WEB_VIDEO_ACCESS_DENIED',
    });
    const controller = new AbortController();
    controller.abort();
    await expect(
      service.getOverview({ actorUserId: WEB_DEMO_ADMIN_ID, signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('normalizes Repository failures and supports an empty Snapshot', async () => {
    const failing = {
      getSnapshot: () => Promise.reject(new Error('storage unavailable')),
    } as unknown as WebDemoDataRepository;
    const service = new MockWebStatisticsService(failing, new MutableWebClock(), 0);
    await expect(service.getOverview({ actorUserId: WEB_DEMO_ADMIN_ID })).rejects.toMatchObject({
      code: 'WEB_STATISTICS_LOAD_FAILED',
    });

    const empty = {
      getSnapshot: () =>
        Promise.resolve({
          version: 2 as const,
          videos: [],
          analysisTasks: [],
          analysisResults: [],
          cvDemoOutputs: [],
          analysisLogs: [],
          analysisRuntimes: {},
        }),
    } as unknown as WebDemoDataRepository;
    await expect(
      new MockWebStatisticsService(empty, new MutableWebClock(), 0).getOverview({
        actorUserId: WEB_DEMO_ADMIN_ID,
      }),
    ).resolves.toMatchObject({ metrics: { totalVideos: 0 }, runtimeActiveCount: 0 });
  });

  it('reports active Runtime count without mutating Repository data', async () => {
    const repository = new DefaultWebDemoDataRepository(
      new MemoryWebDemoDataStorage(),
      new MutableWebClock(),
    );
    await repository.retryAnalysis('video-web-demo-04');
    const before = await repository.getSnapshot();
    const result = await new MockWebStatisticsService(
      repository,
      new MutableWebClock(),
      0,
    ).getOverview({
      actorUserId: WEB_DEMO_ADMIN_ID,
    });
    expect(result.runtimeActiveCount).toBe(1);
    expect(await repository.getSnapshot()).toEqual(before);
  });
});
