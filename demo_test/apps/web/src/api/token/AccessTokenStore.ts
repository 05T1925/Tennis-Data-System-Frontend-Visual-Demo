export interface AccessTokenProvider {
  getAccessToken(): string | null;
}

export class AccessTokenStore implements AccessTokenProvider {
  private accessToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(value: string): void {
    this.accessToken = value.trim() || null;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }
}

export const webAccessTokenStore = new AccessTokenStore();
