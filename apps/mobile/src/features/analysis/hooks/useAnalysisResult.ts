import { useQuery } from '@tanstack/react-query';
import type { AnalysisResult, AnalysisTask, AppError, Video } from '@tennis/shared-types';

import { videoQueryKeys } from '@/features/videos/queryKeys';
import { videoService } from '@/features/videos/service';

import { canDisplayAnalysisResult } from '../analysisResultPresentation';
import { analysisQueryKeys } from '../queryKeys';
import { analysisService } from '../service';

export function useAnalysisResult(options: {
  userId: string | null | undefined;
  videoId: string | null | undefined;
}) {
  const userId = options.userId?.trim() ?? '';
  const videoId = options.videoId?.trim() ?? '';
  const identityValid = userId.length > 0 && videoId.length > 0;

  const videoQuery = useQuery<Video, AppError>({
    queryKey: videoQueryKeys.detail(userId, videoId),
    enabled: identityValid,
    queryFn: ({ signal }) => videoService.getVideoById({ userId, videoId, signal }),
    refetchOnMount: 'always',
    retry: false,
  });

  const taskEnabled =
    identityValid && videoQuery.isSuccess && videoQuery.data.uploadStatus === 'uploaded';
  const taskQuery = useQuery<AnalysisTask | null, AppError>({
    queryKey: analysisQueryKeys.task(userId, videoId),
    enabled: taskEnabled,
    queryFn: ({ signal }) => analysisService.getAnalysisTaskByVideoId({ userId, videoId, signal }),
    refetchOnMount: 'always',
    retry: false,
  });

  const resultEnabled =
    taskEnabled && taskQuery.isSuccess && taskQuery.data?.status === 'succeeded';
  const resultQuery = useQuery<AnalysisResult | null, AppError>({
    queryKey: analysisQueryKeys.result(userId, videoId),
    enabled: resultEnabled,
    queryFn: ({ signal }) =>
      analysisService.getAnalysisResultByVideoId({ userId, videoId, signal }),
    staleTime: 0,
    retry: false,
  });

  const canDisplayResult = canDisplayAnalysisResult({
    identityValid,
    videoQueryFetching: videoQuery.isFetching,
    taskQuerySuccess: taskQuery.isSuccess,
    taskQueryFetching: taskQuery.isFetching,
    taskStatus: taskQuery.data?.status,
    resultQuerySuccess: resultQuery.isSuccess,
    resultQueryFetching: resultQuery.isFetching,
    result: resultQuery.data,
  });

  return {
    identityValid,
    videoQuery,
    taskQuery,
    resultQuery,
    taskEnabled,
    resultEnabled,
    canDisplayResult,
    displayResult: canDisplayResult ? resultQuery.data : null,
  };
}

export type AnalysisResultPageState = ReturnType<typeof useAnalysisResult>;
