import type { EntityId, IsoDateTimeString } from './common';

export type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'failed' | 'canceled';

export type MatchType = 'training' | 'match';

export type PlayMode = 'singles' | 'doubles';

export type CourtType = 'hard' | 'clay' | 'grass' | 'other';

export interface Video {
  id: EntityId;
  userId: EntityId;
  title: string;
  originalFileName: string;
  storagePath?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  mimeType: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  matchType: MatchType;
  playMode: PlayMode;
  courtType?: CourtType;
  note?: string;
  uploadStatus: UploadStatus;
  /** Expected range: 0-100. This interface does not perform runtime validation. */
  uploadProgress: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
