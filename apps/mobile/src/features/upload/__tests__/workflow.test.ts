import { describe, expect, it } from 'vitest';

import {
  clampProgress,
  getLeaveProtectionKind,
  phaseForUploadStatus,
  retryRequiresCreate,
  shouldApplyLatestPickerResult,
  shouldNavigateToUploadedVideo,
  shouldOpenLeavePrompt,
  shouldPollUpload,
} from '../workflow';

describe('upload workflow pure logic', () => {
  it.each([
    ['uploading', 'uploading'],
    ['failed', 'upload-failed'],
    ['canceled', 'upload-failed'],
    ['uploaded', 'upload-succeeded'],
  ] as const)('maps %s to %s', (status, phase) => {
    expect(phaseForUploadStatus(status, 'starting-upload')).toBe(phase);
  });

  it('keeps explicit creating and starting phases without a service status', () => {
    expect(phaseForUploadStatus(undefined, 'creating-video')).toBe('creating-video');
    expect(phaseForUploadStatus('idle', 'starting-upload')).toBe('starting-upload');
  });

  it('polls only uploading and stops at terminal states', () => {
    expect(shouldPollUpload('uploading')).toBe(true);
    expect(shouldPollUpload('uploaded')).toBe(false);
    expect(shouldPollUpload('failed')).toBe(false);
  });

  it('distinguishes draft and active-upload leave protection', () => {
    expect(
      getLeaveProtectionKind({
        hasSelectedAsset: true,
        isFormDirty: false,
        hasVideoId: false,
        phase: 'selected',
        bypass: false,
      }),
    ).toBe('draft');
    expect(
      getLeaveProtectionKind({
        hasSelectedAsset: true,
        isFormDirty: true,
        hasVideoId: true,
        phase: 'uploading',
        bypass: false,
      }),
    ).toBe('uploading');
  });

  it('bypasses protection after success', () => {
    expect(
      getLeaveProtectionKind({
        hasSelectedAsset: true,
        isFormDirty: true,
        hasVideoId: true,
        phase: 'upload-succeeded',
        bypass: false,
      }),
    ).toBeNull();
  });

  it('retries an existing video without creating a new one', () => {
    expect(retryRequiresCreate('video-1')).toBe(false);
    expect(retryRequiresCreate(null)).toBe(true);
  });

  it('allows uploaded navigation exactly once', () => {
    expect(shouldNavigateToUploadedVideo(true, false)).toBe(true);
    expect(shouldNavigateToUploadedVideo(true, true)).toBe(false);
    expect(shouldNavigateToUploadedVideo(false, false)).toBe(false);
  });

  it('applies only the latest picker result when multiple selections race', () => {
    expect(shouldApplyLatestPickerResult(2, 2)).toBe(true);
    expect(shouldApplyLatestPickerResult(1, 2)).toBe(false);
  });

  it('opens at most one leave prompt while bypass is disabled', () => {
    expect(shouldOpenLeavePrompt(false, false)).toBe(true);
    expect(shouldOpenLeavePrompt(true, false)).toBe(false);
    expect(shouldOpenLeavePrompt(false, true)).toBe(false);
  });

  it('clamps progress and handles non-finite values', () => {
    expect(clampProgress(-1)).toBe(0);
    expect(clampProgress(58.5)).toBe(58.5);
    expect(clampProgress(101)).toBe(100);
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});
