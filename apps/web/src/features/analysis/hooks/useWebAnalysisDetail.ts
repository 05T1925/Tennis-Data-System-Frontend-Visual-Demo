import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnalysisTask } from '@tennis/shared-types';
import { useEffect, useRef, useState } from 'react';

import { getSafeAppErrorMessage } from '../../videos';
import { webVideoQueryKeys } from '../../videos/queryKeys';
import {
  getWebTaskPollingInterval,
  getWebTaskLogRevision,
  shouldEnableWebCv,
  shouldEnableWebLogs,
  shouldEnableWebResult,
  shouldRefetchWebTaskLogs,
  type WebTaskLogRevision,
  webAnalysisMutationKeys,
  webAnalysisQueryKeys,
} from '../queryKeys';
import { webAnalysisService } from '../service';
import type { WebDetailTab } from '../types';

type RetryOwner = { identity: string; controller: AbortController };

export function useWebAnalysisDetail(options: {
  actorUserId: string;
  videoId: string;
  uploadStatus: string;
  activeTab: WebDetailTab;
}) {
  const { actorUserId, videoId, uploadStatus, activeTab } = options;
  const queryClient = useQueryClient();
  const identity = `${actorUserId}\u0000${videoId}`;
  const identityValid = actorUserId.trim().length > 0 && videoId.trim().length > 0;
  const taskEnabled = identityValid && uploadStatus === 'uploaded';
  const ownerRef = useRef<RetryOwner | null>(null);
  const logsRevisionRef = useRef<WebTaskLogRevision | null>(null);
  const [retryState, setRetryState] = useState<{
    identity: string;
    pending: boolean;
    error: string | null;
  }>({ identity, pending: false, error: null });

  useEffect(() => {
    const previous = ownerRef.current;
    if (previous && previous.identity !== identity) {
      previous.controller.abort();
      ownerRef.current = null;
    }
    return () => {
      ownerRef.current?.controller.abort();
      ownerRef.current = null;
    };
  }, [identity]);

  const taskStateQuery = useQuery({
    queryKey: webAnalysisQueryKeys.task(actorUserId, videoId),
    enabled: taskEnabled,
    queryFn: ({ signal }) =>
      webAnalysisService.getTaskStateByVideoId({ actorUserId, videoId, signal }),
    placeholderData: undefined,
    retry: false,
    refetchInterval: (query) =>
      getWebTaskPollingInterval(query.state.data, query.state.error !== null),
    refetchIntervalInBackground: false,
  });
  const task = taskStateQuery.data?.task;
  const taskQuery = { ...taskStateQuery, data: task };
  const resultEnabled = taskEnabled && shouldEnableWebResult(task?.status, activeTab);
  const cvEnabled = taskEnabled && shouldEnableWebCv(task?.status, activeTab);
  const logsEnabled =
    taskEnabled && shouldEnableWebLogs(task !== null && task !== undefined, activeTab);

  const resultQuery = useQuery({
    queryKey: webAnalysisQueryKeys.result(actorUserId, videoId),
    enabled: resultEnabled,
    queryFn: ({ signal }) =>
      webAnalysisService.getResultByVideoId({ actorUserId, videoId, signal }),
    placeholderData: undefined,
    retry: false,
    staleTime: 0,
  });
  const cvQuery = useQuery({
    queryKey: webAnalysisQueryKeys.cv(actorUserId, videoId),
    enabled: cvEnabled,
    queryFn: ({ signal }) =>
      webAnalysisService.getCvDemoOutputByVideoId({ actorUserId, videoId, signal }),
    placeholderData: undefined,
    retry: false,
    staleTime: 0,
  });
  const logsQuery = useQuery({
    queryKey: webAnalysisQueryKeys.logsByVideo(actorUserId, videoId),
    enabled: logsEnabled,
    queryFn: ({ signal }) =>
      webAnalysisService.getTaskLogsByVideoId({ actorUserId, videoId, signal }),
    placeholderData: undefined,
    retry: false,
    staleTime: 0,
  });

  const taskLogRevision = getWebTaskLogRevision(task);
  useEffect(() => {
    const current = { identity, value: taskLogRevision };
    const previous = logsRevisionRef.current;
    logsRevisionRef.current = current;
    if (!shouldRefetchWebTaskLogs(logsEnabled, previous, current)) return;
    void queryClient.refetchQueries({
      queryKey: webAnalysisQueryKeys.logsByVideo(actorUserId, videoId),
      exact: true,
      type: 'active',
    });
  }, [actorUserId, identity, logsEnabled, queryClient, taskLogRevision, videoId]);

  const retryMutation = useMutation<AnalysisTask, unknown, AbortSignal>({
    mutationKey: webAnalysisMutationKeys.retry(actorUserId),
    mutationFn: (signal) => webAnalysisService.retryAnalysis({ actorUserId, videoId, signal }),
  });

  async function retryAnalysis(): Promise<boolean> {
    if (task?.status !== 'failed' || uploadStatus !== 'uploaded' || ownerRef.current !== null) {
      return false;
    }
    const owner: RetryOwner = { identity, controller: new AbortController() };
    ownerRef.current = owner;
    setRetryState({ identity, pending: true, error: null });
    try {
      await queryClient.cancelQueries({
        queryKey: webAnalysisQueryKeys.task(actorUserId, videoId),
        exact: true,
      });
      const retriedTask = await retryMutation.mutateAsync(owner.controller.signal);
      queryClient.setQueryData(webAnalysisQueryKeys.task(actorUserId, videoId), {
        task: retriedTask,
        runtimeActive: true,
      });
      queryClient.removeQueries({
        queryKey: webAnalysisQueryKeys.result(actorUserId, videoId),
        exact: true,
      });
      queryClient.removeQueries({
        queryKey: webAnalysisQueryKeys.cv(actorUserId, videoId),
        exact: true,
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: webAnalysisQueryKeys.logsByVideo(actorUserId, videoId),
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: webVideoQueryKeys.detail(actorUserId, videoId),
          exact: true,
        }),
        queryClient.invalidateQueries({ queryKey: webVideoQueryKeys.lists() }),
      ]);
      if (ownerRef.current === owner) setRetryState({ identity, pending: false, error: null });
      return true;
    } catch (error) {
      if (!owner.controller.signal.aborted && ownerRef.current === owner) {
        setRetryState({
          identity,
          pending: false,
          error: getSafeAppErrorMessage(error, '暂时无法重新分析，请稍后重试。'),
        });
        await Promise.all([
          queryClient.refetchQueries({
            queryKey: webAnalysisQueryKeys.task(actorUserId, videoId),
            exact: true,
            type: 'active',
          }),
          queryClient.refetchQueries({
            queryKey: webAnalysisQueryKeys.logsByVideo(actorUserId, videoId),
            exact: true,
            type: 'active',
          }),
        ]);
      }
      return false;
    } finally {
      if (ownerRef.current === owner) ownerRef.current = null;
    }
  }

  const visibleRetryState =
    retryState.identity === identity ? retryState : { identity, pending: false, error: null };

  return {
    taskQuery,
    resultQuery,
    cvQuery,
    logsQuery,
    taskEnabled,
    resultEnabled,
    cvEnabled,
    logsEnabled,
    retryAllowed: uploadStatus === 'uploaded' && task?.status === 'failed',
    retrying: visibleRetryState.pending,
    retryError: visibleRetryState.error,
    retryAnalysis,
    canDisplayResult:
      resultEnabled &&
      task?.status === 'succeeded' &&
      resultQuery.isSuccess &&
      resultQuery.data !== null,
    canDisplayCv:
      cvEnabled && task?.status === 'succeeded' && cvQuery.isSuccess && cvQuery.data !== null,
  };
}

export type WebAnalysisDetailState = ReturnType<typeof useWebAnalysisDetail>;
