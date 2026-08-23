import type { AnalysisStage, AnalysisStatus, UploadStatus } from '@tennis/shared-types';

import type { WebDurationBucket, WebOverviewStatusBucket, WebRecentFailureItem } from './types';

export const overviewStatusPresentation: Record<
  WebOverviewStatusBucket,
  { label: string; color: string }
> = {
  waiting_upload: { label: '等待上传', color: '#9a6700' },
  uploading: { label: '正在上传', color: '#2f6590' },
  upload_failed: { label: '上传失败', color: '#b33c35' },
  upload_canceled: { label: '上传已取消', color: '#7b8580' },
  task_not_created: { label: '待创建任务', color: '#b58a16' },
  queued: { label: '队列中', color: '#d18b21' },
  processing: { label: '分析中', color: '#1778a5' },
  succeeded: { label: '分析成功', color: '#28775c' },
  analysis_failed: { label: '分析失败', color: '#d04b40' },
  analysis_canceled: { label: '分析已取消', color: '#616c67' },
};

export const durationBucketPresentation: Record<
  WebDurationBucket,
  { label: string; color: string }
> = {
  under_1_minute: { label: '<1 分钟', color: '#5299c5' },
  '1_to_3_minutes': { label: '1–3 分钟', color: '#327ab7' },
  '3_to_6_minutes': { label: '3–6 分钟', color: '#26755a' },
  '6_to_10_minutes': { label: '6–10 分钟', color: '#a87517' },
  '10_minutes_or_more': { label: '≥10 分钟', color: '#a44e45' },
  unconfirmed: { label: '数据待确认', color: '#7b8580' },
};

const uploadLabels: Record<UploadStatus, string> = {
  idle: '等待上传',
  uploading: '正在上传',
  uploaded: '上传完成',
  failed: '上传失败',
  canceled: '上传已取消',
};

const analysisLabels: Record<AnalysisStatus | 'not_ready' | 'not_created', string> = {
  not_ready: '不可分析',
  not_created: '未创建任务',
  queued: '等待分析',
  processing: '正在分析',
  succeeded: '分析完成',
  failed: '分析失败',
  canceled: '分析已取消',
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

export function formatAverageAnalysisDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '—';
  const rounded = Math.round(seconds);
  if (rounded < 60) return `${rounded} 秒`;
  const minutes = Math.floor(rounded / 60);
  const remaining = rounded % 60;
  return remaining === 0 ? `${minutes} 分钟` : `${minutes} 分 ${remaining} 秒`;
}

export function formatAnalysisSuccessRate(rate: number | null): string {
  if (rate === null || !Number.isFinite(rate) || rate < 0 || rate > 1) return '—';
  return `${Math.round(rate * 100)}%`;
}

export function formatSafeProgress(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '数据待确认';
  return `${Math.min(100, Math.round(value))}%`;
}

export function formatOverviewDateTime(value: string): string {
  if (!Number.isFinite(Date.parse(value))) return '数据待确认';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

export function getOverviewUploadLabel(status: UploadStatus): string {
  return uploadLabels[status];
}

export function getOverviewAnalysisLabel(status: keyof typeof analysisLabels): string {
  return analysisLabels[status];
}

export function getOverviewStageLabel(stage: AnalysisStage): string {
  return stageLabels[stage];
}

export function getFailureTypeLabel(type: WebRecentFailureItem['failureType']): string {
  return type === 'upload' ? '上传失败' : '分析失败';
}

export function formatVideoTooltip(value: number): string {
  return Number.isFinite(value) && value >= 0 ? `${Math.round(value)} 个视频` : '数据待确认';
}
