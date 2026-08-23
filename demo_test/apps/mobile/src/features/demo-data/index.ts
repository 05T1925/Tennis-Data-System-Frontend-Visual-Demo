import { createIdGenerator, systemClock } from './dependencies';
import { DefaultDemoDataRepository } from './DemoDataRepository';
import { DefaultDemoDataService } from './DemoDataService';
import { AsyncStorageDemoDataStorage } from './storage';

// All Mock services import this stable instance so they cannot drift into separate data sources.
export const demoDataRepository = new DefaultDemoDataRepository(
  new AsyncStorageDemoDataStorage(),
  systemClock,
  createIdGenerator(systemClock),
);
export const demoDataService = new DefaultDemoDataService(demoDataRepository);

export { createIdGenerator, systemClock } from './dependencies';
export { DefaultDemoDataRepository } from './DemoDataRepository';
export type { DemoDataRepository } from './DemoDataRepository';
export { DefaultDemoDataService } from './DemoDataService';
export type { DemoDataService } from './DemoDataService';
export { createAnalysisResult, createAnalysisTask, createDemoSeed, createVideo } from './factories';
export { createDemoDataError, throwIfAborted, waitForDemoDelay } from './errors';
export { demoDataSnapshotSchema } from './schemas';
export { AsyncStorageDemoDataStorage, DEMO_DATA_STORAGE_KEY } from './storage';
export type { DemoDataStorage } from './storage';
export {
  ANALYSIS_STAGES,
  DEFAULT_ANALYSIS_STAGE_DURATION_MS,
  DEFAULT_UPLOAD_DURATION_MS,
  reconcileDemoData,
} from './transitions';
export { DEMO_DATA_VERSION, DEMO_USER_ID } from './types';
export type {
  AnalysisRuntimeState,
  Clock,
  DemoDataSnapshot,
  IdGenerator,
  UploadRuntimeState,
} from './types';
