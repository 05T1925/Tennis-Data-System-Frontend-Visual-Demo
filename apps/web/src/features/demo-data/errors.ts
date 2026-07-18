import type { AppError } from '@tennis/shared-types';

const messages: Record<string, string> = {
  WEB_DEMO_DATA_LOAD_FAILED: 'Web 演示数据读取失败，请重试。',
  WEB_DEMO_DATA_SAVE_FAILED: 'Web 演示数据保存失败，请重试。',
  WEB_VIDEO_NOT_FOUND: '未找到该视频。',
  WEB_VIDEO_ACCESS_DENIED: '当前 Demo 管理员身份无权执行此操作。',
  WEB_VIDEO_LIST_FAILED: '视频列表暂时加载失败，请重试。',
  WEB_ANALYSIS_NOT_FOUND: '当前视频没有分析任务。',
  WEB_ANALYSIS_RETRY_NOT_ALLOWED: '当前分析任务不能重新提交。',
  WEB_ANALYSIS_LOAD_FAILED: '分析数据暂时加载失败，请重试。',
  WEB_DEMO_JSON_INVALID: 'Demo JSON 暂时无法生成。',
  WEB_DEMO_DOWNLOAD_FAILED: 'Demo JSON 暂时无法下载，请重试。',
};

export function createWebDemoError(
  code: string,
  options: { retryable?: boolean; technicalMessage?: string } = {},
): AppError {
  return {
    code,
    userMessage: messages[code] ?? 'Web 演示数据操作失败，请重试。',
    retryable: options.retryable ?? true,
    technicalMessage: options.technicalMessage,
  };
}

export function isAppError(value: unknown): value is AppError {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<AppError>;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.userMessage === 'string' &&
    typeof candidate.retryable === 'boolean'
  );
}

export function normalizeWebDemoError(error: unknown, code: string): AppError {
  if (isAppError(error)) return error;
  return createWebDemoError(code, {
    technicalMessage: error instanceof Error ? error.message : 'Unknown Web demo data error.',
  });
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const error = new Error('Operation aborted.');
  error.name = 'AbortError';
  throw error;
}
