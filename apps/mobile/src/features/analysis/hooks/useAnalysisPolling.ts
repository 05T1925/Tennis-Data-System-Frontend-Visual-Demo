import { useQuery } from '@tanstack/react-query';
import type { AnalysisTask, AppError } from '@tennis/shared-types';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import {
  getAnalysisPollingInterval,
  isTerminalAnalysisStatus,
  shouldTriggerAnalysisResume,
} from '../analysisPresentation';
import { analysisQueryKeys } from '../queryKeys';
import { analysisService } from '../service';

type UseAnalysisPollingOptions = {
  userId: string;
  videoId: string;
  enabled: boolean;
};

function useScreenFocused() {
  const navigation = useNavigation();
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const removeFocus = navigation.addListener('focus', onStoreChange);
      const removeBlur = navigation.addListener('blur', onStoreChange);
      return () => {
        removeFocus();
        removeBlur();
      };
    },
    [navigation],
  );
  const getSnapshot = useCallback(() => navigation.isFocused(), [navigation]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function useAnalysisPolling({ userId, videoId, enabled }: UseAnalysisPollingOptions) {
  const normalizedUserId = userId.trim();
  const normalizedVideoId = videoId.trim();
  const identity = `${normalizedUserId}\u0000${normalizedVideoId}`;
  const isScreenFocused = useScreenFocused();
  const [appState, setAppState] = useState(AppState.currentState);
  const environmentActive = isScreenFocused && appState === 'active';
  const identityGenerationRef = useRef(0);
  const previousEnvironmentActiveRef = useRef(environmentActive);
  const initialEnvironmentObservationRef = useRef(true);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  const taskQuery = useQuery<AnalysisTask | null, AppError>({
    queryKey: analysisQueryKeys.task(normalizedUserId, normalizedVideoId),
    enabled,
    queryFn: ({ signal }) =>
      analysisService.getAnalysisTaskByVideoId({
        userId: normalizedUserId,
        videoId: normalizedVideoId,
        signal,
      }),
    refetchInterval: (query) =>
      getAnalysisPollingInterval({
        status: query.state.data?.status,
        isScreenFocused,
        appState,
        hasQueryError: query.state.error !== null,
      }),
    refetchIntervalInBackground: false,
    refetchOnMount: 'always',
    retry: false,
  });

  useEffect(() => {
    identityGenerationRef.current += 1;
    previousEnvironmentActiveRef.current = false;
    initialEnvironmentObservationRef.current = true;
  }, [identity]);

  const taskData = taskQuery.data;
  const taskIsPending = taskQuery.isPending;
  const taskIsFetching = taskQuery.isFetching;
  const taskIsError = taskQuery.isError;
  const refetchTask = taskQuery.refetch;

  useEffect(() => {
    const previousEnvironmentActive = previousEnvironmentActiveRef.current;
    const isInitialObservation = initialEnvironmentObservationRef.current;
    const capturedGeneration = identityGenerationRef.current;
    previousEnvironmentActiveRef.current = environmentActive;
    initialEnvironmentObservationRef.current = false;

    if (
      !shouldTriggerAnalysisResume({
        previousEnvironmentActive,
        currentEnvironmentActive: environmentActive,
        isInitialObservation,
        capturedGeneration,
        currentGeneration: identityGenerationRef.current,
      }) ||
      !enabled ||
      taskIsPending ||
      taskIsFetching ||
      taskIsError ||
      taskData === undefined ||
      isTerminalAnalysisStatus(taskData?.status)
    ) {
      return;
    }

    void refetchTask();
  }, [
    enabled,
    environmentActive,
    refetchTask,
    taskData,
    taskIsError,
    taskIsFetching,
    taskIsPending,
  ]);

  return {
    taskQuery,
    isScreenFocused,
    appState,
    environmentActive,
  };
}
