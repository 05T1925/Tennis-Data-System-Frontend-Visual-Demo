export const uploadQueryKeys = {
  videoList: (userId: string) => ['videos', 'list', userId] as const,
  videoDetail: (userId: string, videoId: string) => ['videos', 'detail', userId, videoId] as const,
  analysisTask: (userId: string, videoId: string) => ['analysis', 'task', userId, videoId] as const,
};
