import type { CreateVideoInput } from '@/features/videos';

export type SelectedVideoMimeType = 'video/mp4' | 'video/quicktime';

export interface SelectedVideoAsset {
  uri: string;
  fileName: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  mimeType: SelectedVideoMimeType;
}

export type UploadPhase =
  | 'idle'
  | 'selected'
  | 'creating-video'
  | 'starting-upload'
  | 'uploading'
  | 'upload-failed'
  | 'upload-succeeded';

export type UploadFailureKind = 'create' | 'start' | 'upload' | null;

export type UploadFormValues = Pick<
  CreateVideoInput,
  'title' | 'matchType' | 'playMode' | 'courtType' | 'note'
>;
