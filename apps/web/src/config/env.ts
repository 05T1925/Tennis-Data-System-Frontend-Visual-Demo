// VITE_* values are embedded in the client bundle and must never contain secrets.
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
} as const;
