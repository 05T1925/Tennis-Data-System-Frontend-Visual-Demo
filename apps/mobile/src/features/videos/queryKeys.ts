export const videoQueryKeys = {
  all: ['videos'] as const,
  lists: () => [...videoQueryKeys.all, 'list'] as const,
  list: (userId: string) => [...videoQueryKeys.lists(), userId] as const,
  details: () => [...videoQueryKeys.all, 'detail'] as const,
  detail: (userId: string, videoId: string) =>
    [...videoQueryKeys.details(), userId, videoId] as const,
};
