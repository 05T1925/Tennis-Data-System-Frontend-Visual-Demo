import type { AppError } from '@tennis/shared-types';

import { createApiError } from '../errors';

export type ApiModeConfig =
  | { status: 'ready'; mode: 'mock' }
  | { status: 'ready'; mode: 'real'; apiBaseUrl: string }
  | { status: 'invalid'; requestedMode: 'real' | null; error: AppError };

export function parseApiMode(input: {
  useMock: string | undefined;
  apiBaseUrl: string | undefined;
  isDevelopment: boolean;
}): ApiModeConfig {
  const rawMode = input.useMock?.trim() ?? '';
  if (rawMode === '' || rawMode === 'true') return { status: 'ready', mode: 'mock' };
  if (rawMode !== 'false') {
    return { status: 'invalid', requestedMode: null, error: createApiError('API_MODE_INVALID') };
  }
  const rawBaseUrl = input.apiBaseUrl?.trim() ?? '';
  if (!rawBaseUrl) {
    return {
      status: 'invalid',
      requestedMode: 'real',
      error: createApiError('REAL_API_BASE_URL_MISSING'),
    };
  }
  let url: URL;
  try {
    url = new URL(rawBaseUrl);
  } catch {
    return {
      status: 'invalid',
      requestedMode: 'real',
      error: createApiError('REAL_API_BASE_URL_INVALID'),
    };
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase());
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== '' ||
    (!input.isDevelopment && url.protocol !== 'https:') ||
    (url.protocol === 'http:' && !loopback)
  ) {
    return {
      status: 'invalid',
      requestedMode: 'real',
      error: createApiError('REAL_API_BASE_URL_INVALID'),
    };
  }
  return { status: 'ready', mode: 'real', apiBaseUrl: rawBaseUrl.replace(/\/+$/, '') };
}
