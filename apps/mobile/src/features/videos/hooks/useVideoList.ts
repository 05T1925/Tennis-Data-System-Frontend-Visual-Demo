import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnalysisTask, AppError, Video } from '@tennis/shared-types';
import { useEffect, useMemo, useRef, useState } from 'react';

import { analysisMutationKeys, analysisQueryKeys, analysisService } from '@/features/analysis';
import { homeQueryKeys } from '@/features/home';

import { videoQueryKeys } from '../queryKeys';
import { videoService } from '../service';
import {
  createVideoListViewModels,
  filterVideoListItems,
  getUniqueValidVideoIds,
  pruneRetryErrorsByVideoItems,
  type TaskQuerySnapshot,
  type VideoFilter,
} from '../videoPresentation';

type RetryVariables = {
  videoId: string;
  signal: AbortSignal;
};

function isAppError(error: unknown): error is AppError {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as Partial<AppError>;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.userMessage === 'string' &&
    typeof candidate.retryable === 'boolean'
  );
}

function safeErrorMessage(error: unknown, fallback: string) {
  if (isAppError(error) && error.userMessage.trim()) return error.userMessage.trim();
  return fallback;
}

function toVideoListError(error: unknown): AppError {
  if (isAppError(error)) return error;
  return {
    code: 'VIDEO_LIST_QUERY_FAILED',
    userMessage: '视频列表暂时加载失败，请重试。',
    technicalMessage: error instanceof Error ? error.message : 'Unknown video list query error.',
    retryable: true,
  };
}

export function useVideoList(userId: string | undefined) {
  const queryClient = useQueryClient();
  const normalizedUserId = userId?.trim() ?? '';
  const enabled = normalizedUserId.length > 0;
  const [filter, setFilter] = useState<VideoFilter>('all');
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [retryingVideoIds, setRetryingVideoIds] = useState<ReadonlySet<string>>(new Set());
  const [retryErrorsByVideoId, setRetryErrorsByVideoId] = useState<ReadonlyMap<string, string>>(
    new Map(),
  );
  const retryControllersRef = useRef(new Map<string, AbortController>());
  const retryLocksRef = useRef(new Set<string>());
  const manualRefreshLockRef = useRef(false);
  const refreshGenerationRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const retryControllers = retryControllersRef.current;
    const retryLocks = retryLocksRef.current;
    return () => {
      mountedRef.current = false;
      refreshGenerationRef.current += 1;
      manualRefreshLockRef.current = false;
      for (const controller of retryControllers.values()) controller.abort();
      retryControllers.clear();
      retryLocks.clear();
    };
  }, []);

  useEffect(() => {
    refreshGenerationRef.current += 1;
    manualRefreshLockRef.current = false;
    for (const controller of retryControllersRef.current.values()) controller.abort();
    retryControllersRef.current.clear();
    retryLocksRef.current.clear();
    setRetryingVideoIds(new Set());
    setRetryErrorsByVideoId(new Map());
    setManualRefreshing(false);
    setFilter('all');
  }, [normalizedUserId]);

  const listQuery = useQuery<Video[], AppError>({
    queryKey: videoQueryKeys.list(normalizedUserId),
    enabled,
    queryFn: async ({ signal }) => {
      try {
        return await videoService.listVideos({ userId: normalizedUserId, signal });
      } catch (error) {
        if (signal.aborted) throw error;
        throw toVideoListError(error);
      }
    },
    retry: false,
  });

  const validVideoIds = useMemo(
    () => getUniqueValidVideoIds(listQuery.data ?? []),
    [listQuery.data],
  );

  const taskQueries = useQueries({
    queries: validVideoIds.map((videoId) => ({
      queryKey: analysisQueryKeys.task(normalizedUserId, videoId),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        analysisService.getAnalysisTaskByVideoId({
          userId: normalizedUserId,
          videoId,
          signal,
        }),
      retry: false,
      staleTime: 60_000,
    })),
  });

  const taskSnapshots = useMemo(() => {
    const snapshots = new Map<string, TaskQuerySnapshot>();
    validVideoIds.forEach((videoId, index) => {
      const query = taskQueries[index];
      snapshots.set(videoId, {
        task: query.data,
        pending: query.isPending,
        error: query.isError,
      });
    });
    return snapshots;
  }, [taskQueries, validVideoIds]);

  const items = useMemo(
    () => createVideoListViewModels(listQuery.data ?? [], taskSnapshots),
    [listQuery.data, taskSnapshots],
  );
  const filteredItems = useMemo(() => filterVideoListItems(items, filter), [filter, items]);

  useEffect(() => {
    setRetryErrorsByVideoId((current) => pruneRetryErrorsByVideoItems(current, items));
  }, [items]);

  const retryMutation = useMutation<AnalysisTask, unknown, RetryVariables>({
    mutationKey: analysisMutationKeys.retry(normalizedUserId),
    mutationFn: ({ videoId, signal }) =>
      analysisService.retryAnalysis({ userId: normalizedUserId, videoId, signal }),
  });

  async function refresh() {
    if (!enabled || manualRefreshLockRef.current) return;
    const refreshGeneration = refreshGenerationRef.current;
    manualRefreshLockRef.current = true;
    setManualRefreshing(true);
    try {
      await Promise.allSettled([
        queryClient.refetchQueries({
          queryKey: videoQueryKeys.list(normalizedUserId),
          exact: true,
          type: 'active',
        }),
        queryClient.refetchQueries({
          queryKey: analysisQueryKeys.tasks(normalizedUserId),
          type: 'active',
        }),
      ]);
    } finally {
      if (refreshGenerationRef.current === refreshGeneration) {
        manualRefreshLockRef.current = false;
        if (mountedRef.current) setManualRefreshing(false);
      }
    }
  }

  async function retryAnalysis(videoId: string) {
    const normalizedVideoId = videoId.trim();
    const item = items.find((candidate) => candidate.videoId === normalizedVideoId);
    if (
      !enabled ||
      !normalizedVideoId ||
      !item?.canRetry ||
      retryLocksRef.current.has(normalizedVideoId)
    ) {
      return;
    }

    retryLocksRef.current.add(normalizedVideoId);
    const controller = new AbortController();
    retryControllersRef.current.set(normalizedVideoId, controller);
    setRetryingVideoIds((current) => new Set(current).add(normalizedVideoId));
    setRetryErrorsByVideoId((current) => {
      const next = new Map(current);
      next.delete(normalizedVideoId);
      return next;
    });

    try {
      await queryClient.cancelQueries({
        queryKey: analysisQueryKeys.task(normalizedUserId, normalizedVideoId),
        exact: true,
      });
      const task = await retryMutation.mutateAsync({
        videoId: normalizedVideoId,
        signal: controller.signal,
      });
      queryClient.setQueryData(analysisQueryKeys.task(normalizedUserId, normalizedVideoId), task);
      await queryClient.invalidateQueries({
        queryKey: homeQueryKeys.overview(normalizedUserId),
      });
    } catch (error) {
      if (!controller.signal.aborted && mountedRef.current) {
        setRetryErrorsByVideoId((current) => {
          const next = new Map(current);
          next.set(normalizedVideoId, safeErrorMessage(error, '暂时无法重新分析，请稍后重试。'));
          return next;
        });
        await queryClient.refetchQueries({
          queryKey: analysisQueryKeys.task(normalizedUserId, normalizedVideoId),
          exact: true,
          type: 'active',
        });
      }
    } finally {
      if (retryControllersRef.current.get(normalizedVideoId) === controller) {
        retryControllersRef.current.delete(normalizedVideoId);
        retryLocksRef.current.delete(normalizedVideoId);
        if (mountedRef.current) {
          setRetryingVideoIds((current) => {
            const next = new Set(current);
            next.delete(normalizedVideoId);
            return next;
          });
        }
      }
    }
  }

  return {
    filter,
    setFilter,
    items,
    filteredItems,
    retryingVideoIds,
    retryErrorsByVideoId,
    retryAnalysis,
    refresh,
    manualRefreshing,
    listPending: enabled && listQuery.isPending && !listQuery.data,
    listError: listQuery.error,
    listErrorMessage: listQuery.error
      ? safeErrorMessage(listQuery.error, '视频列表暂时加载失败，请重试。')
      : null,
    hasListData: listQuery.data !== undefined,
    retryList: listQuery.refetch,
  };
}
