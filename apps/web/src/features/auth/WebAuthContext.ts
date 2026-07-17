import { createContext, useContext } from 'react';

import type { WebAuthContextValue } from './types';

export const WebAuthContext = createContext<WebAuthContextValue | null>(null);

export function useWebAuth(): WebAuthContextValue {
  const context = useContext(WebAuthContext);
  if (context === null) {
    throw new Error('useWebAuth must be used within WebAuthProvider.');
  }
  return context;
}
