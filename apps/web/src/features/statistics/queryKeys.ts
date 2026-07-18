import type { WebOverviewStatistics } from './types';

export const webStatisticsQueryKeys = {
  all: ['web-statistics'] as const,
  overviews: () => [...webStatisticsQueryKeys.all, 'overview'] as const,
  overview: (actorUserId: string, localDateKey: string) =>
    [...webStatisticsQueryKeys.overviews(), actorUserId, localDateKey] as const,
};

export function getWebOverviewPollingInterval(
  data: WebOverviewStatistics | undefined,
  hasError: boolean,
): number | false {
  return !hasError && data && data.runtimeActiveCount > 0 ? 2_000 : false;
}
