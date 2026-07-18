// VITE_* values are embedded in the client bundle and must never contain secrets.
export type WebVideoMockScenario = 'success' | 'empty' | 'error-once';

function parseWebVideoMockScenario(value: string | undefined): WebVideoMockScenario {
  return value === 'empty' || value === 'error-once' ? value : 'success';
}

export const env = {
  webVideoMockScenario: parseWebVideoMockScenario(import.meta.env.VITE_WEB_VIDEO_MOCK_SCENARIO),
} as const;

export const webApiMode = parseApiMode({
  useMock: import.meta.env.VITE_USE_MOCK,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  isDevelopment: import.meta.env.DEV,
});
import { parseApiMode } from '../api/config/apiMode';
