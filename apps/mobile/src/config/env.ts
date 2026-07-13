// EXPO_PUBLIC_* values are embedded in the client bundle and must never contain secrets.
export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  useMock: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
} as const;
