import type { WebVideoRecord } from '../demo-data';
import type { WebAnalysisStatusFilter } from './types';

export type WebDerivedAnalysisStatus = Exclude<WebAnalysisStatusFilter, 'all'>;

export function getWebAnalysisStatus(record: WebVideoRecord): WebDerivedAnalysisStatus {
  if (record.video.uploadStatus !== 'uploaded') return 'not_ready';
  return record.analysisTask?.status ?? 'not_created';
}
