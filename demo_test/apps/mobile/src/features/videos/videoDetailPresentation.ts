import type { Video } from '@tennis/shared-types';

import { theme } from '@/theme/tokens';

import {
  formatVideoCreatedAt,
  formatVideoDuration,
  formatVideoTitle,
  getVideoStatusPresentation,
  type VideoStatusPresentation,
} from './videoPresentation';

export function normalizeVideoId(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const normalized = candidate?.trim() ?? '';
  return normalized || null;
}

export function formatVideoFileSize(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0) {
    return '文件大小待确认';
  }
  if (value < 1_024) return `${Math.floor(value)} B`;
  if (value < 1_024 ** 2) return `${(value / 1_024).toFixed(1)} KB`;
  if (value < 1_024 ** 3) return `${(value / 1_024 ** 2).toFixed(1)} MB`;
  return `${(value / 1_024 ** 3).toFixed(1)} GB`;
}

export function formatVideoNote(value: string | null | undefined) {
  return value?.trim() || '未填写备注';
}

export function formatMatchType(value: string | null | undefined) {
  if (value === 'training') return '训练';
  if (value === 'match') return '比赛';
  return '类型待确认';
}

export function formatPlayMode(value: string | null | undefined) {
  if (value === 'singles') return '单打';
  if (value === 'doubles') return '双打';
  return '赛制待确认';
}

export function formatCourtType(value: string | null | undefined) {
  if (value === 'hard') return '硬地';
  if (value === 'clay') return '红土';
  if (value === 'grass') return '草地';
  if (value === 'other') return '其他';
  return '场地待确认';
}

const uploadedPresentation: VideoStatusPresentation = {
  label: '上传完成',
  description: '视频已上传，可以查看分析状态。',
  semantic: 'success',
  filter: null,
  retryAllowed: false,
  textColor: theme.colors.success,
  borderColor: theme.colors.success,
  backgroundColor: theme.colors.surface,
};

export function getUploadStatusPresentation(video: Video) {
  if (video.uploadStatus === 'uploaded') return uploadedPresentation;
  return getVideoStatusPresentation(video, { task: null, pending: false, error: false });
}

export function createVideoDetailFields(video: Video) {
  return [
    { key: 'created-at', label: '创建时间', value: formatVideoCreatedAt(video.createdAt) },
    { key: 'duration', label: '视频时长', value: formatVideoDuration(video.durationSeconds) },
    {
      key: 'file-name',
      label: '原始文件名',
      value: video.originalFileName.trim() || '文件名待确认',
    },
    { key: 'file-size', label: '文件大小', value: formatVideoFileSize(video.fileSizeBytes) },
    { key: 'match-type', label: '内容类型', value: formatMatchType(video.matchType) },
    { key: 'play-mode', label: '比赛形式', value: formatPlayMode(video.playMode) },
    { key: 'court-type', label: '场地类型', value: formatCourtType(video.courtType) },
    { key: 'note', label: '备注', value: formatVideoNote(video.note) },
  ];
}

export { formatVideoTitle };
