import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { getWebAnalysisEntityKeys } from '../../analysis/queryKeys';
import { invalidateWebOverviewStatistics } from '../../statistics/cache';
import { getSafeAppErrorMessage } from '../presentation';
import { webVideoMutationKeys, webVideoQueryKeys } from '../queryKeys';
import { webVideoService } from '../service';

type DeleteOwner = { controller: AbortController; actorUserId: string };
type DeleteUiState = {
  actorUserId: string;
  pendingIds: ReadonlySet<string>;
  errors: ReadonlyMap<string, string>;
};

export function useDeleteWebVideo(actorUserId: string) {
  const queryClient = useQueryClient();
  const ownersRef = useRef(new Map<string, DeleteOwner>());
  const mountedRef = useRef(true);
  const [uiState, setUiState] = useState<DeleteUiState>({
    actorUserId,
    pendingIds: new Set(),
    errors: new Map(),
  });
  const visibleState =
    uiState.actorUserId === actorUserId
      ? uiState
      : { actorUserId, pendingIds: new Set<string>(), errors: new Map<string, string>() };

  useEffect(() => {
    mountedRef.current = true;
    const owners = ownersRef.current;
    for (const owner of owners.values()) {
      if (owner.actorUserId !== actorUserId) owner.controller.abort();
    }
    return () => {
      mountedRef.current = false;
      for (const owner of owners.values()) owner.controller.abort();
      owners.clear();
    };
  }, [actorUserId]);

  const mutation = useMutation({
    mutationKey: webVideoMutationKeys.delete(actorUserId),
    mutationFn: ({ videoId, signal }: { videoId: string; signal: AbortSignal }) =>
      webVideoService.deleteVideo({ actorUserId, videoId, signal }),
  });

  async function deleteVideo(videoId: string): Promise<boolean> {
    const normalizedVideoId = videoId.trim();
    if (!normalizedVideoId || ownersRef.current.has(normalizedVideoId)) return false;
    const owner: DeleteOwner = { controller: new AbortController(), actorUserId };
    ownersRef.current.set(normalizedVideoId, owner);
    setUiState((current) => {
      const pendingIds = new Set(current.actorUserId === actorUserId ? current.pendingIds : []);
      const errors = new Map(current.actorUserId === actorUserId ? current.errors : []);
      pendingIds.add(normalizedVideoId);
      errors.delete(normalizedVideoId);
      return { actorUserId, pendingIds, errors };
    });

    try {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: webVideoQueryKeys.detail(actorUserId, normalizedVideoId),
          exact: true,
        }),
        queryClient.cancelQueries({ queryKey: webVideoQueryKeys.lists() }),
        ...getWebAnalysisEntityKeys(actorUserId, normalizedVideoId).map((queryKey) =>
          queryClient.cancelQueries({ queryKey, exact: true }),
        ),
      ]);
      await mutation.mutateAsync({ videoId: normalizedVideoId, signal: owner.controller.signal });
      queryClient.removeQueries({
        queryKey: webVideoQueryKeys.detail(actorUserId, normalizedVideoId),
        exact: true,
      });
      for (const queryKey of getWebAnalysisEntityKeys(actorUserId, normalizedVideoId)) {
        queryClient.removeQueries({ queryKey, exact: true });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: webVideoQueryKeys.lists() }),
        invalidateWebOverviewStatistics(queryClient),
      ]);
      return true;
    } catch (error) {
      if (!owner.controller.signal.aborted && mountedRef.current) {
        setUiState((current) => {
          if (current.actorUserId !== actorUserId) return current;
          const errors = new Map(current.errors);
          errors.set(
            normalizedVideoId,
            getSafeAppErrorMessage(error, '暂时无法删除该视频，请重试。'),
          );
          return { ...current, errors };
        });
      }
      return false;
    } finally {
      if (ownersRef.current.get(normalizedVideoId) === owner) {
        ownersRef.current.delete(normalizedVideoId);
        if (mountedRef.current) {
          setUiState((current) => {
            if (current.actorUserId !== actorUserId) return current;
            const pendingIds = new Set(current.pendingIds);
            pendingIds.delete(normalizedVideoId);
            return { ...current, pendingIds };
          });
        }
      }
    }
  }

  function clearDeleteError(videoId: string): void {
    setUiState((current) => {
      if (current.actorUserId !== actorUserId || !current.errors.has(videoId)) return current;
      const errors = new Map(current.errors);
      errors.delete(videoId);
      return { ...current, errors };
    });
  }

  return {
    deleteVideo,
    clearDeleteError,
    deletingVideoIds: visibleState.pendingIds,
    deleteErrors: visibleState.errors,
  };
}
