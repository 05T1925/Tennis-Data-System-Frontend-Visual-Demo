import { adaptResultDto, adaptTaskDto } from '@/api/adapters/domainAdapters';
import { resultEnvelopeSchema, taskEnvelopeSchema } from '@/api/dto/schemas';
import { createApiError } from '@/api/errors';
import type { HttpClient } from '@/api/http/HttpClient';

import type {
  AnalysisService,
  GetAnalysisByVideoOptions,
  RetryAnalysisOptions,
  StartAnalysisOptions,
} from './AnalysisService';

export class RealAnalysisService implements AnalysisService {
  constructor(private readonly httpClient: HttpClient) {}

  async startAnalysis({ videoId, signal }: StartAnalysisOptions) {
    const envelope = await this.httpClient.request({
      method: 'POST',
      path: `/videos/${encodeURIComponent(videoId.trim())}/analysis`,
      signal,
      responseSchema: taskEnvelopeSchema,
    });
    if (!envelope.data.task) throw createApiError('REAL_API_RESPONSE_INVALID');
    return adaptTaskDto(envelope.data.task);
  }

  async getAnalysisTaskByVideoId({ videoId, signal }: GetAnalysisByVideoOptions) {
    const envelope = await this.httpClient.request({
      method: 'GET',
      path: `/videos/${encodeURIComponent(videoId.trim())}/analysis`,
      signal,
      responseSchema: taskEnvelopeSchema,
    });
    return envelope.data.task ? adaptTaskDto(envelope.data.task) : null;
  }

  async getAnalysisResultByVideoId({ videoId, signal }: GetAnalysisByVideoOptions) {
    const envelope = await this.httpClient.request({
      method: 'GET',
      path: `/videos/${encodeURIComponent(videoId.trim())}/result`,
      signal,
      responseSchema: resultEnvelopeSchema,
    });
    return envelope.data.result ? adaptResultDto(envelope.data.result) : null;
  }

  retryAnalysis(_options: RetryAnalysisOptions): Promise<never> {
    return Promise.reject(
      createApiError('REAL_RETRY_CONTRACT_NOT_CONFIGURED', { retryable: false }),
    );
  }
}
