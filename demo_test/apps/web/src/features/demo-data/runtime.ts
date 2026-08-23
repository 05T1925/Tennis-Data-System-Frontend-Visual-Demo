import type { AnalysisStage, AnalysisStatus, AnalysisTask } from '@tennis/shared-types';

import { createWebAnalysisAssets } from './analysisFixtures';
import type { WebAnalysisTaskLogEntry, WebDemoDataSnapshot } from './types';

type RuntimeStep = {
  afterMs: number;
  status: AnalysisStatus;
  stage: AnalysisStage;
  progress: number;
};

export const WEB_ANALYSIS_RUNTIME_STEPS: readonly RuntimeStep[] = [
  { afterMs: 0, status: 'queued', stage: 'queued', progress: 0 },
  { afterMs: 3_000, status: 'processing', stage: 'court_detection', progress: 15 },
  { afterMs: 5_000, status: 'processing', stage: 'player_detection', progress: 35 },
  { afterMs: 7_000, status: 'processing', stage: 'ball_tracking', progress: 55 },
  { afterMs: 9_000, status: 'processing', stage: 'trajectory_processing', progress: 72 },
  { afterMs: 11_000, status: 'processing', stage: 'event_extraction', progress: 86 },
  { afterMs: 13_000, status: 'processing', stage: 'statistics_generation', progress: 95 },
  { afterMs: 15_000, status: 'succeeded', stage: 'completed', progress: 100 },
];

function addMilliseconds(iso: string, milliseconds: number): string {
  return new Date(Date.parse(iso) + milliseconds).toISOString();
}

function runtimeLog(
  task: AnalysisTask,
  attempt: number,
  step: RuntimeStep,
  queuedAt: string,
): WebAnalysisTaskLogEntry {
  const completed = step.status === 'succeeded';
  return {
    id: `${task.id}-attempt-${attempt}-${step.stage}`,
    taskId: task.id,
    timestamp: addMilliseconds(queuedAt, step.afterMs),
    level: 'info',
    audience: completed ? 'user' : 'developer',
    userMessage: completed ? '重新分析已完成，新的 Demo 结果可以查看。' : undefined,
    developerMessage: completed
      ? undefined
      : `Demo runtime entered ${step.stage} at ${step.progress}% progress.`,
    stage: step.stage,
  };
}

export function materializeWebAnalysisRuntimes(
  snapshot: WebDemoDataSnapshot,
  now: Date,
): WebDemoDataSnapshot {
  let next = snapshot;
  for (const [taskId, runtime] of Object.entries(snapshot.analysisRuntimes)) {
    const task = next.analysisTasks.find(({ id }) => id === taskId);
    const video = task ? next.videos.find(({ id }) => id === task.videoId) : undefined;
    if (!task || !video || !['queued', 'processing'].includes(task.status)) continue;
    const elapsed = Math.max(0, now.getTime() - Date.parse(runtime.queuedAt));
    const reached = WEB_ANALYSIS_RUNTIME_STEPS.filter(({ afterMs }) => elapsed >= afterMs);
    const target = reached.at(-1) ?? WEB_ANALYSIS_RUNTIME_STEPS[0];
    const reachedLogs = reached
      .filter(({ afterMs }) => afterMs > 0)
      .map((step) => runtimeLog(task, runtime.attempt, step, runtime.queuedAt));
    const knownLogIds = new Set(next.analysisLogs.map(({ id }) => id));
    const newLogs = reachedLogs.filter(({ id }) => !knownLogIds.has(id));
    const completedAt =
      target.status === 'succeeded' ? addMilliseconds(runtime.queuedAt, 15_000) : undefined;
    const startedAt =
      target.status === 'processing' || target.status === 'succeeded'
        ? addMilliseconds(runtime.queuedAt, 3_000)
        : undefined;
    const updatedAt = addMilliseconds(runtime.queuedAt, target.afterMs);
    const updatedTask: AnalysisTask = {
      ...task,
      status: target.status,
      stage: target.stage,
      progress: target.progress,
      startedAt,
      completedAt,
      updatedAt,
    };
    const taskChanged =
      task.status !== updatedTask.status ||
      task.stage !== updatedTask.stage ||
      task.progress !== updatedTask.progress ||
      task.startedAt !== updatedTask.startedAt ||
      task.completedAt !== updatedTask.completedAt;
    if (!taskChanged && newLogs.length === 0) continue;

    const runtimes = { ...next.analysisRuntimes };
    let analysisResults = next.analysisResults;
    let cvDemoOutputs = next.cvDemoOutputs;
    if (target.status === 'succeeded') {
      delete runtimes[taskId];
      const assets = createWebAnalysisAssets(video, updatedTask, {
        attempt: runtime.attempt,
        createdAt: completedAt,
      });
      analysisResults = [
        ...analysisResults.filter(({ videoId }) => videoId !== video.id),
        assets.result,
      ];
      cvDemoOutputs = [
        ...cvDemoOutputs.filter(({ output }) => output.videoId !== video.id),
        assets.cv,
      ];
    }
    next = {
      ...next,
      analysisTasks: next.analysisTasks.map((candidate) =>
        candidate.id === taskId ? updatedTask : candidate,
      ),
      analysisResults,
      cvDemoOutputs,
      analysisLogs: [...next.analysisLogs, ...newLogs],
      analysisRuntimes: runtimes,
    };
  }
  return next;
}
