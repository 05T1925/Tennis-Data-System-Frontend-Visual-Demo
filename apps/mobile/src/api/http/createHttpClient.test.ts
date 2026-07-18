import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AccessTokenStore } from '../token/AccessTokenStore';
import { createHttpClient } from './createHttpClient';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createHttpClient', () => {
  it('builds query, JSON body and Bearer headers', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ ok: true }));
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
      query: { page: 1, omitted: undefined },
      body: { title: 'Training' },
      responseSchema: z.object({ ok: z.literal(true) }),
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe('https://api.example.com/api/v1/videos?page=1');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer stub-access-token');
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
    expect(init?.body).toBe(JSON.stringify({ title: 'Training' }));
  });

  it('supports DELETE 204', async () => {
    const client = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 })),
      accessTokenProvider: new AccessTokenStore(),
    });
    await expect(
      client.request({ method: 'DELETE', path: '/videos/video-1', allowEmptyResponse: true }),
    ).resolves.toBeUndefined();
  });

  it.each([
    [400, 'REAL_API_BAD_REQUEST'],
    [401, 'REAL_API_UNAUTHORIZED'],
    [403, 'REAL_API_FORBIDDEN'],
    [404, 'REAL_API_NOT_FOUND'],
    [409, 'REAL_API_CONFLICT'],
    [429, 'REAL_API_RATE_LIMITED'],
    [500, 'REAL_API_SERVER_ERROR'],
  ])('maps HTTP %s safely', async (status, code) => {
    const client = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl: vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          jsonResponse({ error: { message: 'private body' }, request_id: 'req-1' }, status),
        ),
      accessTokenProvider: new AccessTokenStore(),
    });
    await expect(client.request({ method: 'GET', path: '/videos' })).rejects.toMatchObject({
      code,
      requestId: 'req-1',
    });
  });

  it('rejects invalid JSON, network errors and preserves AbortError', async () => {
    const invalidClient = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl: vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response('text', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
        ),
      accessTokenProvider: new AccessTokenStore(),
    });
    await expect(invalidClient.request({ method: 'GET', path: '/videos' })).rejects.toMatchObject({
      code: 'REAL_API_RESPONSE_INVALID',
    });

    const networkClient = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl: vi.fn<typeof fetch>().mockRejectedValue(new Error('token=secret response body')),
      accessTokenProvider: new AccessTokenStore(),
    });
    await expect(networkClient.request({ method: 'GET', path: '/videos' })).rejects.toEqual(
      expect.not.objectContaining({ userMessage: expect.stringContaining('secret') }),
    );

    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    const abortClient = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl: vi.fn<typeof fetch>().mockRejectedValue(abortError),
      accessTokenProvider: new AccessTokenStore(),
    });
    await expect(abortClient.request({ method: 'GET', path: '/videos' })).rejects.toBe(abortError);
  });
});
