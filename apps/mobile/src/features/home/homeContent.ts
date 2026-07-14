import type { AppError, User } from '@tennis/shared-types';

export const filmingTips = [
  '固定手机并尽量横屏拍摄',
  '保证完整球场进入画面',
  '保持光线充足并减少遮挡',
] as const;

function safeNonNegativeNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function getUserDisplayName(user: User | null) {
  const displayName = user?.displayName.trim();
  if (displayName) return displayName;

  const emailName = user?.email?.split('@')[0]?.trim();
  return emailName || '球友';
}

export function getGreeting(user: User | null, now = new Date()) {
  const hour = now.getHours();
  const timeGreeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
  return `${timeGreeting}，${getUserDisplayName(user)}`;
}

export function formatCount(value: number) {
  const normalized = Math.floor(safeNonNegativeNumber(value));

  try {
    return new Intl.NumberFormat('zh-CN').format(normalized);
  } catch {
    return String(normalized);
  }
}

function formatHoursAndMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} 分钟`;
  if (minutes === 0) return `${hours} 小时`;
  return `${hours} 小时 ${minutes} 分钟`;
}

export function formatTrainingDuration(durationMs: number) {
  const normalized = safeNonNegativeNumber(durationMs);
  return formatHoursAndMinutes(Math.floor(normalized / 60_000));
}

export function formatVideoDuration(durationSeconds?: number) {
  if (durationSeconds === undefined) return '时长待确认';

  const normalized = safeNonNegativeNumber(durationSeconds);
  if (normalized > 0 && normalized < 60) return '不足 1 分钟';
  return formatHoursAndMinutes(Math.floor(normalized / 60));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value || Number.isNaN(Date.parse(value))) return '时间待确认';

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '时间待确认';
  }
}

export function formatUploadStatus(status: string | null | undefined) {
  switch (status) {
    case 'idle':
      return '等待上传';
    case 'uploading':
      return '正在上传';
    case 'uploaded':
      return '上传完成';
    case 'failed':
      return '上传失败';
    case 'canceled':
      return '已取消';
    default:
      return '状态待确认';
  }
}

export function formatAnalysisStatus(status: string | null | undefined) {
  switch (status) {
    case 'queued':
      return '等待分析';
    case 'processing':
      return '正在分析';
    case 'succeeded':
      return '分析完成';
    case 'failed':
      return '分析失败';
    case 'canceled':
      return '已取消';
    default:
      return '状态待确认';
  }
}

export function formatVideoTitle(value: string) {
  return value.trim() || '未命名训练视频';
}

export function getErrorMessage(error: AppError | null, fallback: string) {
  const message = error?.userMessage;
  return typeof message === 'string' && message.trim() ? message.trim() : fallback;
}
