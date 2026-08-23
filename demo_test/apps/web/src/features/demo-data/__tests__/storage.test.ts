import { describe, expect, it, vi } from 'vitest';

import { LocalStorageWebDemoDataStorage, WEB_DEMO_DATA_STORAGE_KEY } from '../storage';

class FakeStorage implements Storage {
  private values = new Map<string, string>();
  readonly calls: string[] = [];
  get length(): number {
    return this.values.size;
  }
  clear(): void {
    this.values.clear();
  }
  getItem(key: string): string | null {
    this.calls.push(`get:${key}`);
    return this.values.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
  setItem(key: string, value: string): void {
    this.calls.push(`set:${key}`);
    this.values.set(key, value);
  }
}

describe('LocalStorageWebDemoDataStorage', () => {
  it('only reads and writes the isolated Web Demo key', () => {
    const storage = new FakeStorage();
    const adapter = new LocalStorageWebDemoDataStorage(() => storage);
    adapter.read();
    adapter.write('{}');
    expect(storage.calls).toEqual([
      `get:${WEB_DEMO_DATA_STORAGE_KEY}`,
      `set:${WEB_DEMO_DATA_STORAGE_KEY}`,
    ]);
    expect(storage.calls.join(' ')).not.toContain('tennis.web.admin.session.v1');
  });

  it('does not resolve Storage while the adapter is constructed', () => {
    const storage = new FakeStorage();
    const resolver = vi.fn(() => storage);
    const adapter = new LocalStorageWebDemoDataStorage(resolver);

    expect(resolver).not.toHaveBeenCalled();
    adapter.read();
    expect(resolver).toHaveBeenCalledTimes(1);
    adapter.write('{}');
    expect(resolver).toHaveBeenCalledTimes(2);
  });

  it('maps resolver failures to operation-specific safe errors', () => {
    const readAdapter = new LocalStorageWebDemoDataStorage(() => {
      throw new Error('localStorage getter blocked');
    });
    expect(() => readAdapter.read()).toThrowError(
      expect.objectContaining({ code: 'WEB_DEMO_DATA_LOAD_FAILED' }),
    );

    const writeAdapter = new LocalStorageWebDemoDataStorage(() => {
      throw new Error('localStorage getter blocked');
    });
    expect(() => writeAdapter.write('{}')).toThrowError(
      expect.objectContaining({ code: 'WEB_DEMO_DATA_SAVE_FAILED' }),
    );
  });

  it('maps getItem and setItem failures to operation-specific safe errors', () => {
    const storage = new FakeStorage();
    storage.getItem = () => {
      throw new Error('blocked');
    };
    expect(() => new LocalStorageWebDemoDataStorage(() => storage).read()).toThrowError(
      expect.objectContaining({ code: 'WEB_DEMO_DATA_LOAD_FAILED' }),
    );
    storage.getItem = FakeStorage.prototype.getItem.bind(storage);
    storage.setItem = () => {
      throw new Error('quota');
    };
    expect(() => new LocalStorageWebDemoDataStorage(() => storage).write('{}')).toThrowError(
      expect.objectContaining({ code: 'WEB_DEMO_DATA_SAVE_FAILED' }),
    );
  });
});
