import type { AnalysisStage, AnalysisStatus, AppError, UploadStatus } from '@tennis/shared-types';

import type { WebVideoRecord } from '../demo-data';
import { getWebAnalysisStatus } from './videoStatus';

type TagColor = 'default' | 'blue' | 'cyan' | 'green' | 'orange' | 'red';

export type StatusPresentation = { label: string; color: TagColor };
export type SafeProgress = { value: number | null; label: string };

const uploadStatusPresentation: Record<UploadStatus, StatusPresentation> = {
  idle: { label: '等待上传', color: 'orange' },
  uploading: { label: '正在上传', color: 'blue' },
  uploaded: { label: '上传完成', color: 'green' },
  failed: { label: '上传失败', color: 'red' },
  canceled: { label: '上传已取消', color: 'default' },
};

const analysisStatusPresentation: Record<AnalysisStatus, StatusPresentation> = {
  queued: { label: '等待分析', color: 'orange' },
  processing: { label: '正在分析', color: 'blue' },
  succeeded: { label: '分析完成', color: 'green' },
  failed: { label: '分析失败', color: 'red' },
  canceled: { label: '分析已取消', color: 'default' },
};

const stageLabels: Record<AnalysisStage, string> = {
  queued: '等待分析',
  court_detection: '识别球场',
  player_detection: '识别球员',
  ball_tracking: '追踪网球',
  trajectory_processing: '处理运动轨迹',
  event_extraction: '提取击球事件',
  statistics_generation: '生成统计结果',
  completed: '分析完成',
};

export function normalizeRouteVideoId(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function formatVideoTitle(title: string | null | undefined, fileName?: string): string {
  return title?.trim() || fileName?.trim() || '未命名视频';
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) return '数据待确认';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value));
  } catch {
    return '数据待确认';
  }
}

export function formatFileSize(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0) {
    return '数据待确认';
  }
  if (value < 1_024) return `${Math.floor(value)} B`;
  if (value < 1_024 ** 2) return `${(value / 1_024).toFixed(1)} KB`;
  if (value < 1_024 ** 3) return `${(value / 1_024 ** 2).toFixed(1)} MB`;
  return `${(value / 1_024 ** 3).toFixed(1)} GB`;
}

export function formatDuration(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0) {
    return '数据待确认';
  }
  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} 秒`;
  return seconds === 0 ? `${minutes} 分钟` : `${minutes} 分 ${seconds} 秒`;
}

export function getUploadStatusPresentation(value: string): StatusPresentation {
  return (
    uploadStatusPresentation[value as UploadStatus] ?? { label: '上传状态待确认', color: 'default' }
  );
}

export function getAnalysisStatusPresentation(record: WebVideoRecord): StatusPresentation {
  const status = getWebAnalysisStatus(record);
  if (status === 'not_ready') return { label: '不可分析', color: 'default' };
  if (status === 'not_created') return { label: '未创建任务', color: 'orange' };
  return analysisStatusPresentation[status] ?? { label: '分析状态待确认', color: 'default' };
}

export function getAnalysisStageLabel(value: string | null | undefined): string {
  return value && value in stageLabels ? stageLabels[value as AnalysisStage] : '阶段待确认';
}

export function getSafeProgress(
  value: number | null | undefined,
  options: { succeeded?: boolean; missingLabel?: string } = {},
): SafeProgress {
  if (options.succeeded) return { value: 100, label: '100%' };
  if (value === null || value === undefined) {
    return { value: null, label: options.missingLabel ?? '—' };
  }
  if (!Number.isFinite(value) || value < 0) return { value: null, label: '数据待确认' };
  const normalized = Math.min(100, Math.round(value));
  return { value: normalized, label: `${normalized}%` };
}

export function getSafeAppErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) return fallback;
  const candidate = error as Partial<AppError>;
  return typeof candidate.userMessage === 'string' && candidate.userMessage.trim()
    ? candidate.userMessage.trim()
    : fallback;
}

export type WebVideoTableItem = {
  key: string;
  videoId: string;
  userId: string;
  title: string;
  createdAt: string;
  fileSize: string;
  duration: string;
  uploadStatus: StatusPresentation;
  analysisStatus: StatusPresentation;
  analysisProgress: SafeProgress;
};

export function createWebVideoTableItem(record: WebVideoRecord): WebVideoTableItem {
  const { video, analysisTask } = record;
  return {
    key: video.id,
    videoId: video.id,
    userId: video.userId,
    title: formatVideoTitle(video.title, video.originalFileName),
    createdAt: formatDateTime(video.createdAt),
    fileSize: formatFileSize(video.fileSizeBytes),
    duration: formatDuration(video.durationSeconds),
    uploadStatus: getUploadStatusPresentation(video.uploadStatus),
    analysisStatus: getAnalysisStatusPresentation(record),
    analysisProgress: getSafeProgress(analysisTask?.progress, {
      succeeded: analysisTask?.status === 'succeeded',
    }),
  };
}

export const matchTypeLabels = { training: '训练', match: '比赛' } as const;
export const playModeLabels = { singles: '单打', doubles: '双打' } as const;
export const courtTypeLabels = {
  hard: '硬地',
  clay: '红土',
  grass: '草地',
  other: '其他',
} as const;
