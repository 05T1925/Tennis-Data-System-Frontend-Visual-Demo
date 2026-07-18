import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import type { WebDemoScenarioKind } from '../../demo-data';
import { getSafeAppErrorMessage } from '../../videos';
import {
  applyWebDemoBundleCache,
  applyWebDemoResetCache,
  cancelWebDemoEntityQueries,
} from '../cache';
import { webDemoControlMutationKeys } from '../queryKeys';
import { webDemoControlService } from '../service';

type Operation =
  'reset' | 'create-success' | 'create-processing' | 'create-failed' | 'force-complete';
type Owner = { identity: string; controller: AbortController; operation: Operation };

export function useWebDemoControls(actorUserId: string, selectedVideoId?: string) {
  const queryClient = useQueryClient();
  const ownerRef = useRef<Owner | null>(null);
  const mountedRef = useRef(true);
  const [state, setState] = useState<{
    actorUserId: string;
    operation: Operation | null;
    success: string | null;
    error: string | null;
  }>({ actorUserId, operation: null, success: null, error: null });

  useEffect(() => {
    mountedRef.current = true;
    ownerRef.current?.controller.abort();
    ownerRef.current = null;
    return () => {
      mountedRef.current = false;
      ownerRef.current?.controller.abort();
      ownerRef.current = null;
    };
  }, [actorUserId]);

  const resetMutation = useMutation({
    mutationKey: webDemoControlMutationKeys.reset(actorUserId),
    mutationFn: (signal: AbortSignal) =>
      webDemoControlService.resetDemoData({ actorUserId, signal }),
  });
  const createSuccessMutation = useMutation({
    mutationKey: webDemoControlMutationKeys.create(actorUserId, 'success'),
    mutationFn: (signal: AbortSignal) =>
      webDemoControlService.createScenario({ actorUserId, kind: 'success', signal }),
  });
  const createProcessingMutation = useMutation({
    mutationKey: webDemoControlMutationKeys.create(actorUserId, 'processing'),
    mutationFn: (signal: AbortSignal) =>
      webDemoControlService.createScenario({ actorUserId, kind: 'processing', signal }),
  });
  const createFailedMutation = useMutation({
    mutationKey: webDemoControlMutationKeys.create(actorUserId, 'failed'),
    mutationFn: (signal: AbortSignal) =>
      webDemoControlService.createScenario({ actorUserId, kind: 'failed', signal }),
  });
  const normalizedSelectedVideoId = selectedVideoId?.trim() ?? '';
  const forceMutation = useMutation({
    mutationKey: webDemoControlMutationKeys.forceComplete(actorUserId, normalizedSelectedVideoId),
    mutationFn: (signal: AbortSignal) =>
      webDemoControlService.forceComplete({
        actorUserId,
        videoId: normalizedSelectedVideoId,
        signal,
      }),
  });

  function begin(operation: Operation, objectId: string): Owner | null {
    if (ownerRef.current !== null) return null;
    const owner = {
      identity: `${actorUserId}\u0000${operation}\u0000${objectId}`,
      controller: new AbortController(),
      operation,
    };
    ownerRef.current = owner;
    setState({ actorUserId, operation, success: null, error: null });
    return owner;
  }

  function finish(owner: Owner): void {
    if (ownerRef.current !== owner) return;
    ownerRef.current = null;
    if (mountedRef.current) {
      setState((current) =>
        current.actorUserId === actorUserId ? { ...current, operation: null } : current,
      );
    }
  }

  function fail(owner: Owner, error: unknown): void {
    if (owner.controller.signal.aborted || ownerRef.current !== owner || !mountedRef.current)
      return;
    setState({
      actorUserId,
      operation: owner.operation,
      success: null,
      error: getSafeAppErrorMessage(error, '开发环境 Demo 操作暂时无法完成，请重试。'),
    });
  }

  async function resetDemoData(): Promise<boolean> {
    const owner = begin('reset', 'all');
    if (!owner) return false;
    try {
      await cancelWebDemoEntityQueries(queryClient);
      await resetMutation.mutateAsync(owner.controller.signal);
      await applyWebDemoResetCache(queryClient);
      if (ownerRef.current === owner && mountedRef.current) {
        setState({
          actorUserId,
          operation: owner.operation,
          success: 'Web Demo 数据已重置。',
          error: null,
        });
      }
      return true;
    } catch (error) {
      fail(owner, error);
      return false;
    } finally {
      finish(owner);
    }
  }

  async function createScenario(kind: WebDemoScenarioKind): Promise<boolean> {
    const operation = `create-${kind}` as Operation;
    const owner = begin(operation, kind);
    if (!owner) return false;
    try {
      const mutation =
        kind === 'success'
          ? createSuccessMutation
          : kind === 'processing'
            ? createProcessingMutation
            : createFailedMutation;
      const bundle = await mutation.mutateAsync(owner.controller.signal);
      await applyWebDemoBundleCache(queryClient, actorUserId, bundle);
      if (ownerRef.current === owner && mountedRef.current) {
        const label =
          kind === 'success' ? '分析成功' : kind === 'processing' ? '分析处理中' : '分析失败';
        setState({ actorUserId, operation, success: `${label}场景已创建。`, error: null });
      }
      return true;
    } catch (error) {
      fail(owner, error);
      return false;
    } finally {
      finish(owner);
    }
  }

  async function forceComplete(): Promise<boolean> {
    if (!normalizedSelectedVideoId) return false;
    const owner = begin('force-complete', normalizedSelectedVideoId);
    if (!owner) return false;
    try {
      const bundle = await forceMutation.mutateAsync(owner.controller.signal);
      await applyWebDemoBundleCache(queryClient, actorUserId, bundle);
      if (ownerRef.current === owner && mountedRef.current) {
        setState({
          actorUserId,
          operation: owner.operation,
          success: '指定分析任务已立即完成。',
          error: null,
        });
      }
      return true;
    } catch (error) {
      fail(owner, error);
      return false;
    } finally {
      finish(owner);
    }
  }

  const visibleState =
    state.actorUserId === actorUserId
      ? state
      : { actorUserId, operation: null, success: null, error: null };
  return {
    ...visibleState,
    busy: visibleState.operation !== null,
    resetDemoData,
    createScenario,
    forceComplete,
    clearNotice: () => setState((current) => ({ ...current, success: null, error: null })),
  };
}
