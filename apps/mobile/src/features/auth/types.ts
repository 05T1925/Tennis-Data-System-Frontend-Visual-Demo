import type { AppError, User } from '@tennis/shared-types';

export const AUTH_SESSION_VERSION = 1 as const;

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  version: typeof AUTH_SESSION_VERSION;
  token: string;
  user: User;
};

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';

export type AuthOperation = 'password-login' | 'demo-login' | 'logout';

export type AuthSessionValue = {
  status: AuthStatus;
  user: User | null;
  isAuthenticated: boolean;
  activeOperation: AuthOperation | null;
  authError: AppError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
};
