import type { AppError } from '@tennis/shared-types';

export type ClipboardWriter = { writeText(value: string): Promise<void> };

function clipboardError(): AppError {
  return {
    code: 'WEB_CLIPBOARD_UNAVAILABLE',
    userMessage: '无法复制视频 ID，请检查浏览器权限后重试。',
    retryable: true,
  };
}

export async function copyTextToClipboard(
  value: string,
  clipboard: ClipboardWriter | undefined = navigator.clipboard,
): Promise<void> {
  if (clipboard === undefined || typeof clipboard.writeText !== 'function') {
    throw clipboardError();
  }
  try {
    await clipboard.writeText(value);
  } catch {
    throw clipboardError();
  }
}
