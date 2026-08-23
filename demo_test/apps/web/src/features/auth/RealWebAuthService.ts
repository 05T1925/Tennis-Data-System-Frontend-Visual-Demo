import { adaptUserDto } from '../../api/adapters';
import { authEnvelopeSchema, userEnvelopeSchema } from '../../api/dto';
import { createApiError } from '../../api/errors';
import type { HttpClient } from '../../api/http';
import type { AccessTokenStore } from '../../api/token/AccessTokenStore';
import type { WebAuthRequestOptions, WebAuthService } from './WebAuthService';
import { WEB_AUTH_SESSION_VERSION, type WebAuthSession, type WebLoginCredentials } from './types';

export class RealWebAuthService implements WebAuthService {
  private readonly httpClient: HttpClient;
  private readonly tokenStore: AccessTokenStore;

  constructor(httpClient: HttpClient, tokenStore: AccessTokenStore) {
    this.httpClient = httpClient;
    this.tokenStore = tokenStore;
  }

  async login(
    credentials: WebLoginCredentials,
    options?: WebAuthRequestOptions,
  ): Promise<WebAuthSession> {
    const envelope = await this.httpClient.request({
      method: 'POST',
      path: '/auth/login',
      body: { email: credentials.email.trim().toLowerCase(), password: credentials.password },
      signal: options?.signal,
      responseSchema: authEnvelopeSchema,
    });
    const user = adaptUserDto(envelope.data.user);
    if (user.role !== 'admin') throw createApiError('REAL_API_FORBIDDEN', { retryable: false });
    this.tokenStore.setAccessToken(envelope.data.access_token);
    return {
      version: WEB_AUTH_SESSION_VERSION,
      mode: 'real',
      accessToken: envelope.data.access_token,
      expiresAt: envelope.data.expires_at,
      user,
    };
  }

  async restore(session: WebAuthSession, options?: WebAuthRequestOptions): Promise<WebAuthSession> {
    this.tokenStore.setAccessToken(session.accessToken);
    try {
      const envelope = await this.httpClient.request({
        method: 'GET',
        path: '/auth/me',
        signal: options?.signal,
        responseSchema: userEnvelopeSchema,
      });
      const user = adaptUserDto(envelope.data);
      if (user.role !== 'admin') throw createApiError('REAL_API_FORBIDDEN', { retryable: false });
      return { ...session, user };
    } catch (error) {
      this.tokenStore.clearAccessToken();
      throw error;
    }
  }

  async logout(_session: WebAuthSession | null, options?: WebAuthRequestOptions): Promise<void> {
    await this.httpClient.request({
      method: 'POST',
      path: '/auth/logout',
      signal: options?.signal,
      allowEmptyResponse: true,
    });
  }

  clearLocalCredentials(): void {
    this.tokenStore.clearAccessToken();
  }
}
