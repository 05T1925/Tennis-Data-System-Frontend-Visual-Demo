import { adaptUserDto } from '@/api/adapters/domainAdapters';
import { authEnvelopeSchema, userEnvelopeSchema } from '@/api/dto/schemas';
import type { HttpClient } from '@/api/http/HttpClient';
import type { AccessTokenStore } from '@/api/token/AccessTokenStore';

import { AUTH_SESSION_VERSION, type AuthSession, type LoginCredentials } from '../types';
import type { AuthRequestOptions, AuthService } from './AuthService';

export class RealAuthService implements AuthService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly tokenStore: AccessTokenStore,
  ) {}

  async login(credentials: LoginCredentials, options?: AuthRequestOptions): Promise<AuthSession> {
    const envelope = await this.httpClient.request({
      method: 'POST',
      path: '/auth/login',
      body: { email: credentials.email.trim().toLowerCase(), password: credentials.password },
      signal: options?.signal,
      responseSchema: authEnvelopeSchema,
    });
    this.tokenStore.setAccessToken(envelope.data.access_token);
    return {
      version: AUTH_SESSION_VERSION,
      mode: 'real',
      accessToken: envelope.data.access_token,
      expiresAt: envelope.data.expires_at,
      user: adaptUserDto(envelope.data.user),
    };
  }

  async restore(session: AuthSession, options?: AuthRequestOptions): Promise<AuthSession> {
    this.tokenStore.setAccessToken(session.accessToken);
    try {
      const envelope = await this.httpClient.request({
        method: 'GET',
        path: '/auth/me',
        signal: options?.signal,
        responseSchema: userEnvelopeSchema,
      });
      return { ...session, user: adaptUserDto(envelope.data) };
    } catch (error) {
      this.tokenStore.clearAccessToken();
      throw error;
    }
  }

  async logout(_session: AuthSession | null, options?: AuthRequestOptions): Promise<void> {
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
