import { describe, expect, it } from 'vitest';

import { AccessTokenStore } from './AccessTokenStore';

describe('AccessTokenStore', () => {
  it('keeps tokens only in the injected memory store', () => {
    const store = new AccessTokenStore();
    expect(store.getAccessToken()).toBeNull();
    store.setAccessToken(' test-token ');
    expect(store.getAccessToken()).toBe('test-token');
    store.clearAccessToken();
    expect(store.getAccessToken()).toBeNull();
  });
});
