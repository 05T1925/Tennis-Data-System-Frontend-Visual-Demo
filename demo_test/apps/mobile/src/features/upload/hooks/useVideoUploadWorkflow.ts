import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppError, Video } from '@tennis/shared-types';
import { useEffect, useRef, useState } from 'react';

import { homeQueryKeys } from '@/features/home';
import { videoService } from '@/features/videos';

import { toCreateVideoInput } from '../assetAdapter';
import { UPLOAD_PROGRESS_POLL_INTERVAL_MS } from '../constants';
import { getSafeErrorMessage } from '../errors';
import { uploadQueryKeys } from '../queryKeys';
import type {
  SelectedVideoAsset,
  UploadFailureKind,
  UploadFormValues,
  UploadPhase,
} from '../types';
import { phaseForUploadStatus, shouldPollUpload } from '../workflow';

type UseVideoUploadWorkflowOptions = {
  userId: string | undefined;
};

export function useVideoUploadWorkflow({ userId }: UseVideoUploadWorkflowOptions) {
  const queryClient = useQueryClient();
  const normalizedUserId = userId?.trim() ?? '';
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [failureKind, setFailureKind] = useState<UploadFailureKind>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const operationLockedRef = useRef(false);
  const mountedRef = useRef(true);
  const successHandledRef = useRef(false);
  const createControllerRef = useRef<AbortController | null>(null);
  const startControllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      mountedRef.current = false;
      createControllerRef.current?.abort();
      startControllerRef.current?.abort();
    },
    [],
  );

  async function invalidateCreatedData(currentUserId: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: uploadQueryKeys.videoList(currentUserId) }),
      queryClient.invalidateQueries({ queryKey: homeQueryKeys.recentVideos(currentUserId) }),
      queryClient.invalidateQueries({ queryKey: homeQueryKeys.overview(currentUserId) }),
    ]);
  }

  async function invalidateCompletedData(currentUserId: string, currentVideoId: string) {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: uploadQueryKeys.videoDetail(currentUserId, currentVideoId),
      }),
      queryClient.invalidateQueries({ queryKey: uploadQueryKeys.videoList(currentUserId) }),
      queryClient.invalidateQueries({ queryKey: homeQueryKeys.recentVideos(currentUserId) }),
      queryClient.invalidateQueries({ queryKey: homeQueryKeys.overview(currentUserId) }),
      queryClient.invalidateQueries({
        queryKey: uploadQueryKeys.analysisTask(currentUserId, currentVideoId),
      }),
    ]);
  }

  const createMutation = useMutation({
    mutationFn: (options: {
      asset: SelectedVideoAsset;
      values: UploadFormValues;
      signal: AbortSignal;
    }) =>
      videoService.createVideo({
        userId: normalizedUserId,
        input: toCreateVideoInput(options.asset, options.values),
        signal: options.signal,
      }),
  });

  const startMutation = useMutation({
    mutationFn: (options: { videoId: string; signal: AbortSignal }) =>
      videoService.startUpload({
        userId: normalizedUserId,
        videoId: options.videoId,
        signal: options.signal,
      }),
  });

  const detailQuery = useQuery<Video, AppError>({
    queryKey: uploadQueryKeys.videoDetail(normalizedUserId, videoId ?? ''),
    enabled: Boolean(normalizedUserId && videoId && phase === 'uploading'),
    queryFn: ({ signal }) =>
      videoService.getVideoById({
        userId: normalizedUserId,
        videoId: videoId ?? '',
        signal,
      }),
    refetchInterval: (query) =>
      shouldPollUpload(query.state.data?.uploadStatus) ? UPLOAD_PROGRESS_POLL_INTERVAL_MS : false,
    retry: false,
  });

  const displayedPhase = phaseForUploadStatus(detailQuery.data?.uploadStatus, phase);

  useEffect(() => {
    const video = detailQuery.data;
    if (video?.uploadStatus === 'uploaded' && !successHandledRef.current) {
      successHandledRef.current = true;
      void invalidateCompletedData(normalizedUserId, video.id);
    }
  });

  async function startExistingVideo(currentVideoId: string) {
    setPhase('starting-upload');
    setFailureKind(null);
    setOperationError(null);
    const controller = new AbortController();
    startControllerRef.current = controller;
    try {
      const started = await startMutation.mutateAsync({
        videoId: currentVideoId,
        signal: controller.signal,
      });
      queryClient.setQueryData(
        uploadQueryKeys.videoDetail(normalizedUserId, currentVideoId),
        started,
      );
      if (mountedRef.current) setPhase('uploading');
    } catch (error) {
      if (!mountedRef.current) return;
      setPhase('upload-failed');
      setFailureKind('start');
      setOperationError(getSafeErrorMessage(error, '暂时无法开始上传，请稍后重试。'));
    } finally {
      if (startControllerRef.current === controller) startControllerRef.current = null;
    }
  }

  async function submit(asset: SelectedVideoAsset, values: UploadFormValues) {
    if (operationLockedRef.current || !normalizedUserId || displayedPhase === 'uploading') return;
    operationLockedRef.current = true;
    setPhase('creating-video');
    setFailureKind(null);
    setOperationError(null);
    const controller = new AbortController();
    createControllerRef.current = controller;

    try {
      const created = await createMutation.mutateAsync({
        asset,
        values,
        signal: controller.signal,
      });
      if (!mountedRef.current) return;
      setVideoId(created.id);
      void invalidateCreatedData(normalizedUserId);
      await startExistingVideo(created.id);
    } catch (error) {
      if (!mountedRef.current) return;
      setVideoId(null);
      setPhase('selected');
      setFailureKind('create');
      setOperationError(getSafeErrorMessage(error, '暂时无法创建上传记录，请稍后重试。'));
    } finally {
      if (createControllerRef.current === controller) createControllerRef.current = null;
      operationLockedRef.current = false;
    }
  }

  async function retry() {
    if (operationLockedRef.current || !videoId) return;
    operationLockedRef.current = true;
    try {
      await startExistingVideo(videoId);
    } finally {
      operationLockedRef.current = false;
    }
  }

  function markSelected() {
    if (!videoId && displayedPhase !== 'uploading' && displayedPhase !== 'upload-succeeded') {
      setPhase('selected');
      setFailureKind(null);
      setOperationError(null);
    }
  }

  const businessUploadFailed = displayedPhase === 'upload-failed' && failureKind === null;

  return {
    phase: displayedPhase,
    videoId,
    failureKind: businessUploadFailed ? ('upload' as const) : failureKind,
    operationError: businessUploadFailed ? '视频上传失败，请重试。' : operationError,
    video: detailQuery.data,
    progressError: detailQuery.error
      ? getSafeErrorMessage(detailQuery.error, '暂时无法获取上传进度，请重试。')
      : null,
    progressFetching: detailQuery.isFetching,
    isBusy: createMutation.isPending || startMutation.isPending,
    submit,
    retry,
    retryProgress: detailQuery.refetch,
    markSelected,
  };
}
