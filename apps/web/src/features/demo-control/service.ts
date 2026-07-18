import { webDemoDataRepository } from '../demo-data';
import { MockWebDemoControlService } from './mockWebDemoControlService';

export const webDemoControlService = new MockWebDemoControlService(webDemoDataRepository);
