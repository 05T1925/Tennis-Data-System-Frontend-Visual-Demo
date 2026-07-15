export const analysisQueryKeys = {
  all: ['analysis'] as const,
  tasks: (userId: string) => [...analysisQueryKeys.all, 'task', userId] as const,
  task: (userId: string, videoId: string) => [...analysisQueryKeys.tasks(userId), videoId] as const,
};

export const analysisMutationKeys = {
  retry: (userId: string) => [...analysisQueryKeys.all, 'retry', userId] as const,
};
