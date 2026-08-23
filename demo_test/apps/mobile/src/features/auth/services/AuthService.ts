import type { AuthSession, LoginCredentials } from '../types';

export type AuthRequestOptions = { signal?: AbortSignal };

export interface AuthService {
  login(credentials: LoginCredentials, options?: AuthRequestOptions): Promise<AuthSession>;
  restore(session: AuthSession, options?: AuthRequestOptions): Promise<AuthSession>;
  logout(session: AuthSession | null, options?: AuthRequestOptions): Promise<void>;
  clearLocalCredentials?(): void;
}

export async function completeMobileLocalSignOut(
  service: AuthService,
  currentSession: AuthSession | null,
  removeStoredSession: () => Promise<void>,
): Promise<{ session: null; status: 'unauthenticated'; error: unknown | null }> {
  let error: unknown = null;
  try {
    await service.logout(currentSession);
  } catch (remoteError) {
    error = remoteError;
  }
  service.clearLocalCredentials?.();
  try {
    await removeStoredSession();
  } catch (storageError) {
    error ??= storageError;
  }
  return { session: null, status: 'unauthenticated', error };
}
