import { createIdGenerator, demoDataRepository, systemClock } from '@/features/demo-data';

import { MockAnalysisService } from './services/MockAnalysisService';

export type {
  AnalysisService,
  GetAnalysisByVideoOptions,
  RetryAnalysisOptions,
  StartAnalysisOptions,
} from './services/AnalysisService';
export { MockAnalysisService } from './services/MockAnalysisService';
export { analysisMutationKeys, analysisQueryKeys } from './queryKeys';

export const analysisService = new MockAnalysisService(
  demoDataRepository,
  systemClock,
  createIdGenerator(systemClock),
);
