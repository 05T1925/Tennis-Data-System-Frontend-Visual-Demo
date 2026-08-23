import { describe, expect, it } from 'vitest';

import { MockAnalysisService } from '@/features/analysis/services/MockAnalysisService';
import { DEMO_USER_ID } from '@/features/demo-data/types';
import { createTestContext } from '@/features/demo-data/__tests__/testUtils';

function service() {
  const context = createTestContext();
  return {
    ...context,
    analysis: new MockAnalysisService(context.repository, context.clock, context.idGenerator),
  };
}

describe('analysis retry service regression', () => {
  it('retries a failed task in place without creating a second task', async () => {
    const { analysis, repository } = service();
    const before = await repository.getSnapshot();
    const original = before.analysisTasks.find(({ videoId }) => videoId === 'video-demo-failed');
    const retried = await analysis.retryAnalysis({
      userId: DEMO_USER_ID,
      videoId: 'video-demo-failed',
    });
    const after = await repository.getSnapshot();

    expect(retried).toMatchObject({
      id: original?.id,
      status: 'queued',
      retryCount: (original?.retryCount ?? 0) + 1,
    });
    expect(retried.errorCode).toBeUndefined();
    expect(retried.errorMessage).toBeUndefined();
    expect(
      after.analysisTasks.filter(({ videoId }) => videoId === 'video-demo-failed'),
    ).toHaveLength(1);
  });

  it('rejects non-failed tasks and a video whose upload failed', async () => {
    const { analysis } = service();
    await expect(
      analysis.retryAnalysis({ userId: DEMO_USER_ID, videoId: 'video-demo-succeeded' }),
    ).rejects.toMatchObject({ code: 'ANALYSIS_RETRY_NOT_ALLOWED' });
    await expect(
      analysis.retryAnalysis({ userId: DEMO_USER_ID, videoId: 'video-demo-upload-failed' }),
    ).rejects.toMatchObject({ code: 'ANALYSIS_NOT_FOUND' });
  });
});
