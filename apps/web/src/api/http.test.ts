import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createHttpClient } from './http';
import { AccessTokenStore } from './token/AccessTokenStore';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('Web HttpClient', () => {
  it('supports query, POST body, Bearer and schema validation', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(json({ data: 'ok' }));
    const tokens = new AccessTokenStore();
    tokens.setAccessToken('stub-access-token');
    const client = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl,
      accessTokenProvider: tokens,
    });
    await client.request({
      method: 'POST',
      path: '/videos',
      query: { page: 1, ignored: undefined },
      body: { value: true },
      responseSchema: z.object({ data: z.literal('ok') }),
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe('https://api.example.com/api/v1/videos?page=1');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer stub-access-token');
    expect(init?.body).toBe(JSON.stringify({ value: true }));
  });

  it.each([
    [400, 'REAL_API_BAD_REQUEST'],
    [401, 'REAL_API_UNAUTHORIZED'],
    [403, 'REAL_API_FORBIDDEN'],
    [404, 'REAL_API_NOT_FOUND'],
    [409, 'REAL_API_CONFLICT'],
    [429, 'REAL_API_RATE_LIMITED'],
    [500, 'REAL_API_SERVER_ERROR'],
  ])('maps %s without exposing the response', async (status, code) => {
    const client = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(json({ request_id: 'req-web' }, status)),
      accessTokenProvider: new AccessTokenStore(),
    });
    await expect(client.request({ method: 'GET', path: '/videos' })).rejects.toMatchObject({
      code,
      requestId: 'req-web',
    });
  });

  it('supports 204, invalid responses, network errors and AbortError', async () => {
    const tokenStore = new AccessTokenStore();
    const noContent = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 })),
      accessTokenProvider: tokenStore,
    });
    await expect(
      noContent.request({ method: 'DELETE', path: '/videos/1', allowEmptyResponse: true }),
    ).resolves.toBeUndefined();
    const invalid = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response('text')),
      accessTokenProvider: tokenStore,
    });
    await expect(invalid.request({ method: 'GET', path: '/videos' })).rejects.toMatchObject({
      code: 'REAL_API_RESPONSE_INVALID',
    });
    const failed = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl: vi.fn<typeof fetch>().mockRejectedValue(new Error('private response body')),
      accessTokenProvider: tokenStore,
    });
    await expect(failed.request({ method: 'GET', path: '/videos' })).rejects.toMatchObject({
      code: 'REAL_API_REQUEST_FAILED',
    });
    const abortError = new Error('abort');
    abortError.name = 'AbortError';
    const aborted = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl: vi.fn<typeof fetch>().mockRejectedValue(abortError),
      accessTokenProvider: tokenStore,
    });
    await expect(aborted.request({ method: 'GET', path: '/videos' })).rejects.toBe(abortError);
  });
});
