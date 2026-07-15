import { describe, expect, it } from 'vitest';

import { parseUploadMockScenario } from '@/config/env';

import { getUploadStartDecision } from '../services/uploadMockScenario';

describe('upload Mock scenario', () => {
  it('starts successfully in the success scenario', () => {
    expect(getUploadStartDecision('success', 'idle')).toEqual({
      kind: 'start',
      outcome: 'succeeded',
    });
  });

  it('fails only the first idle start in fail-once', () => {
    expect(getUploadStartDecision('fail-once', 'idle')).toEqual({
      kind: 'start',
      outcome: 'failed',
    });
  });

  it.each(['failed', 'canceled'] as const)('restarts %s as success', (status) => {
    expect(getUploadStartDecision('fail-once', status)).toEqual({
      kind: 'start',
      outcome: 'succeeded',
    });
  });

  it('keeps uploading idempotent and rejects uploaded', () => {
    expect(getUploadStartDecision('fail-once', 'uploading')).toEqual({ kind: 'idempotent' });
    expect(getUploadStartDecision('success', 'uploaded')).toEqual({ kind: 'reject' });
  });

  it('falls back unknown configuration to success', () => {
    expect(parseUploadMockScenario('unknown')).toBe('success');
    expect(parseUploadMockScenario(undefined)).toBe('success');
  });

  it('does not fail the persisted failed Seed video again', () => {
    expect(getUploadStartDecision('fail-once', 'failed')).toMatchObject({
      kind: 'start',
      outcome: 'succeeded',
    });
  });
});
