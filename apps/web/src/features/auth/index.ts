export { AuthRestoringView, ProtectedRoute, PublicOnlyRoute, RootRedirect } from './AuthGuards';
export { useWebAuth } from './WebAuthContext';
export { WebAuthProvider } from './WebAuthProvider';
export { webAuthService } from './service';
export type { WebAuthService } from './WebAuthService';
export { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from './mockWebAuth';
export type {
  WebAuthContextValue,
  WebAuthOperation,
  WebAuthStatus,
  WebLoginCredentials,
  WebAuthSession,
} from './types';
