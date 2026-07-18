import { describe, expect, it } from 'vitest';

import { DefaultWebDemoDataRepository } from '../../demo-data';
import { MemoryWebDemoDataStorage } from '../../demo-data/__tests__/testUtils';
import { WEB_DEMO_ADMIN_ID } from '../../videos/mockVideoService';
import { MockWebAnalysisService } from '../mockWebAnalysisService';

function setup() {
  const repository = new DefaultWebDemoDataRepository(new MemoryWebDemoDataStorage());
  return { repository, service: new MockWebAnalysisService(repository, 0) };
}

const params = (videoId: string, actorUserId = WEB_DEMO_ADMIN_ID) => ({ actorUserId, videoId });

describe('MockWebAnalysisService', () => {
  it('enforces the Demo actor and video existence', async () => {
    const { service } = setup();
    await expect(
      service.getTaskStateByVideoId(params('video-web-demo-01', 'other')),
    ).rejects.toMatchObject({ code: 'WEB_VIDEO_ACCESS_DENIED' });
    await expect(service.getTaskStateByVideoId(params('missing'))).rejects.toMatchObject({
      code: 'WEB_VIDEO_NOT_FOUND',
    });
  });

  it('returns Task, Result, CV and Logs for a succeeded task', async () => {
    const { service } = setup();
    await expect(service.getTaskStateByVideoId(params('video-web-demo-01'))).resolves.toMatchObject(
      {
        task: { status: 'succeeded' },
        runtimeActive: false,
      },
    );
    await expect(service.getResultByVideoId(params('video-web-demo-01'))).resolves.toMatchObject({
      videoId: 'video-web-demo-01',
    });
    await expect(
      service.getCvDemoOutputByVideoId(params('video-web-demo-01')),
    ).resolves.toMatchObject({ demoSchema: 'web-cv-demo-v1' });
    expect(
      (await service.getTaskLogsByVideoId(params('video-web-demo-01'))).length,
    ).toBeGreaterThan(0);
  });

  it('distinguishes static active Seed tasks from retry Runtime tasks', async () => {
    const { service } = setup();
    await expect(service.getTaskStateByVideoId(params('video-web-demo-03'))).resolves.toMatchObject(
      {
        task: { status: 'queued' },
        runtimeActive: false,
      },
    );
    await expect(service.getTaskStateByVideoId(params('video-web-demo-02'))).resolves.toMatchObject(
      {
        task: { status: 'processing' },
        runtimeActive: false,
      },
    );
    await service.retryAnalysis(params('video-web-demo-04'));
    await expect(service.getTaskStateByVideoId(params('video-web-demo-04'))).resolves.toMatchObject(
      {
        task: { status: 'queued' },
        runtimeActive: true,
      },
    );
  });

  it.each(['video-web-demo-02', 'video-web-demo-03', 'video-web-demo-04', 'video-web-demo-05'])(
    'does not expose Result or CV for non-succeeded %s',
    async (videoId) => {
      const { service } = setup();
      await expect(service.getResultByVideoId(params(videoId))).resolves.toBeNull();
      await expect(service.getCvDemoOutputByVideoId(params(videoId))).resolves.toBeNull();
    },
  );

  it('only retries an uploaded failed Task', async () => {
    const { service } = setup();
    await expect(service.retryAnalysis(params('video-web-demo-04'))).resolves.toMatchObject({
      status: 'queued',
    });
    await expect(service.retryAnalysis(params('video-web-demo-09'))).rejects.toMatchObject({
      code: 'WEB_ANALYSIS_RETRY_NOT_ALLOWED',
    });
    await expect(service.retryAnalysis(params('video-web-demo-03'))).rejects.toMatchObject({
      code: 'WEB_ANALYSIS_RETRY_NOT_ALLOWED',
    });
  });

  it('supports legal partial data and Abort', async () => {
    const { service } = setup();
    await expect(service.getResultByVideoId(params('video-web-demo-11'))).resolves.toMatchObject({
      playerProfile: undefined,
      points: undefined,
    });
    const controller = new AbortController();
    controller.abort();
    await expect(
      service.getTaskStateByVideoId({ ...params('video-web-demo-01'), signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
