import { useQuery } from '@tanstack/react-query';
import type { AppError, Video } from '@tennis/shared-types';

import { statisticsService } from '@/features/statistics';
import type { HomeOverview } from '@/features/statistics';
import { videoService } from '@/features/videos';

const RECENT_VIDEO_LIMIT = 3;

export const homeQueryKeys = {
  recentVideos: (userId: string) => ['home', 'recentVideos', userId, RECENT_VIDEO_LIMIT] as const,
  overview: (userId: string) => ['home', 'overview', userId] as const,
};

function overviewIsEmpty(overview: HomeOverview) {
  return (
    overview.totalVideos === 0 &&
    overview.totalShots === 0 &&
    overview.totalRallies === 0 &&
    overview.totalTrainingDurationMs === 0 &&
    overview.latestAnalysis === null
  );
}

function isAppError(error: unknown): error is AppError {
  if (typeof error !== 'object' || error === null) return false;

  const candidate = error as Partial<AppError>;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.userMessage === 'string' &&
    typeof candidate.retryable === 'boolean'
  );
}

function toHomeQueryError(error: unknown, code: string, userMessage: string): AppError {
  if (isAppError(error)) return error;

  return {
    code,
    userMessage,
    technicalMessage: error instanceof Error ? error.message : 'Unknown home query error.',
    retryable: true,
  };
}

export function useHomeQueries(userId: string | undefined) {
  const normalizedUserId = userId?.trim() ?? '';
  const enabled = normalizedUserId.length > 0;

  const videosQuery = useQuery<Video[], AppError>({
    queryKey: homeQueryKeys.recentVideos(normalizedUserId),
    enabled,
    queryFn: async ({ signal }) => {
      try {
        const videos = await videoService.getRecentVideos({
          userId: normalizedUserId,
          limit: RECENT_VIDEO_LIMIT,
          signal,
        });
        return videos.slice(0, RECENT_VIDEO_LIMIT);
      } catch (error) {
        if (signal.aborted) throw error;
        throw toHomeQueryError(error, 'HOME_VIDEOS_QUERY_FAILED', '最近视频暂时加载失败，请重试。');
      }
    },
    retry: false,
  });

  const overviewQuery = useQuery<HomeOverview, AppError>({
    queryKey: homeQueryKeys.overview(normalizedUserId),
    enabled,
    queryFn: async ({ signal }) => {
      try {
        return await statisticsService.getHomeOverview({ userId: normalizedUserId, signal });
      } catch (error) {
        if (signal.aborted) throw error;
        throw toHomeQueryError(
          error,
          'HOME_OVERVIEW_QUERY_FAILED',
          '训练统计暂时加载失败，请重试。',
        );
      }
    },
    retry: false,
  });

  const isEmpty =
    videosQuery.isSuccess &&
    overviewQuery.isSuccess &&
    videosQuery.data.length === 0 &&
    overviewIsEmpty(overviewQuery.data);

  return {
    videos: videosQuery.data,
    videosError: videosQuery.error,
    videosPending: enabled && videosQuery.isPending,
    videosFetching: videosQuery.isFetching,
    retryVideos: videosQuery.refetch,
    overview: overviewQuery.data,
    overviewError: overviewQuery.error,
    overviewPending: enabled && overviewQuery.isPending,
    overviewFetching: overviewQuery.isFetching,
    retryOverview: overviewQuery.refetch,
    isEmpty,
  };
}
