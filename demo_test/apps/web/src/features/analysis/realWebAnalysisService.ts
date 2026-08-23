import { adaptResultDto, adaptTaskDto } from '../../api/adapters';
import { resultEnvelopeSchema, taskEnvelopeSchema } from '../../api/dto';
import { createApiError } from '../../api/errors';
import type { HttpClient } from '../../api/http';
import type { WebAnalysisRequest, WebAnalysisService } from './types';

export class RealWebAnalysisService implements WebAnalysisService {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async getTaskStateByVideoId(params: WebAnalysisRequest) {
    const envelope = await this.httpClient.request({
      method: 'GET',
      path: `/videos/${encodeURIComponent(params.videoId.trim())}/analysis`,
      signal: params.signal,
      responseSchema: taskEnvelopeSchema,
    });
    const task = envelope.data.task ? adaptTaskDto(envelope.data.task) : null;
    return {
      task,
      runtimeActive: false,
      pollingActive: task?.status === 'queued' || task?.status === 'processing',
    };
  }

  async getResultByVideoId(params: WebAnalysisRequest) {
    const envelope = await this.httpClient.request({
      method: 'GET',
      path: `/videos/${encodeURIComponent(params.videoId.trim())}/result`,
      signal: params.signal,
      responseSchema: resultEnvelopeSchema,
    });
    return envelope.data.result ? adaptResultDto(envelope.data.result) : null;
  }

  getCvDemoOutputByVideoId(_params: WebAnalysisRequest): Promise<never> {
    void _params;
    return Promise.reject(createApiError('REAL_CV_CONTRACT_NOT_CONFIGURED', { retryable: false }));
  }

  getTaskLogsByVideoId(_params: WebAnalysisRequest): Promise<never> {
    void _params;
    return Promise.reject(
      createApiError('REAL_LOGS_CONTRACT_NOT_CONFIGURED', { retryable: false }),
    );
  }

  retryAnalysis(_params: WebAnalysisRequest): Promise<never> {
    void _params;
    return Promise.reject(
      createApiError('REAL_RETRY_CONTRACT_NOT_CONFIGURED', { retryable: false }),
    );
  }
}
