import type { AppError, User } from '@tennis/shared-types';

import type { WebLoginCredentials } from './types';

export const DEMO_ADMIN_EMAIL = 'admin@tennis.local';
export const DEMO_ADMIN_PASSWORD = 'TennisAdmin123!';

export const demoWebAdmin: User = {
  id: 'demo-web-admin',
  displayName: 'Demo 管理员',
  email: DEMO_ADMIN_EMAIL,
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

function createAuthError(code: string, userMessage: string): AppError {
  return { code, userMessage, retryable: true };
}

export async function mockWebLogin(credentials: WebLoginCredentials): Promise<User> {
  await wait(500);

  const email = credentials.email.trim().toLowerCase();
  if (email !== DEMO_ADMIN_EMAIL || credentials.password !== DEMO_ADMIN_PASSWORD) {
    throw createAuthError('WEB_AUTH_INVALID_CREDENTIALS', '邮箱或密码不正确。');
  }

  return demoWebAdmin;
}

export async function mockWebLogout(): Promise<void> {
  await wait(250);
}
