import { useQuery } from '@tanstack/react-query';

import { webVideoQueryKeys } from '../queryKeys';
import { webVideoService } from '../service';

export function useWebVideoDetail(options: { actorUserId: string; videoId: string }) {
  const { actorUserId, videoId } = options;
  return useQuery({
    queryKey: webVideoQueryKeys.detail(actorUserId, videoId),
    enabled: actorUserId.trim().length > 0 && videoId.trim().length > 0,
    queryFn: ({ signal }) => webVideoService.getVideoById({ actorUserId, videoId, signal }),
    retry: false,
  });
}
