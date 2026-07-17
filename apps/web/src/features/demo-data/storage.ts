import { createWebDemoError } from './errors';
import type { WebDemoDataStorage } from './types';

export const WEB_DEMO_DATA_STORAGE_KEY = 'tennis.web.demo.data.v1';

export type StorageResolver = () => Storage;

const resolveBrowserLocalStorage: StorageResolver = () => window.localStorage;

export class LocalStorageWebDemoDataStorage implements WebDemoDataStorage {
  private readonly resolveStorage: StorageResolver;

  constructor(resolveStorage: StorageResolver = resolveBrowserLocalStorage) {
    this.resolveStorage = resolveStorage;
  }

  read(): string | null {
    try {
      return this.resolveStorage().getItem(WEB_DEMO_DATA_STORAGE_KEY);
    } catch (error) {
      throw createWebDemoError('WEB_DEMO_DATA_LOAD_FAILED', {
        technicalMessage: error instanceof Error ? error.message : 'localStorage read failed.',
      });
    }
  }

  write(value: string): void {
    try {
      this.resolveStorage().setItem(WEB_DEMO_DATA_STORAGE_KEY, value);
    } catch (error) {
      throw createWebDemoError('WEB_DEMO_DATA_SAVE_FAILED', {
        technicalMessage: error instanceof Error ? error.message : 'localStorage write failed.',
      });
    }
  }
}
