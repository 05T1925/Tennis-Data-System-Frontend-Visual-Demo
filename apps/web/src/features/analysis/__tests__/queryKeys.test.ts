import { describe, expect, it } from 'vitest';

import { createWebDemoSeed } from '../../demo-data';
import {
  getWebAnalysisEntityKeys,
  getWebTaskLogRevision,
  getWebTaskPollingInterval,
  shouldEnableWebCv,
  shouldEnableWebLogs,
  shouldEnableWebResult,
  shouldRefetchWebTaskLogs,
  webAnalysisQueryKeys,
} from '../queryKeys';

describe('Web Analysis Query policy', () => {
  it('creates actor/video scoped canonical keys', () => {
    expect(webAnalysisQueryKeys.task('admin', 'video')).toEqual([
      'web-analysis',
      'task',
      'admin',
      'video',
    ]);
    expect(getWebAnalysisEntityKeys('admin', 'video')).toHaveLength(4);
  });

  it('polls only active Runtime tasks and stops for terminal states or errors', () => {
    const seed = createWebDemoSeed();
    const queued = requireTask(seed, 'video-web-demo-03');
    const processing = requireTask(seed, 'video-web-demo-02');
    const succeeded = requireTask(seed, 'video-web-demo-01');
    expect(getWebTaskPollingInterval({ task: queued, runtimeActive: true }, false)).toBe(3_000);
    expect(getWebTaskPollingInterval({ task: processing, runtimeActive: true }, false)).toBe(2_000);
    expect(getWebTaskPollingInterval({ task: queued, runtimeActive: false }, false)).toBe(false);
    expect(getWebTaskPollingInterval({ task: processing, runtimeActive: false }, false)).toBe(
      false,
    );
    expect(getWebTaskPollingInterval({ task: succeeded, runtimeActive: true }, false)).toBe(false);
    expect(getWebTaskPollingInterval({ task: queued, runtimeActive: true }, true)).toBe(false);
  });

  it('refetches current Logs once for Task revision changes while Logs is active', () => {
    const task = requireTask(createWebDemoSeed(), 'video-web-demo-03');
    const previous = { identity: 'admin\u0000video', value: getWebTaskLogRevision(task) };
    const progressed = {
      ...task,
      stage: 'ball_tracking' as const,
      progress: 55,
      updatedAt: '2026-07-20T10:00:07.000Z',
    };
    const current = { identity: previous.identity, value: getWebTaskLogRevision(progressed) };
    expect(shouldRefetchWebTaskLogs(true, previous, current)).toBe(true);
    expect(shouldRefetchWebTaskLogs(true, current, current)).toBe(false);
    expect(shouldRefetchWebTaskLogs(false, previous, current)).toBe(false);
    expect(
      shouldRefetchWebTaskLogs(true, previous, { ...current, identity: 'admin\u0000other' }),
    ).toBe(false);

    for (const status of ['succeeded', 'failed', 'canceled'] as const) {
      const terminal = {
        identity: current.identity,
        value: getWebTaskLogRevision({ ...progressed, status }),
      };
      expect(shouldRefetchWebTaskLogs(true, current, terminal)).toBe(true);
      expect(shouldRefetchWebTaskLogs(true, terminal, terminal)).toBe(false);
    }
  });

  it('gates Result, CV and Logs by current task and Tab', () => {
    expect(shouldEnableWebResult('succeeded', 'result')).toBe(true);
    expect(shouldEnableWebResult('succeeded', 'shots')).toBe(true);
    expect(shouldEnableWebResult('failed', 'result')).toBe(false);
    expect(shouldEnableWebCv('succeeded', 'cv')).toBe(true);
    expect(shouldEnableWebCv('succeeded', 'basic')).toBe(false);
    expect(shouldEnableWebLogs(true, 'logs')).toBe(true);
    expect(shouldEnableWebLogs(false, 'logs')).toBe(false);
  });
});

function requireTask(seed: ReturnType<typeof createWebDemoSeed>, videoId: string) {
  const task = seed.analysisTasks.find((candidate) => candidate.videoId === videoId);
  if (!task) throw new Error(`Missing Task for ${videoId}.`);
  return task;
}
