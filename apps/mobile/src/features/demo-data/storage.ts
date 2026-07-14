import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDemoDataError } from './errors';

export const DEMO_DATA_STORAGE_KEY = 'tennis.demo.data.v1';

export interface DemoDataStorage {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
  remove(): Promise<void>;
}

export class AsyncStorageDemoDataStorage implements DemoDataStorage {
  async read() {
    try {
      return await AsyncStorage.getItem(DEMO_DATA_STORAGE_KEY);
    } catch (error) {
      throw createDemoDataError('DEMO_DATA_LOAD_FAILED', {
        technicalMessage: error instanceof Error ? error.message : 'AsyncStorage read failed.',
      });
    }
  }

  async write(value: string) {
    try {
      await AsyncStorage.setItem(DEMO_DATA_STORAGE_KEY, value);
    } catch (error) {
      throw createDemoDataError('DEMO_DATA_SAVE_FAILED', {
        technicalMessage: error instanceof Error ? error.message : 'AsyncStorage write failed.',
      });
    }
  }

  async remove() {
    try {
      await AsyncStorage.removeItem(DEMO_DATA_STORAGE_KEY);
    } catch (error) {
      throw createDemoDataError('DEMO_DATA_SAVE_FAILED', {
        technicalMessage: error instanceof Error ? error.message : 'AsyncStorage remove failed.',
      });
    }
  }
}
