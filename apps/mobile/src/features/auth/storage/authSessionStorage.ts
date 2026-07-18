import AsyncStorage from '@react-native-async-storage/async-storage';

import { createAuthError } from '../authErrors';
import { authSessionSchema, legacyAuthSessionSchema } from '../schemas';
import { AUTH_SESSION_VERSION } from '../types';
import type { AuthSession } from '../types';

export const AUTH_SESSION_STORAGE_KEY = 'tennis.auth.session.v1';

export async function loadAuthSession(): Promise<AuthSession | null> {
  let storedValue: string | null;

  try {
    storedValue = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  } catch (error) {
    throw createAuthError('SESSION_READ_FAILED', {
      technicalMessage: error instanceof Error ? error.message : 'AsyncStorage read failed',
    });
  }

  if (storedValue === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(storedValue);
    const current = authSessionSchema.safeParse(parsed);
    if (current.success) return current.data;
    const legacy = legacyAuthSessionSchema.parse(parsed);
    const migrated: AuthSession = {
      version: AUTH_SESSION_VERSION,
      mode: 'mock',
      accessToken: legacy.token,
      user: legacy.user,
    };
    await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch (error) {
    throw createAuthError('INVALID_STORED_SESSION', {
      technicalMessage: error instanceof Error ? error.message : 'Stored session validation failed',
      retryable: false,
    });
  }
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  try {
    if (session.mode !== 'mock') throw new Error('Real sessions must remain in memory.');
    const validatedSession = authSessionSchema.parse(session);
    await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(validatedSession));
  } catch (error) {
    throw createAuthError('SESSION_SAVE_FAILED', {
      technicalMessage: error instanceof Error ? error.message : 'AsyncStorage write failed',
    });
  }
}

export async function clearAuthSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch (error) {
    throw createAuthError('SESSION_CLEAR_FAILED', {
      technicalMessage: error instanceof Error ? error.message : 'AsyncStorage clear failed',
    });
  }
}
