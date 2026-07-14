import { env } from '@/config/env';
import { createIdGenerator, demoDataRepository, systemClock } from '@/features/demo-data';

import { MockVideoService } from './services/MockVideoService';

export type {
  CreateVideoInput,
  CreateVideoOptions,
  DeleteVideoOptions,
  GetRecentVideosOptions,
  GetVideoByIdOptions,
  ListVideosOptions,
  StartUploadOptions,
  VideoService,
} from './services/VideoService';
export { MockVideoService } from './services/MockVideoService';

export const videoService = new MockVideoService(
  env.homeMockScenario,
  demoDataRepository,
  systemClock,
  createIdGenerator(systemClock),
  env.uploadMockScenario,
);
