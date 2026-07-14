import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { AppError } from '@tennis/shared-types';

import { createAuthError, toAuthError } from './authErrors';
import { demoCredentials, MockAuthService } from './services/MockAuthService';
import { clearAuthSession, loadAuthSession, saveAuthSession } from './storage/authSessionStorage';
import type {
  AuthOperation,
  AuthSession,
  AuthSessionValue,
  AuthStatus,
  LoginCredentials,
} from './types';

const authService = new MockAuthService();
const AuthSessionContext = createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeOperation, setActiveOperation] = useState<AuthOperation | null>(null);
  const [authError, setAuthError] = useState<AppError | null>(null);
  const operationRef = useRef<AuthOperation | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    async function restoreSession() {
      try {
        const restoredSession = await loadAuthSession();
        if (!active) return;

        setSession(restoredSession);
        setStatus(restoredSession ? 'authenticated' : 'unauthenticated');
      } catch (error) {
        const restoreError = toAuthError(error);

        if (restoreError.code === 'INVALID_STORED_SESSION') {
          try {
            await clearAuthSession();
          } catch (clearError) {
            if (active) {
              setAuthError(
                createAuthError('SESSION_RESET_FAILED', {
                  technicalMessage: toAuthError(clearError).technicalMessage,
                }),
              );
            }
          }
        } else if (active) {
          setAuthError(restoreError);
        }

        if (active) {
          // Route decisions resume even when corrupt storage cannot be cleared.
          setSession(null);
          setStatus('unauthenticated');
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
      mountedRef.current = false;
    };
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const performLogin = useCallback(
    async (credentials: LoginCredentials, operation: Exclude<AuthOperation, 'logout'>) => {
      if (operationRef.current !== null) return;

      operationRef.current = operation;
      setActiveOperation(operation);
      setAuthError(null);

      try {
        const nextSession = await authService.login(credentials);
        // Authentication is not committed until persistence succeeds.
        await saveAuthSession(nextSession);

        if (mountedRef.current) {
          setSession(nextSession);
          setStatus('authenticated');
        }
      } catch (error) {
        if (mountedRef.current) {
          setAuthError(toAuthError(error));
        }
      } finally {
        operationRef.current = null;
        if (mountedRef.current) {
          setActiveOperation(null);
        }
      }
    },
    [],
  );

  const login = useCallback(
    (credentials: LoginCredentials) => performLogin(credentials, 'password-login'),
    [performLogin],
  );

  const signInDemo = useCallback(() => performLogin(demoCredentials, 'demo-login'), [performLogin]);

  const signOut = useCallback(async () => {
    if (operationRef.current !== null) return;

    operationRef.current = 'logout';
    setActiveOperation('logout');
    setAuthError(null);

    try {
      await authService.logout(session);
      // Keep the in-memory identity until durable session removal succeeds.
      await clearAuthSession();

      if (mountedRef.current) {
        setSession(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      if (mountedRef.current) {
        setAuthError(toAuthError(error));
      }
    } finally {
      operationRef.current = null;
      if (mountedRef.current) {
        setActiveOperation(null);
      }
    }
  }, [session]);

  const value = useMemo<AuthSessionValue>(
    () => ({
      status,
      user: session?.user ?? null,
      isAuthenticated: status === 'authenticated' && session !== null,
      activeOperation,
      authError,
      login,
      signInDemo,
      signOut,
      clearAuthError,
    }),
    [status, session, activeOperation, authError, login, signInDemo, signOut, clearAuthError],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const authSession = useContext(AuthSessionContext);

  if (!authSession) {
    throw new Error('useAuthSession 必须在 AuthSessionProvider 内使用。');
  }

  return authSession;
}
