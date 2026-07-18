import type { AppError } from '@tennis/shared-types';

import { createApiError } from '../errors';

export type ApiModeConfig =
  | { status: 'ready'; mode: 'mock' }
  | { status: 'ready'; mode: 'real'; apiBaseUrl: string }
  | { status: 'invalid'; requestedMode: 'real' | null; error: AppError };

export type ApiModeInput = {
  useMock: string | undefined;
  apiBaseUrl: string | undefined;
  isDevelopment: boolean;
};

function invalid(code: string, requestedMode: 'real' | null): ApiModeConfig {
  return { status: 'invalid', requestedMode, error: createApiError(code, { retryable: false }) };
}

function isLoopback(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname.toLowerCase());
}

export function parseApiMode(input: ApiModeInput): ApiModeConfig {
  const rawMode = input.useMock?.trim() ?? '';
  if (rawMode === '' || rawMode === 'true') return { status: 'ready', mode: 'mock' };
  if (rawMode !== 'false') return invalid('API_MODE_INVALID', null);

  const rawBaseUrl = input.apiBaseUrl?.trim() ?? '';
  if (!rawBaseUrl) return invalid('REAL_API_BASE_URL_MISSING', 'real');

  let url: URL;
  try {
    url = new URL(rawBaseUrl);
  } catch {
    return invalid('REAL_API_BASE_URL_INVALID', 'real');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== '' ||
    (!input.isDevelopment && url.protocol !== 'https:') ||
    (url.protocol === 'http:' && !isLoopback(url.hostname))
  ) {
    return invalid('REAL_API_BASE_URL_INVALID', 'real');
  }
  return { status: 'ready', mode: 'real', apiBaseUrl: rawBaseUrl.replace(/\/+$/, '') };
}
