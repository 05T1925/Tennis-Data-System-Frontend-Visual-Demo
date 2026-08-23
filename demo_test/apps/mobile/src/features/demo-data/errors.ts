import type { AppError } from '@tennis/shared-types';

const messages: Record<string, string> = {
  VIDEO_NOT_FOUND: '未找到该视频。',
  INVALID_VIDEO_INPUT: '视频信息不完整或格式不正确。',
  UPLOAD_NOT_ALLOWED: '当前视频状态不允许开始上传。',
  ANALYSIS_NOT_FOUND: '未找到该视频的分析任务。',
  ANALYSIS_NOT_READY: '视频上传完成后才能开始分析。',
  ANALYSIS_RETRY_NOT_ALLOWED: '当前分析任务不能重试。',
  DEMO_DATA_LOAD_FAILED: '演示数据读取失败，请重试。',
  DEMO_DATA_SAVE_FAILED: '演示数据保存失败，请重试。',
  INVALID_STORED_DEMO_DATA: '本地演示数据无效，已恢复默认数据。',
};

export function createDemoDataError(
  code: string,
  options: { technicalMessage?: string; retryable?: boolean } = {},
): AppError {
  return {
    code,
    userMessage: messages[code] ?? '演示数据操作失败，请重试。',
    technicalMessage: options.technicalMessage,
    retryable: options.retryable ?? true,
  };
}

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new Error('Operation aborted.');
}

export function waitForDemoDelay(delayMs: number, signal?: AbortSignal) {
  throwIfAborted(signal);

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      callback();
    };
    const onAbort = () => {
      clearTimeout(timeoutId);
      finish(() => reject(new Error('Operation aborted.')));
    };
    const timeoutId = setTimeout(() => finish(resolve), delayMs);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
