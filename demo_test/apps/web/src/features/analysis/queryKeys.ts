import type { AnalysisStatus, AnalysisTask } from '@tennis/shared-types';

import type { WebAnalysisTaskState } from '../demo-data';

import type { WebDetailTab } from './types';

export const webAnalysisQueryKeys = {
  all: ['web-analysis'] as const,
  tasks: () => [...webAnalysisQueryKeys.all, 'task'] as const,
  task: (actorUserId: string, videoId: string) =>
    [...webAnalysisQueryKeys.tasks(), actorUserId, videoId] as const,
  results: () => [...webAnalysisQueryKeys.all, 'result'] as const,
  result: (actorUserId: string, videoId: string) =>
    [...webAnalysisQueryKeys.results(), actorUserId, videoId] as const,
  cvOutputs: () => [...webAnalysisQueryKeys.all, 'cv'] as const,
  cv: (actorUserId: string, videoId: string) =>
    [...webAnalysisQueryKeys.cvOutputs(), actorUserId, videoId] as const,
  logs: () => [...webAnalysisQueryKeys.all, 'logs'] as const,
  logsByVideo: (actorUserId: string, videoId: string) =>
    [...webAnalysisQueryKeys.logs(), actorUserId, videoId] as const,
};

export const webAnalysisMutationKeys = {
  retry: (actorUserId: string) => [...webAnalysisQueryKeys.all, 'retry', actorUserId] as const,
};

export function getWebTaskPollingInterval(
  state: WebAnalysisTaskState | undefined,
  hasError: boolean,
) {
  const pollingActive = state?.pollingActive ?? state?.runtimeActive;
  const taskStatus = state?.task?.status;
  if (hasError || !pollingActive) return false;
  if (taskStatus === 'queued') return 3_000;
  if (taskStatus === 'processing') return 2_000;
  return false;
}

export type WebTaskLogRevision = {
  identity: string;
  value: string | null;
};

export function getWebTaskLogRevision(task: AnalysisTask | null | undefined): string | null {
  if (!task) return null;
  return [task.id, task.status, task.stage, task.progress, task.updatedAt, task.retryCount].join(
    '|',
  );
}

export function shouldRefetchWebTaskLogs(
  enabled: boolean,
  previous: WebTaskLogRevision | null,
  current: WebTaskLogRevision,
): boolean {
  return (
    enabled &&
    previous !== null &&
    previous.identity === current.identity &&
    previous.value !== null &&
    current.value !== null &&
    previous.value !== current.value
  );
}

export function shouldEnableWebResult(
  status: AnalysisStatus | undefined,
  tab: WebDetailTab,
): boolean {
  return status === 'succeeded' && (tab === 'result' || tab === 'shots');
}

export function shouldEnableWebCv(status: AnalysisStatus | undefined, tab: WebDetailTab): boolean {
  return status === 'succeeded' && tab === 'cv';
}

export function shouldEnableWebLogs(hasTask: boolean, tab: WebDetailTab): boolean {
  return hasTask && tab === 'logs';
}

export function getWebAnalysisEntityKeys(actorUserId: string, videoId: string) {
  return [
    webAnalysisQueryKeys.task(actorUserId, videoId),
    webAnalysisQueryKeys.result(actorUserId, videoId),
    webAnalysisQueryKeys.cv(actorUserId, videoId),
    webAnalysisQueryKeys.logsByVideo(actorUserId, videoId),
  ] as const;
}
