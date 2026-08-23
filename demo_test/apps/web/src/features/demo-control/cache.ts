import type { QueryClient } from '@tanstack/react-query';

import { webAnalysisQueryKeys } from '../analysis/queryKeys';
import type { WebDemoScenarioBundle } from '../demo-data';
import { invalidateWebOverviewStatistics } from '../statistics/cache';
import { webStatisticsQueryKeys } from '../statistics/queryKeys';
import { webVideoQueryKeys } from '../videos/queryKeys';

export async function cancelWebDemoEntityQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: webVideoQueryKeys.all }),
    queryClient.cancelQueries({ queryKey: webAnalysisQueryKeys.all }),
    queryClient.cancelQueries({ queryKey: webStatisticsQueryKeys.all }),
  ]);
}

export async function applyWebDemoResetCache(queryClient: QueryClient): Promise<void> {
  queryClient.removeQueries({ queryKey: webVideoQueryKeys.all });
  queryClient.removeQueries({ queryKey: webAnalysisQueryKeys.all });
  await invalidateWebOverviewStatistics(queryClient);
}

export async function applyWebDemoBundleCache(
  queryClient: QueryClient,
  actorUserId: string,
  bundle: WebDemoScenarioBundle,
): Promise<void> {
  const videoId = bundle.videoRecord.video.id;
  queryClient.setQueryData(webVideoQueryKeys.detail(actorUserId, videoId), bundle.videoRecord);
  queryClient.setQueryData(webAnalysisQueryKeys.task(actorUserId, videoId), bundle.taskState);
  if (bundle.result === null) {
    queryClient.removeQueries({
      queryKey: webAnalysisQueryKeys.result(actorUserId, videoId),
      exact: true,
    });
  } else {
    queryClient.setQueryData(webAnalysisQueryKeys.result(actorUserId, videoId), bundle.result);
  }
  if (bundle.cv === null) {
    queryClient.removeQueries({
      queryKey: webAnalysisQueryKeys.cv(actorUserId, videoId),
      exact: true,
    });
  } else {
    queryClient.setQueryData(webAnalysisQueryKeys.cv(actorUserId, videoId), bundle.cv);
  }
  queryClient.setQueryData(webAnalysisQueryKeys.logsByVideo(actorUserId, videoId), bundle.logs);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: webVideoQueryKeys.lists() }),
    invalidateWebOverviewStatistics(queryClient),
  ]);
}
