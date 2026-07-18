import { parseApiMode } from '@/api/config/apiMode';

// EXPO_PUBLIC_* values are embedded in the client bundle and must never contain secrets.
export type HomeMockScenario = 'success' | 'empty' | 'error' | 'video-error' | 'statistics-error';
export type UploadMockScenario = 'success' | 'fail-once';
export type VideoListMockScenario = 'success' | 'empty' | 'error';

const homeMockScenarios: HomeMockScenario[] = [
  'success',
  'empty',
  'error',
  'video-error',
  'statistics-error',
];

export function parseHomeMockScenario(value: string | undefined): HomeMockScenario {
  return homeMockScenarios.includes(value as HomeMockScenario)
    ? (value as HomeMockScenario)
    : 'success';
}

export function parseUploadMockScenario(value: string | undefined): UploadMockScenario {
  return value === 'fail-once' ? 'fail-once' : 'success';
}

export function parseVideoListMockScenario(value: string | undefined): VideoListMockScenario {
  return value === 'empty' || value === 'error' ? value : 'success';
}

export const env = {
  homeMockScenario: parseHomeMockScenario(process.env.EXPO_PUBLIC_HOME_MOCK_SCENARIO),
  uploadMockScenario: parseUploadMockScenario(process.env.EXPO_PUBLIC_UPLOAD_MOCK_SCENARIO),
  videoListMockScenario: parseVideoListMockScenario(
    process.env.EXPO_PUBLIC_VIDEO_LIST_MOCK_SCENARIO,
  ),
} as const;

export const mobileApiMode = parseApiMode({
  useMock: process.env.EXPO_PUBLIC_USE_MOCK,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  isDevelopment: typeof __DEV__ !== 'undefined' && __DEV__,
});
