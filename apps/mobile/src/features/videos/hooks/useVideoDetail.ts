import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnalysisResult, AnalysisTask, AppError, Video } from '@tennis/shared-types';
import { useEffect, useRef, useState } from 'react';

import {
  analysisMutationKeys,
  analysisQueryKeys,
  analysisService,
  canRetryAnalysis,
  shouldEnableAnalysisResult,
  useAnalysisPolling,
} from '@/features/analysis';
import { homeQueryKeys } from '@/features/home';

import { videoQueryKeys } from '../queryKeys';
import { videoService } from '../service';

type RetryVariables = {
  userId: string;
  videoId: string;
  signal: AbortSignal;
};

type RetryState = {
  identity: string;
  pending: boolean;
  errorMessage: string | null;
};

function isAppError(error: unknown): error is AppError {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as Partial<AppError>;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.userMessage === 'string' &&
    typeof candidate.retryable === 'boolean'
  );
}

export function getSafeDetailErrorMessage(error: unknown, fallback: string) {
  return isAppError(error) && error.userMessage.trim() ? error.userMessage.trim() : fallback;
}

export function useVideoDetail(options: {
  userId: string | null | undefined;
  videoId: string | null | undefined;
}) {
  const queryClient = useQueryClient();
  const userId = options.userId?.trim() ?? '';
  const videoId = options.videoId?.trim() ?? '';
  const identity = `${userId}\u0000${videoId}`;
  const identityValid = userId.length > 0 && videoId.length > 0;
  const mountedRef = useRef(true);
  const identityGenerationRef = useRef(0);
  const retryLockRef = useRef<string | null>(null);
  const retryControllerRef = useRef<AbortController | null>(null);
  const [retryState, setRetryState] = useState<RetryState | null>(null);
  const [retryStateIdentity, setRetryStateIdentity] = useState(identity);

  if (retryStateIdentity !== identity) {
    setRetryStateIdentity(identity);
    setRetryState(null);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      identityGenerationRef.current += 1;
      retryControllerRef.current?.abort();
      retryControllerRef.current = null;
      retryLockRef.current = null;
    };
  }, []);

  useEffect(() => {
    identityGenerationRef.current += 1;
    retryControllerRef.current?.abort();
    retryControllerRef.current = null;
    retryLockRef.current = null;
  }, [identity]);

  const videoQuery = useQuery<Video, AppError>({
    queryKey: videoQueryKeys.detail(userId, videoId),
    enabled: identityValid,
    queryFn: ({ signal }) => videoService.getVideoById({ userId, videoId, signal }),
    refetchOnMount: 'always',
    retry: false,
  });

  const taskEnabled =
    identityValid && videoQuery.isSuccess && videoQuery.data.uploadStatus === 'uploaded';
  const polling = useAnalysisPolling({ userId, videoId, enabled: taskEnabled });
  const task = polling.taskQuery.data;
  const resultEnabled = shouldEnableAnalysisResult({
    userId,
    videoId,
    uploadStatus: videoQuery.data?.uploadStatus,
    taskStatus: task?.status,
  });

  const resultQuery = useQuery<AnalysisResult | null, AppError>({
    queryKey: analysisQueryKeys.result(userId, videoId),
    enabled: resultEnabled,
    queryFn: ({ signal }) =>
      analysisService.getAnalysisResultByVideoId({ userId, videoId, signal }),
    staleTime: 0,
    retry: false,
  });

  const retryMutation = useMutation<AnalysisTask, unknown, RetryVariables>({
    mutationKey: analysisMutationKeys.retry(userId),
    mutationFn: ({ userId: retryUserId, videoId: retryVideoId, signal }) =>
      analysisService.retryAnalysis({ userId: retryUserId, videoId: retryVideoId, signal }),
  });

  const retryAllowed = canRetryAnalysis({
    userId,
    videoId,
    uploadStatus: videoQuery.data?.uploadStatus,
    taskStatus: task?.status,
  });

  async function retryAnalysis() {
    if (!retryAllowed || retryLockRef.current === identity) return;
    const generation = identityGenerationRef.current;
    const controller = new AbortController();
    retryLockRef.current = identity;
    retryControllerRef.current = controller;
    setRetryState({ identity, pending: true, errorMessage: null });

    try {
      await queryClient.cancelQueries({
        queryKey: analysisQueryKeys.task(userId, videoId),
        exact: true,
      });
      const retriedTask = await retryMutation.mutateAsync({
        userId,
        videoId,
        signal: controller.signal,
      });
      queryClient.setQueryData(analysisQueryKeys.task(userId, videoId), retriedTask);
      queryClient.removeQueries({
        queryKey: analysisQueryKeys.result(userId, videoId),
        exact: true,
      });
      await queryClient.invalidateQueries({
        queryKey: homeQueryKeys.overview(userId),
        exact: true,
      });
      if (
        mountedRef.current &&
        identityGenerationRef.current === generation &&
        retryLockRef.current === identity
      ) {
        setRetryState({ identity, pending: false, errorMessage: null });
      }
    } catch (error) {
      if (
        !controller.signal.aborted &&
        mountedRef.current &&
        identityGenerationRef.current === generation
      ) {
        setRetryState({
          identity,
          pending: false,
          errorMessage: getSafeDetailErrorMessage(error, '暂时无法重新分析，请稍后重试。'),
        });
        await queryClient.refetchQueries({
          queryKey: analysisQueryKeys.task(userId, videoId),
          exact: true,
          type: 'active',
        });
      }
    } finally {
      if (retryControllerRef.current === controller) {
        retryControllerRef.current = null;
        if (retryLockRef.current === identity) retryLockRef.current = null;
      }
    }
  }

  return {
    identityValid,
    videoQuery,
    taskQuery: polling.taskQuery,
    resultQuery,
    taskEnabled,
    resultEnabled,
    retryAllowed,
    retrying: retryState?.identity === identity && retryState.pending,
    retryErrorMessage: retryState?.identity === identity ? retryState.errorMessage : null,
    retryAnalysis,
    pollingEnvironment: {
      isScreenFocused: polling.isScreenFocused,
      appState: polling.appState,
      active: polling.environmentActive,
    },
  };
}

export type VideoDetailState = ReturnType<typeof useVideoDetail>;
