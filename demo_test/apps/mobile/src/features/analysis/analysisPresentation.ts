import type {
  AnalysisResult,
  AnalysisStage,
  AnalysisStatus,
  AnalysisTask,
} from '@tennis/shared-types';

export const ANALYSIS_QUEUED_POLL_INTERVAL_MS = 3_000;
export const ANALYSIS_PROCESSING_POLL_INTERVAL_MS = 2_000;

type PollingIntervalOptions = {
  status: AnalysisStatus | string | null | undefined;
  isScreenFocused: boolean;
  appState: string | null | undefined;
  hasQueryError: boolean;
};

type ResumeDecisionOptions = {
  previousEnvironmentActive: boolean;
  currentEnvironmentActive: boolean;
  isInitialObservation: boolean;
  capturedGeneration: number;
  currentGeneration: number;
};

export type AnalysisSummaryItem = {
  key: string;
  label: string;
  value: string;
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

const statusLabels: Record<AnalysisStatus, string> = {
  queued: '等待分析',
  processing: '正在分析',
  succeeded: '分析完成',
  failed: '分析失败',
  canceled: '分析已取消',
};

export function getAnalysisPollingInterval({
  status,
  isScreenFocused,
  appState,
  hasQueryError,
}: PollingIntervalOptions): number | false {
  if (!isScreenFocused || appState !== 'active' || hasQueryError) return false;
  if (status === 'queued') return ANALYSIS_QUEUED_POLL_INTERVAL_MS;
  if (status === 'processing') return ANALYSIS_PROCESSING_POLL_INTERVAL_MS;
  return false;
}

export function shouldTriggerAnalysisResume({
  previousEnvironmentActive,
  currentEnvironmentActive,
  isInitialObservation,
  capturedGeneration,
  currentGeneration,
}: ResumeDecisionOptions) {
  return (
    !isInitialObservation &&
    !previousEnvironmentActive &&
    currentEnvironmentActive &&
    capturedGeneration === currentGeneration
  );
}

export function isTerminalAnalysisStatus(status: string | null | undefined) {
  return status === 'succeeded' || status === 'failed' || status === 'canceled';
}

export function getAnalysisStatusLabel(status: string | null | undefined) {
  return status && status in statusLabels
    ? statusLabels[status as AnalysisStatus]
    : '分析状态待确认';
}

export function getAnalysisStageLabel(stage: string | null | undefined) {
  return stage && stage in stageLabels ? stageLabels[stage as AnalysisStage] : '当前阶段待确认';
}

export function getSafeAnalysisProgress(task: AnalysisTask | null | undefined): number | null {
  if (!task) return null;
  if (task.status === 'succeeded') return 100;
  if (!Number.isFinite(task.progress)) return 0;
  return Math.min(100, Math.max(0, Math.round(task.progress)));
}

export function canRetryAnalysis(options: {
  userId: string;
  videoId: string;
  uploadStatus: string | null | undefined;
  taskStatus: string | null | undefined;
}) {
  return (
    options.userId.trim().length > 0 &&
    options.videoId.trim().length > 0 &&
    options.uploadStatus === 'uploaded' &&
    options.taskStatus === 'failed'
  );
}

export function shouldEnableAnalysisResult(options: {
  userId: string;
  videoId: string;
  uploadStatus: string | null | undefined;
  taskStatus: string | null | undefined;
}) {
  return (
    options.userId.trim().length > 0 &&
    options.videoId.trim().length > 0 &&
    options.uploadStatus === 'uploaded' &&
    options.taskStatus === 'succeeded'
  );
}

function isSafeMetric(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value >= 0;
}

function formatMetric(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits }).format(value);
}

function formatDuration(value: number) {
  if (!isSafeMetric(value)) return '数据待确认';
  const seconds = Math.floor(value);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes === 0) return `${seconds} 秒`;
  if (remainder === 0) return `${minutes} 分钟`;
  return `${minutes} 分 ${remainder} 秒`;
}

export function createAnalysisSummaryItems(
  result: AnalysisResult | null | undefined,
): AnalysisSummaryItem[] {
  if (!result) return [];
  const { summary } = result;
  const items: AnalysisSummaryItem[] = [
    {
      key: 'duration',
      label: '分析时长',
      value: formatDuration(summary.durationSeconds),
    },
    {
      key: 'shots',
      label: '击球总数',
      value: isSafeMetric(summary.totalShots)
        ? `${formatMetric(summary.totalShots, 0)} 次`
        : '数据待确认',
    },
    {
      key: 'rallies',
      label: '回合总数',
      value: isSafeMetric(summary.totalRallies)
        ? `${formatMetric(summary.totalRallies, 0)} 个`
        : '数据待确认',
    },
    {
      key: 'average-shots',
      label: '平均每回合击球',
      value: isSafeMetric(summary.averageShotsPerRally)
        ? `${formatMetric(summary.averageShotsPerRally)} 次`
        : '数据待确认',
    },
  ];

  if (isSafeMetric(summary.totalPoints)) {
    items.splice(3, 0, {
      key: 'points',
      label: '得分点总数',
      value: `${formatMetric(summary.totalPoints, 0)} 个`,
    });
  }
  if (isSafeMetric(summary.maxBallSpeedKmh) && items.length < 6) {
    items.push({
      key: 'max-speed',
      label: '最高球速',
      value: `${formatMetric(summary.maxBallSpeedKmh)} km/h`,
    });
  }
  return items.slice(0, 6);
}
