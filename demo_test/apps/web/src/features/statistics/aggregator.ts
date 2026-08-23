import type { AnalysisTask, Video } from '@tennis/shared-types';

import { getSafeAnalysisFailureMessage, type WebDemoDataSnapshot } from '../demo-data';
import { getWebAnalysisStatus } from '../videos/videoStatus';
import { getLastSevenLocalDays, getLocalDateKey, getLocalDayBounds } from './localDate';
import type {
  WebActiveTaskItem,
  WebDurationBucket,
  WebDurationDistributionItem,
  WebOverviewStatistics,
  WebOverviewStatusBucket,
  WebRecentFailureItem,
  WebRecentUploadItem,
  WebStatusDistributionItem,
} from './types';

const statusBuckets: readonly WebOverviewStatusBucket[] = [
  'waiting_upload',
  'uploading',
  'upload_failed',
  'upload_canceled',
  'task_not_created',
  'queued',
  'processing',
  'succeeded',
  'analysis_failed',
  'analysis_canceled',
];

const durationBuckets: readonly WebDurationBucket[] = [
  'under_1_minute',
  '1_to_3_minutes',
  '3_to_6_minutes',
  '6_to_10_minutes',
  '10_minutes_or_more',
  'unconfirmed',
];

function safeTitle(video: Video): string {
  return video.title.trim() || video.originalFileName.trim() || '未命名视频';
}

function validTime(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sortNewest<T>(
  items: readonly T[],
  timeOf: (item: T) => string,
  idOf: (item: T) => string,
): T[] {
  return [...items].sort((left, right) => {
    const leftTime = validTime(timeOf(left));
    const rightTime = validTime(timeOf(right));
    if (leftTime !== null && rightTime !== null) {
      return rightTime - leftTime || idOf(left).localeCompare(idOf(right));
    }
    if (leftTime !== null) return -1;
    if (rightTime !== null) return 1;
    return idOf(left).localeCompare(idOf(right));
  });
}

function statusBucket(video: Video, task: AnalysisTask | undefined): WebOverviewStatusBucket {
  if (video.uploadStatus === 'idle') return 'waiting_upload';
  if (video.uploadStatus === 'uploading') return 'uploading';
  if (video.uploadStatus === 'failed') return 'upload_failed';
  if (video.uploadStatus === 'canceled') return 'upload_canceled';
  if (!task) return 'task_not_created';
  if (task.status === 'queued') return 'queued';
  if (task.status === 'processing') return 'processing';
  if (task.status === 'succeeded') return 'succeeded';
  if (task.status === 'failed') return 'analysis_failed';
  return 'analysis_canceled';
}

function durationBucket(duration: number | null | undefined): WebDurationBucket {
  if (duration === null || duration === undefined || !Number.isFinite(duration) || duration < 0) {
    return 'unconfirmed';
  }
  if (duration < 60) return 'under_1_minute';
  if (duration < 180) return '1_to_3_minutes';
  if (duration < 360) return '3_to_6_minutes';
  if (duration < 600) return '6_to_10_minutes';
  return '10_minutes_or_more';
}

export function aggregateWebOverviewStatistics(
  snapshot: WebDemoDataSnapshot,
  referenceTime: Date,
): WebOverviewStatistics {
  const tasksByVideo = new Map(snapshot.analysisTasks.map((task) => [task.videoId, task]));
  const { startMs: todayStart, endMs: todayEnd } = getLocalDayBounds(referenceTime);
  const localDays = getLastSevenLocalDays(referenceTime);
  const trendCounts = new Map(localDays.map(({ dateKey }) => [dateKey, 0]));
  let todayCreatedVideos = 0;
  for (const video of snapshot.videos) {
    const createdAt = validTime(video.createdAt);
    if (createdAt === null) continue;
    if (createdAt >= todayStart && createdAt < todayEnd) todayCreatedVideos += 1;
    const dateKey = getLocalDateKey(new Date(createdAt));
    if (trendCounts.has(dateKey)) trendCounts.set(dateKey, (trendCounts.get(dateKey) ?? 0) + 1);
  }

  const statusCounts = new Map(statusBuckets.map((bucket) => [bucket, 0]));
  const durationCounts = new Map(durationBuckets.map((bucket) => [bucket, 0]));
  for (const video of snapshot.videos) {
    const bucket = statusBucket(video, tasksByVideo.get(video.id));
    statusCounts.set(bucket, (statusCounts.get(bucket) ?? 0) + 1);
    const duration = durationBucket(video.durationSeconds);
    durationCounts.set(duration, (durationCounts.get(duration) ?? 0) + 1);
  }

  const succeededTasks = snapshot.analysisTasks.filter(({ status }) => status === 'succeeded');
  const failedTasks = snapshot.analysisTasks.filter(({ status }) => status === 'failed');
  const durations = succeededTasks.flatMap((task) => {
    const started = validTime(task.startedAt);
    const completed = validTime(task.completedAt);
    return started !== null && completed !== null && completed >= started
      ? [(completed - started) / 1_000]
      : [];
  });
  const average =
    durations.length === 0
      ? null
      : Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
  const denominator = succeededTasks.length + failedTasks.length;

  const recentUploads: WebRecentUploadItem[] = sortNewest(
    snapshot.videos,
    ({ createdAt }) => createdAt,
    ({ id }) => id,
  )
    .slice(0, 5)
    .map((video) => ({
      videoId: video.id,
      title: safeTitle(video),
      userId: video.userId,
      createdAt: video.createdAt,
      uploadStatus: video.uploadStatus,
      analysisStatus: getWebAnalysisStatus({
        video,
        analysisTask: tasksByVideo.get(video.id) ?? null,
      }),
    }));

  const failures: WebRecentFailureItem[] = [];
  for (const video of snapshot.videos) {
    const task = tasksByVideo.get(video.id);
    if (video.uploadStatus === 'failed') {
      failures.push({
        videoId: video.id,
        title: safeTitle(video),
        failureType: 'upload',
        safeReason: '视频上传未能完成。',
        failedAt: video.updatedAt,
        retryCount: 0,
      });
    }
    if (task?.status === 'failed') {
      failures.push({
        videoId: video.id,
        title: safeTitle(video),
        failureType: 'analysis',
        safeReason: getSafeAnalysisFailureMessage(task.errorMessage),
        failedAt: task.completedAt ?? task.updatedAt,
        retryCount: task.retryCount,
      });
    }
  }

  const allActiveTasks: WebActiveTaskItem[] = sortNewest(
    snapshot.analysisTasks.filter(
      (task): task is AnalysisTask & { status: 'queued' | 'processing' } =>
        task.status === 'queued' || task.status === 'processing',
    ),
    ({ updatedAt }) => updatedAt,
    ({ id }) => id,
  ).flatMap((task) => {
    const video = snapshot.videos.find(({ id }) => id === task.videoId);
    return video
      ? [
          {
            videoId: video.id,
            taskId: task.id,
            title: safeTitle(video),
            status: task.status,
            stage: task.stage,
            progress: task.progress,
            updatedAt: task.updatedAt,
            runtimeActive: snapshot.analysisRuntimes[task.id] !== undefined,
          },
        ]
      : [];
  });

  return {
    generatedAt: referenceTime.toISOString(),
    referenceDate: getLocalDateKey(referenceTime),
    metrics: {
      totalVideos: snapshot.videos.length,
      todayCreatedVideos,
      waitingForAnalysis: snapshot.videos.filter((video) => {
        if (video.uploadStatus !== 'uploaded') return false;
        const task = tasksByVideo.get(video.id);
        return !task || task.status === 'queued';
      }).length,
      processing: snapshot.analysisTasks.filter(({ status }) => status === 'processing').length,
      succeeded: succeededTasks.length,
      failed: failedTasks.length,
      averageAnalysisDurationSeconds: average,
      averageAnalysisDurationSampleCount: durations.length,
    },
    uploadTrend: localDays.map(({ dateKey, label }) => ({
      dateKey,
      label,
      count: trendCounts.get(dateKey) ?? 0,
    })),
    statusDistribution: statusBuckets.map((bucket): WebStatusDistributionItem => ({
      bucket,
      count: statusCounts.get(bucket) ?? 0,
    })),
    successRate: {
      succeeded: succeededTasks.length,
      failed: failedTasks.length,
      denominator,
      rate: denominator === 0 ? null : succeededTasks.length / denominator,
    },
    durationDistribution: durationBuckets.map((bucket): WebDurationDistributionItem => ({
      bucket,
      count: durationCounts.get(bucket) ?? 0,
    })),
    recentUploads,
    recentFailures: sortNewest(
      failures,
      ({ failedAt }) => failedAt,
      ({ videoId }) => videoId,
    ).slice(0, 5),
    activeTasks: allActiveTasks.slice(0, 5),
    controllableTasks: allActiveTasks,
    runtimeActiveCount: Object.keys(snapshot.analysisRuntimes).length,
  };
}
