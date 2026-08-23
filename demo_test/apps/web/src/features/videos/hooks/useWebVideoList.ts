import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { WebVideoListParams } from '../types';
import { webVideoQueryKeys } from '../queryKeys';
import { webVideoService } from '../service';

export function useWebVideoList(options: {
  actorUserId: string;
  params: WebVideoListParams;
  enabled: boolean;
}) {
  const { actorUserId, params, enabled } = options;
  const queryEnabled = enabled && actorUserId.trim().length > 0;
  return useQuery({
    queryKey: webVideoQueryKeys.list(actorUserId, params),
    enabled: queryEnabled,
    queryFn: ({ signal }) => webVideoService.listVideos({ actorUserId, ...params, signal }),
    placeholderData: queryEnabled ? keepPreviousData : undefined,
    retry: false,
  });
}
