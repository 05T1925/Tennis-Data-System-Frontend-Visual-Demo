import type { UploadStatus } from '@tennis/shared-types';

import type { UploadPhase } from './types';

export type LeaveProtectionKind = 'draft' | 'uploading' | null;

export function clampProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(100, Math.max(0, progress));
}

export function shouldPollUpload(uploadStatus: UploadStatus | undefined) {
  return uploadStatus === 'uploading';
}

export function phaseForUploadStatus(
  uploadStatus: UploadStatus | undefined,
  fallback: UploadPhase,
): UploadPhase {
  if (uploadStatus === 'uploaded') return 'upload-succeeded';
  if (uploadStatus === 'failed' || uploadStatus === 'canceled') return 'upload-failed';
  if (uploadStatus === 'uploading') return 'uploading';
  return fallback;
}

export function getLeaveProtectionKind(options: {
  hasSelectedAsset: boolean;
  isFormDirty: boolean;
  hasVideoId: boolean;
  phase: UploadPhase;
  bypass: boolean;
}): LeaveProtectionKind {
  if (options.bypass || options.phase === 'upload-succeeded') return null;
  if (options.phase === 'uploading') return 'uploading';
  if (options.hasSelectedAsset || options.isFormDirty || options.hasVideoId) return 'draft';
  return null;
}

export function shouldNavigateToUploadedVideo(uploaded: boolean, alreadyHandled: boolean) {
  return uploaded && !alreadyHandled;
}

export function shouldApplyLatestPickerResult(requestId: number, latestRequestId: number) {
  return requestId === latestRequestId;
}

export function shouldOpenLeavePrompt(promptOpen: boolean, bypass: boolean) {
  return !promptOpen && !bypass;
}

export function retryRequiresCreate(videoId: string | null) {
  return !videoId;
}
