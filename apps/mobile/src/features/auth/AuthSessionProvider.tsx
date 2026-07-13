import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import type { User } from '@tennis/shared-types';

import { demoUser } from './demoUser';

type AuthSessionValue = {
  user: User | null;
  isAuthenticated: boolean;
  signInDemo: () => void;
  signOut: () => void;
};

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo<AuthSessionValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      signInDemo: () => setUser(demoUser),
      signOut: () => setUser(null),
    }),
    [user],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const session = useContext(AuthSessionContext);

  if (!session) {
    throw new Error('useAuthSession 必须在 AuthSessionProvider 内使用。');
  }

  return session;
}
