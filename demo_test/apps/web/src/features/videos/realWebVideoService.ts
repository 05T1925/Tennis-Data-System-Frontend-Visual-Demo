import { adaptTaskDto, adaptVideoDto } from '../../api/adapters';
import { videoDetailEnvelopeSchema, videoListEnvelopeSchema } from '../../api/dto';
import type { HttpClient } from '../../api/http';
import type {
  DeleteWebVideoParams,
  GetWebVideoParams,
  ListWebVideosParams,
  WebVideoService,
} from './types';

export class RealWebVideoService implements WebVideoService {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async listVideos(params: ListWebVideosParams) {
    const envelope = await this.httpClient.request({
      method: 'GET',
      path: '/videos',
      query: {
        keyword: params.keyword.trim() || undefined,
        upload_status: params.uploadStatus === 'all' ? undefined : params.uploadStatus,
        analysis_status: params.analysisStatus === 'all' ? undefined : params.analysisStatus,
        from: params.from ?? undefined,
        to: params.to ?? undefined,
        page: params.page,
        page_size: params.pageSize,
      },
      signal: params.signal,
      responseSchema: videoListEnvelopeSchema,
    });
    return {
      items: envelope.data.items.map((item) => ({
        video: adaptVideoDto(item.video),
        analysisTask: item.analysis_task ? adaptTaskDto(item.analysis_task) : null,
      })),
      total: envelope.data.total,
      unfilteredTotal: envelope.data.unfiltered_total,
      page: envelope.data.page,
      pageSize: params.pageSize,
    };
  }

  async getVideoById(params: GetWebVideoParams) {
    const envelope = await this.httpClient.request({
      method: 'GET',
      path: `/videos/${encodeURIComponent(params.videoId.trim())}`,
      signal: params.signal,
      responseSchema: videoDetailEnvelopeSchema,
    });
    return {
      video: adaptVideoDto(envelope.data.video),
      analysisTask: envelope.data.analysis_task ? adaptTaskDto(envelope.data.analysis_task) : null,
    };
  }

  async deleteVideo(params: DeleteWebVideoParams): Promise<void> {
    await this.httpClient.request({
      method: 'DELETE',
      path: `/videos/${encodeURIComponent(params.videoId.trim())}`,
      signal: params.signal,
      allowEmptyResponse: true,
    });
  }
}
