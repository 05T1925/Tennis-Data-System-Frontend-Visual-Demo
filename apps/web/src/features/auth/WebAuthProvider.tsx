import type { AppError, User } from '@tennis/shared-types';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { WebAuthContext } from './WebAuthContext';
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, mockWebLogin, mockWebLogout } from './mockWebAuth';
import type {
  WebAuthContextValue,
  WebAuthOperation,
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
  const operationLockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      try {
        const restoredUser = restoreWebSession();
        setUser(restoredUser);
        setStatus(restoredUser === null ? 'unauthenticated' : 'authenticated');
      } catch (error) {
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
        const authenticatedUser = await mockWebLogin(credentials);
        saveWebSession(authenticatedUser);
        setUser(authenticatedUser);
        setStatus('authenticated');
      } catch (error) {
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
    () => performLogin({ email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD }, 'demo-login'),
    [performLogin],
  );

  const signOut = useCallback(async () => {
    if (operationLockRef.current) {
      return;
    }

    operationLockRef.current = true;
    setActiveOperation('logout');
    setAuthError(null);
    try {
      await mockWebLogout();
      clearWebSession();
      setUser(null);
      setStatus('unauthenticated');
    } catch (error) {
      setAuthError(normalizeAuthError(error));
    } finally {
      operationLockRef.current = false;
      setActiveOperation(null);
    }
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
