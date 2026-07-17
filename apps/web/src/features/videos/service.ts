import { env } from '../../config/env';
import { webDemoDataRepository } from '../demo-data';
import { MockWebVideoService } from './mockVideoService';

export const webVideoService = new MockWebVideoService(
  webDemoDataRepository,
  env.webVideoMockScenario,
);
