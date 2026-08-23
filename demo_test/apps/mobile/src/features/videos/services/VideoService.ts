import type { CourtType, MatchType, PlayMode, UploadStatus, Video } from '@tennis/shared-types';

export interface GetRecentVideosOptions {
  userId: string;
  limit?: number;
  signal?: AbortSignal;
}

export interface ListVideosOptions {
  userId: string;
  uploadStatus?: UploadStatus;
  signal?: AbortSignal;
}

export interface GetVideoByIdOptions {
  userId: string;
  videoId: string;
  signal?: AbortSignal;
}

export interface CreateVideoInput {
  title: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  matchType: MatchType;
  playMode: PlayMode;
  courtType?: CourtType;
  note?: string;
}

export interface CreateVideoOptions {
  userId: string;
  input: CreateVideoInput;
  signal?: AbortSignal;
}

export type StartUploadOptions = GetVideoByIdOptions;
export type DeleteVideoOptions = GetVideoByIdOptions;

export interface VideoService {
  getRecentVideos(options: GetRecentVideosOptions): Promise<Video[]>;
  listVideos(options: ListVideosOptions): Promise<Video[]>;
  getVideoById(options: GetVideoByIdOptions): Promise<Video>;
  createVideo(options: CreateVideoOptions): Promise<Video>;
  startUpload(options: StartUploadOptions): Promise<Video>;
  deleteVideo(options: DeleteVideoOptions): Promise<void>;
}
