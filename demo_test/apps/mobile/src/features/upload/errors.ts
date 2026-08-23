import type { AppError } from '@tennis/shared-types';

export type VideoAssetErrorCode =
  | 'INVALID_VIDEO_TYPE'
  | 'EMPTY_VIDEO_URI'
  | 'MISSING_FILE_SIZE'
  | 'EMPTY_VIDEO_FILE'
  | 'VIDEO_TOO_LARGE'
  | 'INVALID_VIDEO_DURATION';

const messages: Record<VideoAssetErrorCode, string> = {
  INVALID_VIDEO_TYPE: '请选择 MP4 或 MOV 格式的视频。',
  EMPTY_VIDEO_URI: '无法读取所选视频，请尝试重新选择。',
  MISSING_FILE_SIZE: '无法读取该视频的文件大小，请尝试重新选择。',
  EMPTY_VIDEO_FILE: '该视频文件为空，无法上传。',
  VIDEO_TOO_LARGE: '视频不能超过 500 MB，请选择较短的视频。',
  INVALID_VIDEO_DURATION: '无法读取有效的视频时长，请尝试重新选择。',
};

export class VideoAssetError extends Error {
  constructor(
    readonly code: VideoAssetErrorCode,
    readonly userMessage = messages[code],
  ) {
    super(code);
    this.name = 'VideoAssetError';
  }
}

function isAppError(error: unknown): error is AppError {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as Partial<AppError>;
  return typeof candidate.userMessage === 'string' && typeof candidate.code === 'string';
}

export function getSafeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof VideoAssetError) return error.userMessage;
  if (isAppError(error) && error.userMessage.trim()) return error.userMessage;
  return fallback;
}
