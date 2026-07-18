import type { AppError, User } from '@tennis/shared-types';

export type WebAuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';
export type WebAuthOperation = 'password-login' | 'demo-login' | 'logout';

export type WebLoginCredentials = {
  email: string;
  password: string;
};

export const WEB_AUTH_SESSION_VERSION = 2 as const;

export type WebAuthSession = {
  version: typeof WEB_AUTH_SESSION_VERSION;
  mode: 'mock' | 'real';
  accessToken: string;
  expiresAt?: string;
  user: User;
};

export type WebAuthContextValue = {
  status: WebAuthStatus;
  user: User | null;
  activeOperation: WebAuthOperation | null;
  authError: AppError | null;
  login: (credentials: WebLoginCredentials) => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
};
