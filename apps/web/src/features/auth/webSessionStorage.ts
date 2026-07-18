import type { AppError } from '@tennis/shared-types';
import { z } from 'zod';

import { demoWebAdmin } from './mockWebAuth';
import { WEB_AUTH_SESSION_VERSION, type WebAuthSession } from './types';

const WEB_SESSION_KEY = 'tennis.web.admin.session.v1';

type LegacyStoredWebSession = {
  version: 1;
  userId: string;
};

const userSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email().optional(),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin', 'developer']),
  avatarUrl: z.string().optional(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
const sessionSchema = z.object({
  version: z.literal(WEB_AUTH_SESSION_VERSION),
  mode: z.enum(['mock', 'real']),
  accessToken: z.string().min(1),
  expiresAt: z.iso.datetime({ offset: true }).optional(),
  user: userSchema,
});

function storageError(action: string): AppError {
  return {
    code: `WEB_SESSION_${action.toUpperCase()}_FAILED`,
    userMessage: '无法访问当前标签页的登录会话，请检查浏览器设置后重试。',
    retryable: true,
  };
}

function isLegacyStoredWebSession(value: unknown): value is LegacyStoredWebSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const session = value as Record<string, unknown>;
  return session.version === 1 && session.userId === demoWebAdmin.id;
}

function removeInvalidSession() {
  try {
    window.sessionStorage.removeItem(WEB_SESSION_KEY);
  } catch {
    // Invalid data still resolves to an unauthenticated state when cleanup is unavailable.
  }
}

export function restoreWebSession(mode: 'mock' | 'real' | null): WebAuthSession | null {
  let rawSession: string | null;
  try {
    rawSession = window.sessionStorage.getItem(WEB_SESSION_KEY);
  } catch {
    throw storageError('read');
  }

  if (rawSession === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(rawSession);
    const current = sessionSchema.safeParse(parsed);
    if (current.success && current.data.mode === mode) return current.data;
    if (mode === 'mock' && isLegacyStoredWebSession(parsed)) {
      const migrated: WebAuthSession = {
        version: WEB_AUTH_SESSION_VERSION,
        mode: 'mock',
        accessToken: 'mock-web-admin-session-token-v2',
        user: demoWebAdmin,
      };
      window.sessionStorage.setItem(WEB_SESSION_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    removeInvalidSession();
    return null;
  }

  removeInvalidSession();
  return null;
}

export function saveWebSession(session: WebAuthSession): void {
  try {
    window.sessionStorage.setItem(WEB_SESSION_KEY, JSON.stringify(sessionSchema.parse(session)));
  } catch {
    throw storageError('write');
  }
}

export function clearWebSession(): void {
  try {
    window.sessionStorage.removeItem(WEB_SESSION_KEY);
  } catch {
    throw storageError('clear');
  }
}
