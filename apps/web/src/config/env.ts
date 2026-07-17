// VITE_* values are embedded in the client bundle and must never contain secrets.
export type WebVideoMockScenario = 'success' | 'empty' | 'error-once';

function parseWebVideoMockScenario(value: string | undefined): WebVideoMockScenario {
  return value === 'empty' || value === 'error-once' ? value : 'success';
}

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  webVideoMockScenario: parseWebVideoMockScenario(import.meta.env.VITE_WEB_VIDEO_MOCK_SCENARIO),
} as const;
