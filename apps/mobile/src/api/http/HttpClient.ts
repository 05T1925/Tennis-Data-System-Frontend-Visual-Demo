import type { z } from 'zod';

import type { AccessTokenProvider } from '../token/AccessTokenStore';

export type HttpMethod = 'GET' | 'POST' | 'DELETE';
export type HttpQuery = Record<string, string | number | boolean | null | undefined>;

export type HttpRequest<T> = {
  method: HttpMethod;
  path: string;
  query?: HttpQuery;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  responseSchema?: z.ZodType<T>;
  allowEmptyResponse?: boolean;
};

export interface HttpClient {
  request<T>(request: HttpRequest<T>): Promise<T>;
}

export type HttpClientDependencies = {
  baseUrl: string;
  fetchImpl: typeof fetch;
  accessTokenProvider: AccessTokenProvider;
};
