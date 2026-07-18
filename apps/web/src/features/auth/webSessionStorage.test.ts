import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { demoWebAdmin } from './mockWebAuth';
import { restoreWebSession, saveWebSession } from './webSessionStorage';

class FakeStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const key = 'tennis.web.admin.session.v1';

describe('mode-aware Web sessionStorage', () => {
  let sessionStorage: FakeStorage;
  beforeEach(() => {
    sessionStorage = new FakeStorage();
    vi.stubGlobal('window', { sessionStorage });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('migrates v1 only in Mock mode', () => {
    sessionStorage.setItem(key, JSON.stringify({ version: 1, userId: demoWebAdmin.id }));
    expect(restoreWebSession('mock')).toMatchObject({ version: 2, mode: 'mock' });
    sessionStorage.setItem(key, JSON.stringify({ version: 1, userId: demoWebAdmin.id }));
    expect(restoreWebSession('real')).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it('persists a Real v2 session only in the current tab and rejects mode mismatch', () => {
    saveWebSession({
      version: 2,
      mode: 'real',
      accessToken: 'stub-access-token',
      user: demoWebAdmin,
    });
    expect(restoreWebSession('real')).toMatchObject({
      mode: 'real',
      accessToken: 'stub-access-token',
    });
    expect(restoreWebSession('mock')).toBeNull();
  });

  it('does not persist passwords or administrator keys', () => {
    saveWebSession({ version: 2, mode: 'mock', accessToken: 'mock-token', user: demoWebAdmin });
    const stored = sessionStorage.getItem(key) ?? '';
    expect(stored).not.toContain('TennisAdmin123!');
    expect(stored).not.toContain('admin_secret');
  });
});
