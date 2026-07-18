export interface AccessTokenProvider {
  getAccessToken(): string | null;
}

export class AccessTokenStore implements AccessTokenProvider {
  private accessToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(value: string): void {
    const normalized = value.trim();
    this.accessToken = normalized || null;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }
}

export const mobileAccessTokenStore = new AccessTokenStore();
