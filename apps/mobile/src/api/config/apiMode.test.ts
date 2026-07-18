import { describe, expect, it } from 'vitest';

import { parseApiMode } from './apiMode';

describe('parseApiMode', () => {
  it.each([undefined, '', '   ', 'true'])(`defaults %s to Mock`, (useMock) => {
    expect(parseApiMode({ useMock, apiBaseUrl: undefined, isDevelopment: true })).toEqual({
      status: 'ready',
      mode: 'mock',
    });
  });

  it.each(['TRUE', 'False', '1', '0', 'yes', 'no'])('rejects invalid mode %s', (useMock) => {
    expect(parseApiMode({ useMock, apiBaseUrl: '', isDevelopment: true })).toMatchObject({
      status: 'invalid',
      error: { code: 'API_MODE_INVALID' },
    });
  });

  it('requires a Real base URL', () => {
    expect(parseApiMode({ useMock: 'false', apiBaseUrl: ' ', isDevelopment: true })).toMatchObject({
      status: 'invalid',
      requestedMode: 'real',
      error: { code: 'REAL_API_BASE_URL_MISSING' },
    });
  });

  it.each([
    'api/v1',
    'ftp://localhost/api/v1',
    'https://user:password@example.com/api/v1',
    'https://example.com/api/v1?x=1',
    'https://example.com/api/v1#hash',
    'http://example.com/api/v1',
  ])('rejects unsafe Real URL %s', (apiBaseUrl) => {
    expect(parseApiMode({ useMock: 'false', apiBaseUrl, isDevelopment: true })).toMatchObject({
      status: 'invalid',
      error: { code: 'REAL_API_BASE_URL_INVALID' },
    });
  });

  it.each([
    'http://localhost:8000/api/v1',
    'http://127.0.0.1:8000/api/v1',
    'http://[::1]:8000/api/v1',
    'https://api.example.com/api/v1',
  ])('accepts valid Real URL %s', (apiBaseUrl) => {
    expect(parseApiMode({ useMock: 'false', apiBaseUrl, isDevelopment: true })).toEqual({
      status: 'ready',
      mode: 'real',
      apiBaseUrl,
    });
  });

  it('normalizes trailing slashes and rejects production HTTP', () => {
    expect(
      parseApiMode({
        useMock: 'false',
        apiBaseUrl: 'https://api.example.com/api/v1///',
        isDevelopment: false,
      }),
    ).toMatchObject({ apiBaseUrl: 'https://api.example.com/api/v1' });
    expect(
      parseApiMode({
        useMock: 'false',
        apiBaseUrl: 'http://localhost:8000/api/v1',
        isDevelopment: false,
      }),
    ).toMatchObject({ status: 'invalid' });
  });
});
