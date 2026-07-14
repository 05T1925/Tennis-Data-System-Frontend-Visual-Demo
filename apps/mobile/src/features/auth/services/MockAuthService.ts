import { createAuthError } from '../authErrors';
import { demoUser } from '../demoUser';
import type { AuthSession, LoginCredentials } from '../types';
import { AUTH_SESSION_VERSION } from '../types';
import type { AuthService } from './AuthService';

export const demoCredentials: LoginCredentials = {
  email: 'demo@tennis.local',
  password: 'TennisDemo123!',
};

export const networkErrorCredentials: LoginCredentials = {
  email: 'network@tennis.local',
  password: 'NetworkDemo123!',
};

const MOCK_DELAY_MS = 700;

function waitForMockNetwork() {
  return new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
}

function credentialsMatch(left: LoginCredentials, right: LoginCredentials) {
  return left.email.trim().toLowerCase() === right.email && left.password === right.password;
}

export class MockAuthService implements AuthService {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    // Fixed cases keep demos and manual acceptance deterministic.
    await waitForMockNetwork();

    if (credentialsMatch(credentials, networkErrorCredentials)) {
      throw createAuthError('MOCK_NETWORK_ERROR');
    }

    if (!credentialsMatch(credentials, demoCredentials)) {
      throw createAuthError('INVALID_CREDENTIALS', { retryable: false });
    }

    return {
      version: AUTH_SESSION_VERSION,
      token: 'mock-demo-session-token-v1',
      user: demoUser,
    };
  }

  async logout(_session: AuthSession | null): Promise<void> {
    await waitForMockNetwork();
  }
}
