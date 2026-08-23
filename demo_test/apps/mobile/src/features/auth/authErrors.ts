import type { AppError } from '@tennis/shared-types';

const messages: Record<string, string> = {
  INVALID_CREDENTIALS: '邮箱或密码不正确，请检查后重试。',
  MOCK_NETWORK_ERROR: '模拟网络连接失败，请稍后重试。',
  SESSION_SAVE_FAILED: '登录信息保存失败，请重试。',
  SESSION_CLEAR_FAILED: '退出失败，本地登录信息未能清除，请重试。',
  SESSION_READ_FAILED: '本地登录信息读取失败，请重新登录。',
  INVALID_STORED_SESSION: '本地登录信息已失效，请重新登录。',
  SESSION_RESET_FAILED: '失效的本地登录信息无法清理，请稍后重试。',
  UNKNOWN_AUTH_ERROR: '认证操作失败，请稍后重试。',
};

export function createAuthError(
  code: string,
  options: { technicalMessage?: string; retryable?: boolean } = {},
): AppError {
  return {
    code,
    userMessage: messages[code] ?? messages.UNKNOWN_AUTH_ERROR,
    technicalMessage: options.technicalMessage,
    retryable: options.retryable ?? true,
  };
}

export function isAppError(error: unknown): error is AppError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as Partial<AppError>;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.userMessage === 'string' &&
    typeof candidate.retryable === 'boolean'
  );
}

export function toAuthError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  return createAuthError('UNKNOWN_AUTH_ERROR', {
    technicalMessage: error instanceof Error ? error.message : 'Unknown auth error',
  });
}
