import type { WebAuthSession, WebLoginCredentials } from './types';

export type WebAuthRequestOptions = { signal?: AbortSignal };

export interface WebAuthService {
  login(credentials: WebLoginCredentials, options?: WebAuthRequestOptions): Promise<WebAuthSession>;
  restore(session: WebAuthSession, options?: WebAuthRequestOptions): Promise<WebAuthSession>;
  logout(session: WebAuthSession | null, options?: WebAuthRequestOptions): Promise<void>;
  clearLocalCredentials?(): void;
}

export function commitWebSessionLocally(
  service: WebAuthService,
  session: WebAuthSession,
  saveSession: (session: WebAuthSession) => void,
  clearSession: () => void,
): void {
  try {
    saveSession(session);
  } catch (error) {
    service.clearLocalCredentials?.();
    try {
      clearSession();
    } catch {
      // Preserve the original commit failure.
    }
    throw error;
  }
}

export async function completeWebLocalSignOut(
  service: WebAuthService,
  currentSession: WebAuthSession | null,
  clearSession: () => void,
): Promise<{ session: null; status: 'unauthenticated'; error: unknown | null }> {
  let error: unknown = null;
  try {
    await service.logout(currentSession);
  } catch (remoteError) {
    error = remoteError;
  }
  service.clearLocalCredentials?.();
  try {
    clearSession();
  } catch (storageError) {
    error ??= storageError;
  }
  return { session: null, status: 'unauthenticated', error };
}
