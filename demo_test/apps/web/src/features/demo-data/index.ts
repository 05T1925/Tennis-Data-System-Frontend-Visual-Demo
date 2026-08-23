import { DefaultWebDemoDataRepository } from './repository';
import { LocalStorageWebDemoDataStorage } from './storage';

export const webDemoDataRepository = new DefaultWebDemoDataRepository(
  new LocalStorageWebDemoDataStorage(),
);

export { createWebDemoError, isAppError, normalizeWebDemoError, throwIfAborted } from './errors';
export { DefaultWebDemoDataRepository } from './repository';
export type { WebDemoDataRepository } from './repository';
export { migrateWebDemoDataV1 } from './migration';
export {
  webDemoDataSnapshotSchema,
  webDemoDataSnapshotV1Schema,
  webDemoDataSnapshotV2Schema,
} from './schemas';
export { createWebDemoSeed } from './seed';
export { GENERIC_ANALYSIS_FAILURE_MESSAGE, getSafeAnalysisFailureMessage } from './safety';
export { LocalStorageWebDemoDataStorage, WEB_DEMO_DATA_STORAGE_KEY } from './storage';
export type {
  JsonSafeValue,
  WebAnalysisRuntime,
  WebAnalysisTaskLogEntry,
  WebAnalysisTaskState,
  WebClock,
  WebCvDemoOutput,
  WebCvDemoPayload,
  WebDemoDataSnapshot,
  WebDemoDataSnapshotV1,
  WebDemoDataStorage,
  WebDemoScenarioBundle,
  WebDemoScenarioKind,
  WebVideoRecord,
} from './types';
export {
  MAX_WEB_CV_DEMO_BYTES,
  MAX_WEB_DEMO_SNAPSHOT_BYTES,
  WEB_CV_DEMO_DISCLAIMER,
  WEB_CV_DEMO_SCHEMA,
  WEB_DEMO_DATA_VERSION,
  systemWebClock,
} from './types';
