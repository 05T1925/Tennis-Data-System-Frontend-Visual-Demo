import type { AppError } from '@tennis/shared-types';

export const VIDEO_LIST_MOCK_DELAY_MS = 350;

export function createVideoListQueryError(): AppError {
  return {
    code: 'MOCK_VIDEO_LIST_QUERY_FAILED',
    userMessage: '视频列表暂时加载失败，请重试。',
    technicalMessage: 'Deterministic first-request failure from the video list Mock scenario.',
    retryable: true,
  };
}
