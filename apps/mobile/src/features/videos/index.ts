import { env } from '@/config/env';

import { MockVideoService } from './services/MockVideoService';

export type { GetRecentVideosOptions, VideoService } from './services/VideoService';
export { MockVideoService } from './services/MockVideoService';

export const videoService = new MockVideoService(env.homeMockScenario);
