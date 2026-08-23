import { z } from 'zod';

import { createApiError } from './errors';
import type { AccessTokenProvider } from './token/AccessTokenStore';

export type HttpRequest<T> = {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  responseSchema?: z.ZodType<T>;
  allowEmptyResponse?: boolean;
};

export type HttpClient = {
  request<T>(request: HttpRequest<T>): Promise<T>;
};

const errorEnvelopeSchema = z.object({ request_id: z.string().optional() });

function errorCode(status: number): string {
  if (status === 400) return 'REAL_API_BAD_REQUEST';
  if (status === 401) return 'REAL_API_UNAUTHORIZED';
  if (status === 403) return 'REAL_API_FORBIDDEN';
  if (status === 404) return 'REAL_API_NOT_FOUND';
  if (status === 409) return 'REAL_API_CONFLICT';
  if (status === 429) return 'REAL_API_RATE_LIMITED';
  if (status >= 500) return 'REAL_API_SERVER_ERROR';
  return 'REAL_API_REQUEST_FAILED';
}

export function createHttpClient(input: {
  baseUrl: string;
  fetchImpl: typeof fetch;
  accessTokenProvider: AccessTokenProvider;
}): HttpClient {
  return {
    async request<T>(request: HttpRequest<T>): Promise<T> {
      if (!request.path.startsWith('/') || request.path.startsWith('//')) {
        throw createApiError('REAL_API_REQUEST_FAILED', { retryable: false });
      }
      const url = new URL(`${input.baseUrl}${request.path}`);
      for (const [key, value] of Object.entries(request.query ?? {})) {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      }
      const headers = new Headers({ Accept: 'application/json' });
      const token = input.accessTokenProvider.getAccessToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      let body: string | undefined;
      if (request.body !== undefined) {
        headers.set('Content-Type', 'application/json');
        body = JSON.stringify(request.body);
      }
      let response: Response;
      try {
        response = await input.fetchImpl(url, {
          method: request.method,
          headers,
          body,
          signal: request.signal,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error;
        throw createApiError('REAL_API_REQUEST_FAILED');
      }
      if (!response.ok) {
        let requestId: string | undefined;
        try {
          const parsed = errorEnvelopeSchema.safeParse(await response.json());
          requestId = parsed.success ? parsed.data.request_id : undefined;
        } catch {
          requestId = undefined;
        }
        throw createApiError(errorCode(response.status), { requestId });
      }
      if (response.status === 204 || request.allowEmptyResponse) return undefined as T;
      if (
        !(response.headers.get('content-type') ?? '').toLowerCase().includes('application/json')
      ) {
        throw createApiError('REAL_API_RESPONSE_INVALID');
      }
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw createApiError('REAL_API_RESPONSE_INVALID');
      }
      if (!request.responseSchema) return payload as T;
      const parsed = request.responseSchema.safeParse(payload);
      if (!parsed.success) throw createApiError('REAL_API_RESPONSE_INVALID');
      return parsed.data;
    },
  };
}
