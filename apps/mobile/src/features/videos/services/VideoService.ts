import type { Video } from '@tennis/shared-types';

export interface GetRecentVideosOptions {
  userId: string;
  limit?: number;
  signal?: AbortSignal;
}

export interface VideoService {
  getRecentVideos(options: GetRecentVideosOptions): Promise<Video[]>;
}
