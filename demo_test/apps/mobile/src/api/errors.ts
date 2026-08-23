import type { AppError } from '@tennis/shared-types';

const messages: Record<string, string> = {
  API_MODE_INVALID: 'API 运行模式配置无效，请联系开发人员。',
  REAL_API_BASE_URL_MISSING: '当前真实 API 配置不完整，请联系开发人员。',
  REAL_API_BASE_URL_INVALID: '当前真实 API 配置无效，请联系开发人员。',
  REAL_API_NOT_CONFIGURED: '当前真实 API 配置不完整，请联系开发人员。',
  REAL_API_BAD_REQUEST: '请求信息不正确，请检查后重试。',
  REAL_API_UNAUTHORIZED: '登录状态已失效，请重新登录。',
  REAL_API_FORBIDDEN: '当前身份无权执行此操作。',
  REAL_API_NOT_FOUND: '请求的数据不存在。',
  REAL_API_CONFLICT: '当前数据状态已变化，请刷新后重试。',
  REAL_API_RATE_LIMITED: '请求过于频繁，请稍后重试。',
  REAL_API_SERVER_ERROR: '服务暂时不可用，请稍后重试。',
  REAL_API_REQUEST_FAILED: '网络请求失败，请检查连接后重试。',
  REAL_API_RESPONSE_INVALID: '服务返回的数据暂时无法使用，请稍后重试。',
  REAL_AUTH_NOT_CONFIGURED: '当前真实认证配置不完整，请联系开发人员。',
  REAL_UPLOAD_TRANSPORT_NOT_CONFIGURED: '当前上传方式尚未配置。',
  REAL_RETRY_CONTRACT_NOT_CONFIGURED: '当前重试接口契约尚未确认。',
  REAL_STATISTICS_CONTRACT_NOT_CONFIGURED: '当前统计接口契约尚未确认。',
  REAL_CV_CONTRACT_NOT_CONFIGURED: '当前 CV 数据接口契约尚未确认。',
  REAL_LOGS_CONTRACT_NOT_CONFIGURED: '当前任务日志接口契约尚未确认。',
};

export function createApiError(
  code: string,
  options: { technicalMessage?: string; retryable?: boolean; requestId?: string } = {},
): AppError {
  return {
    code,
    userMessage: messages[code] ?? '服务暂时不可用，请稍后重试。',
    technicalMessage: options.technicalMessage,
    retryable: options.retryable ?? !['REAL_API_BAD_REQUEST', 'REAL_API_FORBIDDEN'].includes(code),
    requestId: options.requestId,
  };
}

export function throwUnsupportedApiOperation(code: string): never {
  throw createApiError(code, { retryable: false });
}
