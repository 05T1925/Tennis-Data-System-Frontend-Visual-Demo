import type { AnalysisTask, Video } from '@tennis/shared-types';

import { createInitialTaskLogs, createWebAnalysisAssets } from './analysisFixtures';
import type { WebAnalysisTaskLogEntry, WebDemoDataSnapshot, WebDemoScenarioKind } from './types';

export type WebDemoScenarioEntities = {
  video: Video;
  task: AnalysisTask;
  result: ReturnType<typeof createWebAnalysisAssets>['result'] | null;
  cv: ReturnType<typeof createWebAnalysisAssets>['cv'] | null;
  logs: WebAnalysisTaskLogEntry[];
};

function timestampIdPart(now: Date): string {
  return now.toISOString().replace(/[-:.]/g, '');
}

function collectSnapshotIds(snapshot: WebDemoDataSnapshot): Set<string> {
  const ids = new Set<string>();
  for (const video of snapshot.videos) ids.add(video.id);
  for (const task of snapshot.analysisTasks) ids.add(task.id);
  for (const result of snapshot.analysisResults) {
    ids.add(result.id);
    for (const shot of result.shots) ids.add(shot.id);
    for (const rally of result.rallies) ids.add(rally.id);
    for (const point of result.points ?? []) ids.add(point.id);
  }
  for (const cv of snapshot.cvDemoOutputs) {
    ids.add(cv.id);
    ids.add(cv.output.id);
  }
  for (const log of snapshot.analysisLogs) ids.add(log.id);
  return ids;
}

function createScenarioIds(
  snapshot: WebDemoDataSnapshot,
  now: Date,
  reservedIds: ReadonlySet<string>,
) {
  const existingIds = collectSnapshotIds(snapshot);
  for (const id of reservedIds) existingIds.add(id);
  const timestamp = timestampIdPart(now);
  let sequence = 1;
  while (true) {
    const suffix = sequence === 1 ? '' : `-${sequence}`;
    const videoId = `video-web-demo-created-${timestamp}${suffix}`;
    const taskId = `task-web-demo-created-${timestamp}${suffix}`;
    const collides = [...existingIds].some(
      (id) => id === videoId || id === taskId || id.startsWith(`${taskId}-`),
    );
    if (!collides) return { videoId, taskId };
    sequence += 1;
  }
}

export function createWebDemoScenarioEntities(
  snapshot: WebDemoDataSnapshot,
  kind: WebDemoScenarioKind,
  now: Date,
  reservedIds: ReadonlySet<string> = new Set(),
): WebDemoScenarioEntities {
  const { videoId, taskId } = createScenarioIds(snapshot, now, reservedIds);
  const timestamp = now.toISOString();
  const labels: Record<WebDemoScenarioKind, string> = {
    success: '分析成功',
    processing: '分析处理中',
    failed: '分析失败',
  };
  const video: Video = {
    id: videoId,
    userId: 'demo-user-control',
    title: `开发控制：${labels[kind]}场景`,
    originalFileName: `${videoId}.mp4`,
    mimeType: 'video/mp4',
    fileSizeBytes: 48_000_000,
    durationSeconds: 240,
    matchType: 'training',
    playMode: 'singles',
    courtType: 'hard',
    note: '开发环境创建的确定性 Web Demo 场景',
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const taskBase = {
    id: taskId,
    videoId,
    retryCount: kind === 'failed' ? 1 : 0,
    createdAt: timestamp,
    startedAt: timestamp,
    updatedAt: timestamp,
  };
  const task: AnalysisTask =
    kind === 'success'
      ? {
          ...taskBase,
          status: 'succeeded',
          stage: 'completed',
          progress: 100,
          completedAt: timestamp,
        }
      : kind === 'processing'
        ? {
            ...taskBase,
            status: 'processing',
            stage: 'ball_tracking',
            progress: 55,
          }
        : {
            ...taskBase,
            status: 'failed',
            stage: 'ball_tracking',
            progress: 55,
            completedAt: timestamp,
            errorCode: 'DEMO_CONTROL_ANALYSIS_FAILED',
            errorMessage: '演示分析任务未能完成。',
          };
  const assets = kind === 'success' ? createWebAnalysisAssets(video, task) : null;
  const logs = createInitialTaskLogs(task);
  if (kind === 'success') {
    logs.push({
      id: `${task.id}-control-success-developer`,
      taskId: task.id,
      timestamp,
      level: 'info',
      audience: 'developer',
      developerMessage: 'Demo control created a completed analysis fixture.',
      stage: 'completed',
    });
  }
  if (kind === 'processing') {
    logs.push({
      id: `${task.id}-control-processing-developer`,
      taskId: task.id,
      timestamp,
      level: 'info',
      audience: 'developer',
      developerMessage: 'Demo control created a static processing fixture at 55% progress.',
      stage: 'ball_tracking',
    });
  }
  return { video, task, result: assets?.result ?? null, cv: assets?.cv ?? null, logs };
}

export function createUniqueLogId(snapshot: WebDemoDataSnapshot, baseId: string): string {
  const ids = new Set(snapshot.analysisLogs.map(({ id }) => id));
  if (!ids.has(baseId)) return baseId;
  let sequence = 2;
  while (ids.has(`${baseId}-${sequence}`)) sequence += 1;
  return `${baseId}-${sequence}`;
}
