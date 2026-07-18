import type { AppError, User } from '@tennis/shared-types';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { webApiMode } from '../../config/env';
import { WebAuthContext } from './WebAuthContext';
import { commitWebSessionLocally, completeWebLocalSignOut } from './WebAuthService';
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from './mockWebAuth';
import { webAuthService } from './service';
import type {
  WebAuthContextValue,
  WebAuthOperation,
  WebAuthSession,
  WebAuthStatus,
  WebLoginCredentials,
} from './types';
import { clearWebSession, restoreWebSession, saveWebSession } from './webSessionStorage';

type WebAuthProviderProps = {
  children: ReactNode;
};

function normalizeAuthError(error: unknown): AppError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'userMessage' in error &&
    'retryable' in error
  ) {
    return error as AppError;
  }

  return {
    code: 'WEB_AUTH_UNKNOWN_ERROR',
    userMessage: '登录操作暂时无法完成，请稍后重试。',
    retryable: true,
  };
}

export function WebAuthProvider({ children }: WebAuthProviderProps) {
  const [status, setStatus] = useState<WebAuthStatus>('restoring');
  const [user, setUser] = useState<User | null>(null);
  const [activeOperation, setActiveOperation] = useState<WebAuthOperation | null>(null);
  const [authError, setAuthError] = useState<AppError | null>(null);
  const sessionRef = useRef<WebAuthSession | null>(null);
  const operationLockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(async () => {
      if (cancelled) {
        return;
      }

      try {
        const mode = webApiMode.status === 'ready' ? webApiMode.mode : null;
        const storedSession = restoreWebSession(mode);
        const restoredSession = storedSession ? await webAuthService.restore(storedSession) : null;
        if (cancelled) {
          webAuthService.clearLocalCredentials?.();
          return;
        }
        if (restoredSession) {
          commitWebSessionLocally(webAuthService, restoredSession, saveWebSession, clearWebSession);
        }
        sessionRef.current = restoredSession;
        setUser(restoredSession?.user ?? null);
        setStatus(restoredSession === null ? 'unauthenticated' : 'authenticated');
      } catch (error) {
        webAuthService.clearLocalCredentials?.();
        try {
          clearWebSession();
        } catch {
          // Keep the original restore failure as the user-facing error.
        }
        sessionRef.current = null;
        if (cancelled) return;
        setUser(null);
        setAuthError(normalizeAuthError(error));
        setStatus('unauthenticated');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const performLogin = useCallback(
    async (credentials: WebLoginCredentials, operation: Exclude<WebAuthOperation, 'logout'>) => {
      if (operationLockRef.current) {
        return;
      }

      operationLockRef.current = true;
      setActiveOperation(operation);
      setAuthError(null);
      try {
        const authenticatedSession = await webAuthService.login(credentials);
        commitWebSessionLocally(
          webAuthService,
          authenticatedSession,
          saveWebSession,
          clearWebSession,
        );
        sessionRef.current = authenticatedSession;
        setUser(authenticatedSession.user);
        setStatus('authenticated');
      } catch (error) {
        webAuthService.clearLocalCredentials?.();
        try {
          clearWebSession();
        } catch {
          // Keep the original login failure as the user-facing error.
        }
        sessionRef.current = null;
        setUser(null);
        setStatus('unauthenticated');
        setAuthError(normalizeAuthError(error));
      } finally {
        operationLockRef.current = false;
        setActiveOperation(null);
      }
    },
    [],
  );

  const login = useCallback(
    (credentials: WebLoginCredentials) => performLogin(credentials, 'password-login'),
    [performLogin],
  );

  const signInDemo = useCallback(
    () =>
      webApiMode.status === 'ready' && webApiMode.mode === 'mock'
        ? performLogin({ email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD }, 'demo-login')
        : Promise.resolve(),
    [performLogin],
  );

  const signOut = useCallback(async () => {
    if (operationLockRef.current) {
      return;
    }

    operationLockRef.current = true;
    setActiveOperation('logout');
    setAuthError(null);
    const outcome = await completeWebLocalSignOut(
      webAuthService,
      sessionRef.current,
      clearWebSession,
    );
    sessionRef.current = outcome.session;
    setUser(null);
    setStatus(outcome.status);
    if (outcome.error) setAuthError(normalizeAuthError(outcome.error));
    operationLockRef.current = false;
    setActiveOperation(null);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = useMemo<WebAuthContextValue>(
    () => ({
      status,
      user,
      activeOperation,
      authError,
      login,
      signInDemo,
      signOut,
      clearAuthError,
    }),
    [activeOperation, authError, clearAuthError, login, signInDemo, signOut, status, user],
  );

  return <WebAuthContext.Provider value={value}>{children}</WebAuthContext.Provider>;
}
