import type { AuthSession, LoginCredentials } from '../types';

export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(session: AuthSession | null): Promise<void>;
}
