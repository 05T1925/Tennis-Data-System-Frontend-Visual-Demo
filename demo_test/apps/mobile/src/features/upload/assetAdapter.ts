import type { ImagePickerAsset } from 'expo-image-picker';

import type { CreateVideoInput } from '@/features/videos';

import { MAX_VIDEO_FILE_SIZE_BYTES } from './constants';
import { VideoAssetError } from './errors';
import type { SelectedVideoAsset, SelectedVideoMimeType, UploadFormValues } from './types';

export type FileSizeResolver = (uri: string) => number | undefined | Promise<number | undefined>;

function fileNameFromUri(uri: string) {
  const withoutSuffix = uri.split(/[?#]/, 1)[0];
  const candidate = withoutSuffix.split('/').filter(Boolean).at(-1)?.trim();
  if (!candidate) return '未命名视频';
  try {
    return decodeURIComponent(candidate).trim() || '未命名视频';
  } catch {
    return candidate;
  }
}

function normalizeMimeType(asset: ImagePickerAsset, fileName: string): SelectedVideoMimeType {
  const mimeType = asset.mimeType?.trim().toLowerCase();
  if (mimeType) {
    if (mimeType === 'video/mp4' || mimeType === 'video/quicktime') return mimeType;
    throw new VideoAssetError('INVALID_VIDEO_TYPE');
  }

  const extension = fileName.toLowerCase().match(/\.([^.]+)$/)?.[1];
  if (extension === 'mp4') return 'video/mp4';
  if (extension === 'mov') return 'video/quicktime';
  throw new VideoAssetError('INVALID_VIDEO_TYPE');
}

function validateFileSize(fileSize: number | undefined) {
  if (fileSize === undefined) throw new VideoAssetError('MISSING_FILE_SIZE');
  if (!Number.isFinite(fileSize) || !Number.isInteger(fileSize) || fileSize < 0) {
    throw new VideoAssetError('MISSING_FILE_SIZE');
  }
  if (fileSize === 0) throw new VideoAssetError('EMPTY_VIDEO_FILE');
  if (fileSize > MAX_VIDEO_FILE_SIZE_BYTES) throw new VideoAssetError('VIDEO_TOO_LARGE');
  return fileSize;
}

function normalizeDuration(duration: number | null | undefined) {
  if (duration === null || duration === undefined) return undefined;
  if (!Number.isFinite(duration) || duration < 0) {
    throw new VideoAssetError('INVALID_VIDEO_DURATION');
  }
  return duration / 1_000;
}

export async function adaptImagePickerAsset(
  asset: ImagePickerAsset,
  resolveFileSize?: FileSizeResolver,
): Promise<SelectedVideoAsset> {
  if (asset.type !== 'video') throw new VideoAssetError('INVALID_VIDEO_TYPE');

  const uri = asset.uri.trim();
  if (!uri) throw new VideoAssetError('EMPTY_VIDEO_URI');

  const fileName = asset.fileName?.trim() || fileNameFromUri(uri);
  const mimeType = normalizeMimeType(asset, fileName);
  let fileSize = asset.fileSize;

  if (fileSize === undefined && asset.file) fileSize = asset.file.size;
  if (fileSize === undefined && resolveFileSize) {
    try {
      fileSize = await resolveFileSize(uri);
    } catch {
      fileSize = undefined;
    }
  }

  return {
    uri,
    fileName,
    fileSizeBytes: validateFileSize(fileSize),
    durationSeconds: normalizeDuration(asset.duration),
    mimeType,
  };
}

export function toVideoTitle(fileName: string) {
  const title = fileName.replace(/\.[^.]+$/, '').trim();
  return title || '未命名视频';
}

export function toCreateVideoInput(
  asset: SelectedVideoAsset,
  values: UploadFormValues,
): CreateVideoInput {
  return {
    title: values.title.trim(),
    originalFileName: asset.fileName,
    mimeType: asset.mimeType,
    fileSizeBytes: asset.fileSizeBytes,
    durationSeconds: asset.durationSeconds,
    matchType: values.matchType,
    playMode: values.playMode,
    courtType: values.courtType,
    note: values.note?.trim() || undefined,
  };
}
