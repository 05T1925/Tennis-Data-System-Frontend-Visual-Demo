import { adaptVideoDto } from '@/api/adapters/domainAdapters';
import { videoDetailEnvelopeSchema, videoListEnvelopeSchema } from '@/api/dto/schemas';
import { createApiError } from '@/api/errors';
import type { HttpClient } from '@/api/http/HttpClient';

import type {
  CreateVideoOptions,
  DeleteVideoOptions,
  GetRecentVideosOptions,
  GetVideoByIdOptions,
  ListVideosOptions,
  StartUploadOptions,
  VideoService,
} from './VideoService';

export class RealVideoService implements VideoService {
  constructor(private readonly httpClient: HttpClient) {}

  async getRecentVideos({ limit = 3, signal }: GetRecentVideosOptions) {
    const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 3;
    const envelope = await this.httpClient.request({
      method: 'GET',
      path: '/videos',
      query: { page: 1, pageSize: normalizedLimit },
      signal,
      responseSchema: videoListEnvelopeSchema,
    });
    return envelope.data.items.map(({ video }) => adaptVideoDto(video)).slice(0, normalizedLimit);
  }

  async listVideos({ uploadStatus, signal }: ListVideosOptions) {
    const envelope = await this.httpClient.request({
      method: 'GET',
      path: '/videos',
      signal,
      responseSchema: videoListEnvelopeSchema,
    });
    const videos = envelope.data.items.map(({ video }) => adaptVideoDto(video));
    return uploadStatus ? videos.filter((video) => video.uploadStatus === uploadStatus) : videos;
  }

  async getVideoById({ videoId, signal }: GetVideoByIdOptions) {
    const envelope = await this.httpClient.request({
      method: 'GET',
      path: `/videos/${encodeURIComponent(videoId.trim())}`,
      signal,
      responseSchema: videoDetailEnvelopeSchema,
    });
    return adaptVideoDto(envelope.data.video);
  }

  createVideo(_options: CreateVideoOptions): Promise<never> {
    return Promise.reject(
      createApiError('REAL_UPLOAD_TRANSPORT_NOT_CONFIGURED', { retryable: false }),
    );
  }

  startUpload(_options: StartUploadOptions): Promise<never> {
    return Promise.reject(
      createApiError('REAL_UPLOAD_TRANSPORT_NOT_CONFIGURED', { retryable: false }),
    );
  }

  async deleteVideo({ videoId, signal }: DeleteVideoOptions): Promise<void> {
    await this.httpClient.request({
      method: 'DELETE',
      path: `/videos/${encodeURIComponent(videoId.trim())}`,
      signal,
      allowEmptyResponse: true,
    });
  }
}
