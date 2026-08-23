import type { WebVideoListParams } from './types';

export const webVideoQueryKeys = {
  all: ['web-videos'] as const,
  lists: () => [...webVideoQueryKeys.all, 'list'] as const,
  list: (actorUserId: string, params: WebVideoListParams) =>
    [...webVideoQueryKeys.lists(), actorUserId, params] as const,
  details: () => [...webVideoQueryKeys.all, 'detail'] as const,
  detail: (actorUserId: string, videoId: string) =>
    [...webVideoQueryKeys.details(), actorUserId, videoId] as const,
};

export const webVideoMutationKeys = {
  delete: (actorUserId: string) => [...webVideoQueryKeys.all, 'delete', actorUserId] as const,
};
