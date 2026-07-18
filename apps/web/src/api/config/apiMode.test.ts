import { describe, expect, it } from 'vitest';

import { parseApiMode } from './apiMode';

describe('parseApiMode', () => {
  it.each([undefined, '', ' ', 'true'])('keeps zero-config Mock for %s', (useMock) => {
    expect(parseApiMode({ useMock, apiBaseUrl: '', isDevelopment: true })).toEqual({
      status: 'ready',
      mode: 'mock',
    });
  });

  it.each(['TRUE', 'False', '1', 'yes'])('rejects invalid mode %s', (useMock) => {
    expect(parseApiMode({ useMock, apiBaseUrl: '', isDevelopment: true })).toMatchObject({
      status: 'invalid',
      error: { code: 'API_MODE_INVALID' },
    });
  });

  it('validates and normalizes Real URLs', () => {
    expect(
      parseApiMode({
        useMock: 'false',
        apiBaseUrl: 'https://api.example.com/api/v1/',
        isDevelopment: false,
      }),
    ).toEqual({
      status: 'ready',
      mode: 'real',
      apiBaseUrl: 'https://api.example.com/api/v1',
    });
    expect(parseApiMode({ useMock: 'false', apiBaseUrl: '', isDevelopment: true })).toMatchObject({
      error: { code: 'REAL_API_BASE_URL_MISSING' },
    });
  });

  it.each([
    'relative/api',
    'ftp://localhost/api/v1',
    'https://user:pass@example.com/api/v1',
    'https://example.com/api/v1?query=1',
    'https://example.com/api/v1#hash',
    'http://example.com/api/v1',
  ])('rejects unsafe URL %s', (apiBaseUrl) => {
    expect(parseApiMode({ useMock: 'false', apiBaseUrl, isDevelopment: true })).toMatchObject({
      error: { code: 'REAL_API_BASE_URL_INVALID' },
    });
  });

  it.each([
    'http://localhost:8000/api/v1',
    'http://127.0.0.1:8000/api/v1',
    'http://[::1]:8000/api/v1',
  ])('allows development loopback %s', (apiBaseUrl) => {
    expect(parseApiMode({ useMock: 'false', apiBaseUrl, isDevelopment: true })).toMatchObject({
      status: 'ready',
      mode: 'real',
    });
  });

  it('rejects production HTTP', () => {
    expect(
      parseApiMode({
        useMock: 'false',
        apiBaseUrl: 'http://localhost:8000/api/v1',
        isDevelopment: false,
      }),
    ).toMatchObject({ status: 'invalid' });
  });
});
