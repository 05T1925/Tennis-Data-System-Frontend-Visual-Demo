import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AsyncStorageDemoDataStorage, DEMO_DATA_STORAGE_KEY } from '../storage';

const asyncStorage = vi.hoisted(() => ({
  getItem: vi.fn<(key: string) => Promise<string | null>>(),
  setItem: vi.fn<(key: string, value: string) => Promise<void>>(),
  removeItem: vi.fn<(key: string) => Promise<void>>(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorage }));

describe('AsyncStorageDemoDataStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asyncStorage.getItem.mockResolvedValue(null);
    asyncStorage.setItem.mockResolvedValue();
    asyncStorage.removeItem.mockResolvedValue();
  });

  it('only accesses the isolated Demo Data key', async () => {
    const storage = new AsyncStorageDemoDataStorage();

    await storage.read();
    await storage.write('{}');
    await storage.remove();

    expect(asyncStorage.getItem).toHaveBeenCalledWith(DEMO_DATA_STORAGE_KEY);
    expect(asyncStorage.setItem).toHaveBeenCalledWith(DEMO_DATA_STORAGE_KEY, '{}');
    expect(asyncStorage.removeItem).toHaveBeenCalledWith(DEMO_DATA_STORAGE_KEY);
    expect(DEMO_DATA_STORAGE_KEY).not.toBe('tennis.auth.session.v1');
    expect(
      [
        ...asyncStorage.getItem.mock.calls,
        ...asyncStorage.setItem.mock.calls,
        ...asyncStorage.removeItem.mock.calls,
      ].some(([key]) => key === 'tennis.auth.session.v1'),
    ).toBe(false);
  });
});
