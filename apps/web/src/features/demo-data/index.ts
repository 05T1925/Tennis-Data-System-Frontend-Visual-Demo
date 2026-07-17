import { DefaultWebDemoDataRepository } from './repository';
import { LocalStorageWebDemoDataStorage } from './storage';

export const webDemoDataRepository = new DefaultWebDemoDataRepository(
  new LocalStorageWebDemoDataStorage(),
);

export { createWebDemoError, isAppError, normalizeWebDemoError, throwIfAborted } from './errors';
export { DefaultWebDemoDataRepository } from './repository';
export type { WebDemoDataRepository } from './repository';
export { webDemoDataSnapshotSchema } from './schemas';
export { createWebDemoSeed } from './seed';
export { LocalStorageWebDemoDataStorage, WEB_DEMO_DATA_STORAGE_KEY } from './storage';
export type { WebDemoDataSnapshot, WebDemoDataStorage, WebVideoRecord } from './types';
export { WEB_DEMO_DATA_VERSION } from './types';
