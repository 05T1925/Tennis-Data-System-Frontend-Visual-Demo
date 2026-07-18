import { mockWebLogin, mockWebLogout } from './mockWebAuth';
import type { WebAuthService } from './WebAuthService';
import { WEB_AUTH_SESSION_VERSION, type WebAuthSession } from './types';

export class MockWebAuthService implements WebAuthService {
  async login(credentials: Parameters<typeof mockWebLogin>[0]): Promise<WebAuthSession> {
    const user = await mockWebLogin(credentials);
    return {
      version: WEB_AUTH_SESSION_VERSION,
      mode: 'mock',
      accessToken: 'mock-web-admin-session-token-v2',
      user,
    };
  }

  restore(session: WebAuthSession): Promise<WebAuthSession> {
    return Promise.resolve(session);
  }

  logout(): Promise<void> {
    return mockWebLogout();
  }

  clearLocalCredentials(): void {}
}
