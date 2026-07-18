import { webDemoDataRepository } from '../demo-data';
import { MockWebAnalysisService } from './mockWebAnalysisService';

export const webAnalysisService = new MockWebAnalysisService(webDemoDataRepository);
