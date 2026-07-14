// EXPO_PUBLIC_* values are embedded in the client bundle and must never contain secrets.
export type HomeMockScenario = 'success' | 'empty' | 'error' | 'video-error' | 'statistics-error';

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

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  useMock: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
  homeMockScenario: parseHomeMockScenario(process.env.EXPO_PUBLIC_HOME_MOCK_SCENARIO),
} as const;
