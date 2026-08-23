import type { AnalysisStage, AnalysisStatus } from '@tennis/shared-types';

import { createAnalysisResult, createAnalysisTask } from './factories';
import type { Clock, DemoDataSnapshot, IdGenerator } from './types';

export const DEFAULT_UPLOAD_DURATION_MS = 5_000;
export const DEFAULT_ANALYSIS_STAGE_DURATION_MS = 1_000;
export const ANALYSIS_STAGES: readonly {
  stage: AnalysisStage;
  status: AnalysisStatus;
  progress: number;
}[] = [
  { stage: 'queued', status: 'queued', progress: 0 },
  { stage: 'court_detection', status: 'processing', progress: 10 },
  { stage: 'player_detection', status: 'processing', progress: 25 },
  { stage: 'ball_tracking', status: 'processing', progress: 45 },
  { stage: 'trajectory_processing', status: 'processing', progress: 65 },
  { stage: 'event_extraction', status: 'processing', progress: 80 },
  { stage: 'statistics_generation', status: 'processing', progress: 92 },
  { stage: 'completed', status: 'succeeded', progress: 100 },
];

export function reconcileDemoData(
  snapshot: DemoDataSnapshot,
  clock: Clock,
  idGenerator: IdGenerator,
): DemoDataSnapshot {
  const now = clock.now();
  const nowIso = now.toISOString();
  let next = snapshot;

  for (const [videoId, runtime] of Object.entries(snapshot.runtime.uploads)) {
    const video = next.videos.find(({ id }) => id === videoId);
    if (!video || video.uploadStatus !== 'uploading') continue;
    const elapsed = Math.max(0, now.getTime() - Date.parse(runtime.startedAt));
    if (elapsed < runtime.durationMs) {
      const uploadProgress = Math.max(
        video.uploadProgress,
        Math.min(99, Math.max(0, Math.floor((elapsed / runtime.durationMs) * 100))),
      );
      if (uploadProgress !== video.uploadProgress) {
        next = {
          ...next,
          videos: next.videos.map((item) =>
            item.id === videoId ? { ...item, uploadProgress, updatedAt: nowIso } : item,
          ),
        };
      }
      continue;
    }

    const uploads = { ...next.runtime.uploads };
    delete uploads[videoId];
    if (runtime.outcome === 'failed') {
      next = {
        ...next,
        videos: next.videos.map((item) =>
          item.id === videoId ? { ...item, uploadStatus: 'failed', updatedAt: nowIso } : item,
        ),
        runtime: { ...next.runtime, uploads },
      };
      continue;
    }

    const existingTask = next.analysisTasks.find((task) => task.videoId === videoId);
    const task =
      existingTask ??
      createAnalysisTask({
        id: idGenerator.next('task'),
        videoId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    next = {
      ...next,
      videos: next.videos.map((item) =>
        item.id === videoId
          ? { ...item, uploadStatus: 'uploaded', uploadProgress: 100, updatedAt: nowIso }
          : item,
      ),
      analysisTasks: existingTask ? next.analysisTasks : [...next.analysisTasks, task],
      runtime: {
        uploads,
        analyses: existingTask
          ? next.runtime.analyses
          : {
              ...next.runtime.analyses,
              [task.id]: {
                startedAt: nowIso,
                stageDurationMs: DEFAULT_ANALYSIS_STAGE_DURATION_MS,
                outcome: 'succeeded',
              },
            },
      },
    };
  }

  for (const [taskId, runtime] of Object.entries(next.runtime.analyses)) {
    const task = next.analysisTasks.find(({ id }) => id === taskId);
    if (!task || !['queued', 'processing'].includes(task.status)) continue;
    const elapsed = Math.max(0, now.getTime() - Date.parse(runtime.startedAt));
    const stageIndex = Math.min(
      ANALYSIS_STAGES.length - 1,
      Math.floor(elapsed / runtime.stageDurationMs),
    );
    const target = ANALYSIS_STAGES[stageIndex];
    const failureIndex = ANALYSIS_STAGES.findIndex(
      ({ stage }) => stage === (runtime.failureStage ?? 'ball_tracking'),
    );
    if (runtime.outcome === 'failed' && stageIndex >= failureIndex) {
      const analyses = { ...next.runtime.analyses };
      delete analyses[taskId];
      next = {
        ...next,
        analysisTasks: next.analysisTasks.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: 'failed',
                stage: 'ball_tracking',
                progress: 45,
                errorCode: 'BALL_TRACKING_UNSTABLE',
                errorMessage: '网球轨迹不稳定，无法生成可靠结果',
                completedAt: nowIso,
                updatedAt: nowIso,
              }
            : item,
        ),
        runtime: { ...next.runtime, analyses },
      };
      continue;
    }
    if (target.stage === 'completed') {
      const analyses = { ...next.runtime.analyses };
      delete analyses[taskId];
      const video = next.videos.find(({ id }) => id === task.videoId);
      const hasResult = next.analysisResults.some(({ videoId }) => videoId === task.videoId);
      next = {
        ...next,
        analysisTasks: next.analysisTasks.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: 'succeeded',
                stage: 'completed',
                progress: 100,
                startedAt: item.startedAt ?? runtime.startedAt,
                completedAt: nowIso,
                updatedAt: nowIso,
                errorCode: undefined,
                errorMessage: undefined,
              }
            : item,
        ),
        analysisResults:
          !video || hasResult
            ? next.analysisResults
            : [
                ...next.analysisResults,
                createAnalysisResult({ video, createdAt: nowIso, idGenerator }),
              ],
        runtime: { ...next.runtime, analyses },
      };
      continue;
    }
    if (target.progress < task.progress) continue;
    if (
      task.stage !== target.stage ||
      task.progress !== target.progress ||
      task.status !== target.status
    ) {
      next = {
        ...next,
        analysisTasks: next.analysisTasks.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: target.status,
                stage: target.stage,
                progress: target.progress,
                startedAt:
                  target.status === 'processing'
                    ? (item.startedAt ?? runtime.startedAt)
                    : item.startedAt,
                updatedAt: nowIso,
              }
            : item,
        ),
      };
    }
  }

  return next;
}
