import type { UploadStatus } from '@tennis/shared-types';

import type { UploadMockScenario } from '@/config/env';

export type UploadStartDecision =
  { kind: 'idempotent' } | { kind: 'reject' } | { kind: 'start'; outcome: 'succeeded' | 'failed' };

export function getUploadStartDecision(
  scenario: UploadMockScenario,
  uploadStatus: UploadStatus,
): UploadStartDecision {
  if (uploadStatus === 'uploading') return { kind: 'idempotent' };
  if (uploadStatus === 'uploaded') return { kind: 'reject' };

  return {
    kind: 'start',
    outcome: scenario === 'fail-once' && uploadStatus === 'idle' ? 'failed' : 'succeeded',
  };
}
