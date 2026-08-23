import type { AnalysisTask, Video } from '@tennis/shared-types';

import { theme } from '@/theme/tokens';

export type VideoFilter =
  'all' | 'upload-stage' | 'waiting-analysis' | 'analyzing' | 'completed' | 'exception';

type FilterCategory = Exclude<VideoFilter, 'all'> | null;
type StatusSemantic = 'warning' | 'info' | 'danger' | 'success' | 'neutral';

export type VideoStatusPresentation = {
  label: string;
  description: string;
  semantic: StatusSemantic;
  filter: FilterCategory;
  retryAllowed: boolean;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
};

export type TaskQuerySnapshot = {
  task: AnalysisTask | null | undefined;
  pending: boolean;
  error: boolean;
};

export type VideoListItemViewModel = {
  key: string;
  videoId: string;
  title: string;
  createdAtLabel: string;
  durationLabel: string;
  status: VideoStatusPresentation;
  canNavigate: boolean;
  canRetry: boolean;
  uploadProgressLabel: string | null;
};

export const videoFilterOptions: readonly { value: VideoFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'upload-stage', label: '上传阶段' },
  { value: 'waiting-analysis', label: '等待分析' },
  { value: 'analyzing', label: '分析中' },
  { value: 'completed', label: '已完成' },
  { value: 'exception', label: '异常' },
];

const semanticColors: Record<
  StatusSemantic,
  Pick<VideoStatusPresentation, 'textColor' | 'borderColor' | 'backgroundColor'>
> = {
  warning: {
    textColor: theme.colors.warning,
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.surface,
  },
  info: {
    textColor: theme.colors.info,
    borderColor: theme.colors.info,
    backgroundColor: theme.colors.surface,
  },
  danger: {
    textColor: theme.colors.danger,
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.surface,
  },
  success: {
    textColor: theme.colors.success,
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.surface,
  },
  neutral: {
    textColor: theme.colors.textSecondary,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
};

function status(
  label: string,
  description: string,
  semantic: StatusSemantic,
  filter: FilterCategory,
  retryAllowed = false,
): VideoStatusPresentation {
  return {
    label,
    description,
    semantic,
    filter,
    retryAllowed,
    ...semanticColors[semantic],
  };
}

const uploadStatuses: Record<string, VideoStatusPresentation> = {
  idle: status('等待上传', '视频尚未开始上传。', 'warning', 'upload-stage'),
  uploading: status('正在上传', '视频正在上传，请稍候。', 'info', 'upload-stage'),
  failed: status('上传失败', '视频上传未完成，可从上传流程重试。', 'danger', 'exception'),
  canceled: status('上传已取消', '本次视频上传已取消。', 'neutral', 'exception'),
};

const analysisStatuses: Record<string, VideoStatusPresentation> = {
  queued: status('等待分析', '分析任务已进入队列。', 'warning', 'waiting-analysis'),
  processing: status('正在分析', '系统正在处理这段视频。', 'info', 'analyzing'),
  succeeded: status('分析完成', '分析任务已完成。', 'success', 'completed'),
  failed: status('分析失败', '分析未完成，可以重新尝试。', 'danger', 'exception', true),
  canceled: status('分析已取消', '本次分析任务已取消。', 'neutral', 'exception'),
};

const unknownStatus = status('状态待确认', '暂时无法确认当前状态。', 'neutral', null);
const taskPendingStatus = status(
  '正在确认分析状态',
  '正在读取这段视频的分析状态。',
  'neutral',
  null,
);
const taskErrorStatus = status('分析状态暂不可用', '下拉刷新后可再次确认。', 'danger', null);
const missingTaskStatus = status(
  '等待分析',
  '分析任务尚未建立或正在准备。',
  'warning',
  'waiting-analysis',
);

export function getVideoStatusPresentation(
  video: Video,
  taskSnapshot: TaskQuerySnapshot,
): VideoStatusPresentation {
  const uploadStatus = video.uploadStatus as string;
  if (uploadStatus !== 'uploaded') return uploadStatuses[uploadStatus] ?? unknownStatus;
  if (taskSnapshot.pending) return taskPendingStatus;
  if (taskSnapshot.error) return taskErrorStatus;
  if (!taskSnapshot.task) return missingTaskStatus;
  return analysisStatuses[taskSnapshot.task.status as string] ?? unknownStatus;
}

export function formatVideoTitle(value: string | null | undefined) {
  return typeof value === 'string' && value.trim() ? value.trim() : '未命名训练';
}

export function formatVideoCreatedAt(value: string | null | undefined) {
  if (!value || Number.isNaN(Date.parse(value))) return '时间待确认';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '时间待确认';
  }
}

export function formatVideoDuration(durationSeconds: number | undefined) {
  if (durationSeconds === undefined || !Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return '时长待确认';
  }
  if (durationSeconds === 0) return '0 秒';
  const totalSeconds = Math.floor(durationSeconds);
  if (totalSeconds === 0) return '不足 1 秒';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} 秒`;
  if (seconds === 0) return `${minutes} 分钟`;
  return `${minutes} 分 ${seconds} 秒`;
}

export function getUniqueValidVideoIds(videos: readonly Video[]) {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const video of videos) {
    const videoId = video.id.trim();
    if (!videoId || seen.has(videoId)) continue;
    seen.add(videoId);
    ids.push(videoId);
  }
  return ids;
}

export function createVideoListViewModels(
  videos: readonly Video[],
  taskSnapshots: ReadonlyMap<string, TaskQuerySnapshot>,
): VideoListItemViewModel[] {
  const keyOccurrences = new Map<string, number>();
  return videos.map((video) => {
    const videoId = video.id.trim();
    const taskSnapshot = taskSnapshots.get(videoId) ?? {
      task: null,
      pending: video.uploadStatus === 'uploaded' && videoId.length > 0,
      error: false,
    };
    const statusPresentation = getVideoStatusPresentation(video, taskSnapshot);
    const keyBase = [
      videoId || 'missing-id',
      video.createdAt || 'missing-time',
      video.originalFileName?.trim() || 'missing-file',
    ].join(':');
    const occurrence = keyOccurrences.get(keyBase) ?? 0;
    keyOccurrences.set(keyBase, occurrence + 1);
    const progress = Number.isFinite(video.uploadProgress)
      ? Math.min(100, Math.max(0, Math.floor(video.uploadProgress)))
      : null;

    return {
      key: occurrence === 0 ? keyBase : `${keyBase}:duplicate-${occurrence}`,
      videoId,
      title: formatVideoTitle(video.title),
      createdAtLabel: formatVideoCreatedAt(video.createdAt),
      durationLabel: formatVideoDuration(video.durationSeconds),
      status: statusPresentation,
      canNavigate: videoId.length > 0,
      canRetry:
        videoId.length > 0 &&
        video.uploadStatus === 'uploaded' &&
        taskSnapshot.task?.status === 'failed' &&
        statusPresentation.retryAllowed,
      uploadProgressLabel:
        video.uploadStatus === 'uploading' && progress !== null ? `已上传 ${progress}%` : null,
    };
  });
}

export function filterVideoListItems(
  items: readonly VideoListItemViewModel[],
  filter: VideoFilter,
) {
  if (filter === 'all') return [...items];
  return items.filter((item) => item.status.filter === filter);
}

export function pruneRetryErrorsByVideoItems(
  errors: ReadonlyMap<string, string>,
  items: readonly VideoListItemViewModel[],
): ReadonlyMap<string, string> {
  const retryableVideoIds = new Set(
    items.filter((item) => item.canRetry).map((item) => item.videoId),
  );
  let changed = false;
  const next = new Map<string, string>();

  for (const [videoId, message] of errors) {
    if (retryableVideoIds.has(videoId)) {
      next.set(videoId, message);
    } else {
      changed = true;
    }
  }

  return changed ? next : errors;
}
