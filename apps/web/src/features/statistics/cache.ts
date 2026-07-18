import type { QueryClient } from '@tanstack/react-query';

import { webStatisticsQueryKeys } from './queryKeys';

export async function invalidateWebOverviewStatistics(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: webStatisticsQueryKeys.all,
    refetchType: 'active',
  });
}
