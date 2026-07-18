import { describe, expect, it } from 'vitest';

import { DefaultWebDemoDataRepository, type WebDemoDataRepository } from '../../demo-data';
import { MemoryWebDemoDataStorage, MutableWebClock } from '../../demo-data/__tests__/testUtils';
import { WEB_DEMO_ADMIN_ID } from '../../videos/mockVideoService';
import { MockWebDemoControlService } from '../mockWebDemoControlService';

function setup() {
  const repository = new DefaultWebDemoDataRepository(
    new MemoryWebDemoDataStorage(),
    new MutableWebClock(),
  );
  return { repository, service: new MockWebDemoControlService(repository) };
}

describe('MockWebDemoControlService', () => {
  it('validates the Demo actor and Abort', async () => {
    const { service } = setup();
    await expect(service.resetDemoData({ actorUserId: 'other' })).rejects.toMatchObject({
      code: 'WEB_VIDEO_ACCESS_DENIED',
    });
    const controller = new AbortController();
    controller.abort();
    await expect(
      service.resetDemoData({ actorUserId: WEB_DEMO_ADMIN_ID, signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('resets and returns complete bundles for all three scenarios', async () => {
    const { service } = setup();
    await expect(service.resetDemoData({ actorUserId: WEB_DEMO_ADMIN_ID })).resolves.toMatchObject({
      version: 2,
      videos: expect.any(Array),
    });
    for (const kind of ['success', 'processing', 'failed'] as const) {
      const bundle = await service.createScenario({ actorUserId: WEB_DEMO_ADMIN_ID, kind });
      expect(bundle.videoRecord.analysisTask).toEqual(bundle.taskState.task);
      expect(bundle.logs.length).toBeGreaterThan(0);
      expect(bundle.result === null).toBe(kind !== 'success');
      expect(bundle.cv === null).toBe(kind !== 'success');
    }
  });

  it('force completes and returns Result, CV and Logs', async () => {
    const { service } = setup();
    const bundle = await service.forceComplete({
      actorUserId: WEB_DEMO_ADMIN_ID,
      videoId: 'video-web-demo-03',
    });
    expect(bundle).toMatchObject({
      taskState: { task: { status: 'succeeded' }, runtimeActive: false },
      result: { videoId: 'video-web-demo-03' },
      cv: { output: { videoId: 'video-web-demo-03' } },
    });
    expect(bundle.logs.length).toBeGreaterThan(1);
  });

  it('normalizes unknown Repository errors without exposing details', async () => {
    const repository = {
      resetDemoData: () => Promise.reject(new Error('private storage path')),
      createDemoScenario: () => Promise.reject(new Error('private fixture error')),
      forceCompleteAnalysis: () => Promise.reject(new Error('private task error')),
    } as unknown as WebDemoDataRepository;
    const service = new MockWebDemoControlService(repository);
    await expect(service.resetDemoData({ actorUserId: WEB_DEMO_ADMIN_ID })).rejects.toMatchObject({
      code: 'WEB_DEMO_RESET_FAILED',
      userMessage: 'Web Demo 数据暂时无法重置，请重试。',
    });
    await expect(
      service.createScenario({ actorUserId: WEB_DEMO_ADMIN_ID, kind: 'success' }),
    ).rejects.toMatchObject({ code: 'WEB_DEMO_SCENARIO_CREATE_FAILED' });
    await expect(
      service.forceComplete({ actorUserId: WEB_DEMO_ADMIN_ID, videoId: 'video' }),
    ).rejects.toMatchObject({ code: 'WEB_DEMO_CONTROL_FAILED' });
  });
});
