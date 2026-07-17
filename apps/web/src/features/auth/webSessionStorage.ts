import type { AppError, User } from '@tennis/shared-types';

import { demoWebAdmin } from './mockWebAuth';

const WEB_SESSION_KEY = 'tennis.web.admin.session.v1';
const WEB_SESSION_VERSION = 1;

type StoredWebSession = {
  version: 1;
  userId: string;
};

function storageError(action: string): AppError {
  return {
    code: `WEB_SESSION_${action.toUpperCase()}_FAILED`,
    userMessage: '无法访问当前标签页的登录会话，请检查浏览器设置后重试。',
    retryable: true,
  };
}

function isStoredWebSession(value: unknown): value is StoredWebSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const session = value as Record<string, unknown>;
  return session.version === WEB_SESSION_VERSION && session.userId === demoWebAdmin.id;
}

function removeInvalidSession() {
  try {
    window.sessionStorage.removeItem(WEB_SESSION_KEY);
  } catch {
    // Invalid data still resolves to an unauthenticated state when cleanup is unavailable.
  }
}

export function restoreWebSession(): User | null {
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
    if (isStoredWebSession(parsed)) {
      return demoWebAdmin;
    }
  } catch {
    removeInvalidSession();
    return null;
  }

  removeInvalidSession();
  return null;
}

export function saveWebSession(user: User): void {
  const session: StoredWebSession = { version: WEB_SESSION_VERSION, userId: user.id };
  try {
    window.sessionStorage.setItem(WEB_SESSION_KEY, JSON.stringify(session));
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
