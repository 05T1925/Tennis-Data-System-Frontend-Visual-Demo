import { createIdGenerator, demoDataRepository, systemClock } from '@/features/demo-data';

import { MockAnalysisService } from './services/MockAnalysisService';

export const analysisService = new MockAnalysisService(
  demoDataRepository,
  systemClock,
  createIdGenerator(systemClock),
);
