export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  error?: never;
  requestId?: string;
}

export interface ApiFailureResponse {
  success: false;
  data: null;
  message?: string;
  error: ApiErrorPayload;
  requestId?: string;
}

/** Transport-level discriminated response union shared by Mock and future Real services. */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailureResponse;

/** Normalized frontend error. technicalMessage must not be shown directly to end users. */
export interface AppError {
  code: string;
  userMessage: string;
  technicalMessage?: string;
  retryable: boolean;
  requestId?: string;
  details?: unknown;
}
