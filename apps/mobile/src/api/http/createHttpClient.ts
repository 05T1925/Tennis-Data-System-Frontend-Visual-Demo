import { z } from 'zod';

import { createApiError } from '../errors';
import type { HttpClient, HttpClientDependencies, HttpRequest } from './HttpClient';

const errorEnvelopeSchema = z.object({
  error: z.object({ code: z.string().optional(), message: z.string().optional() }).optional(),
  request_id: z.string().optional(),
});

function statusCode(status: number): string {
  if (status === 400) return 'REAL_API_BAD_REQUEST';
  if (status === 401) return 'REAL_API_UNAUTHORIZED';
  if (status === 403) return 'REAL_API_FORBIDDEN';
  if (status === 404) return 'REAL_API_NOT_FOUND';
  if (status === 409) return 'REAL_API_CONFLICT';
  if (status === 429) return 'REAL_API_RATE_LIMITED';
  if (status >= 500) return 'REAL_API_SERVER_ERROR';
  return 'REAL_API_REQUEST_FAILED';
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw createApiError('REAL_API_RESPONSE_INVALID');
  }
  try {
    return await response.json();
  } catch {
    throw createApiError('REAL_API_RESPONSE_INVALID');
  }
}

export function createHttpClient(dependencies: HttpClientDependencies): HttpClient {
  return {
    async request<T>(request: HttpRequest<T>): Promise<T> {
      if (!request.path.startsWith('/') || request.path.startsWith('//')) {
        throw createApiError('REAL_API_REQUEST_FAILED', { retryable: false });
      }
      const url = new URL(`${dependencies.baseUrl}${request.path}`);
      for (const [key, value] of Object.entries(request.query ?? {})) {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      }
      const headers = new Headers({ Accept: 'application/json', ...request.headers });
      const token = dependencies.accessTokenProvider.getAccessToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      let body: string | undefined;
      if (request.body !== undefined) {
        headers.set('Content-Type', 'application/json');
        body = JSON.stringify(request.body);
      }

      let response: Response;
      try {
        response = await dependencies.fetchImpl(url, {
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
        throw createApiError(statusCode(response.status), { requestId });
      }
      if (response.status === 204 || request.allowEmptyResponse) return undefined as T;
      const payload = await parseJson(response);
      if (!request.responseSchema) return payload as T;
      const parsed = request.responseSchema.safeParse(payload);
      if (!parsed.success) throw createApiError('REAL_API_RESPONSE_INVALID');
      return parsed.data;
    },
  };
}
