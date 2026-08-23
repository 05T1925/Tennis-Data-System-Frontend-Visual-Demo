import { beforeEach, describe, expect, it, vi } from 'vitest';

import { demoUser } from '../demoUser';
import {
  AUTH_SESSION_STORAGE_KEY,
  loadAuthSession,
  saveAuthSession,
} from '../storage/authSessionStorage';

const asyncStorage = vi.hoisted(() => ({
  getItem: vi.fn<(key: string) => Promise<string | null>>(),
  setItem: vi.fn<(key: string, value: string) => Promise<void>>(),
  removeItem: vi.fn<(key: string) => Promise<void>>(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorage }));

describe('mode-aware Mobile Auth storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asyncStorage.setItem.mockResolvedValue();
  });

  it('migrates the legacy v1 Mock session', async () => {
    asyncStorage.getItem.mockResolvedValue(
      JSON.stringify({ version: 1, token: 'mock-token', user: demoUser }),
    );
    await expect(loadAuthSession()).resolves.toMatchObject({
      version: 2,
      mode: 'mock',
      accessToken: 'mock-token',
    });
    expect(asyncStorage.setItem).toHaveBeenCalledWith(
      AUTH_SESSION_STORAGE_KEY,
      expect.stringContaining('"mode":"mock"'),
    );
  });

  it('never writes a Real token to AsyncStorage', async () => {
    await expect(
      saveAuthSession({
        version: 2,
        mode: 'real',
        accessToken: 'stub-access-token',
        user: demoUser,
      }),
    ).rejects.toMatchObject({ code: 'SESSION_SAVE_FAILED' });
    expect(asyncStorage.setItem).not.toHaveBeenCalled();
  });
});
