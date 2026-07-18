import type { AnalysisResult, AnalysisTask } from '@tennis/shared-types';

import { createWebDemoError, normalizeWebDemoError, throwIfAborted } from './errors';
import { createWebAnalysisAssets } from './analysisFixtures';
import { createUniqueLogId, createWebDemoScenarioEntities } from './demoControlFixtures';
import { migrateWebDemoDataV1 } from './migration';
import { materializeWebAnalysisRuntimes } from './runtime';
import { webDemoDataSnapshotV1Schema, webDemoDataSnapshotV2Schema } from './schemas';
import { createWebDemoSeed } from './seed';
import type {
  WebAnalysisTaskLogEntry,
  WebAnalysisTaskState,
  WebClock,
  WebCvDemoOutput,
  WebDemoDataSnapshot,
  WebDemoDataStorage,
  WebDemoScenarioBundle,
  WebDemoScenarioKind,
  WebVideoRecord,
} from './types';
import { systemWebClock } from './types';

export interface WebDemoDataRepository {
  getSnapshot(options?: { signal?: AbortSignal }): Promise<WebDemoDataSnapshot>;
  listVideoRecords(options?: { signal?: AbortSignal }): Promise<WebVideoRecord[]>;
  getVideoRecordById(
    videoId: string,
    options?: { signal?: AbortSignal },
  ): Promise<WebVideoRecord | null>;
  getAnalysisTaskStateByVideoId(
    videoId: string,
    options?: { signal?: AbortSignal },
  ): Promise<WebAnalysisTaskState>;
  getAnalysisResultByVideoId(
    videoId: string,
    options?: { signal?: AbortSignal },
  ): Promise<AnalysisResult | null>;
  getCvDemoOutputByVideoId(
    videoId: string,
    options?: { signal?: AbortSignal },
  ): Promise<WebCvDemoOutput | null>;
  getAnalysisLogsByVideoId(
    videoId: string,
    options?: { signal?: AbortSignal },
  ): Promise<WebAnalysisTaskLogEntry[]>;
  retryAnalysis(videoId: string, options?: { signal?: AbortSignal }): Promise<AnalysisTask>;
  resetDemoData(options?: { signal?: AbortSignal }): Promise<WebDemoDataSnapshot>;
  createDemoScenario(
    kind: WebDemoScenarioKind,
    options?: { signal?: AbortSignal },
  ): Promise<WebDemoScenarioBundle>;
  forceCompleteAnalysis(
    videoId: string,
    options?: { signal?: AbortSignal },
  ): Promise<WebDemoScenarioBundle>;
  deleteVideo(videoId: string, options?: { signal?: AbortSignal }): Promise<void>;
}

export class DefaultWebDemoDataRepository implements WebDemoDataRepository {
  private readonly storage: WebDemoDataStorage;
  private readonly clock: WebClock;
  private snapshot: WebDemoDataSnapshot | null = null;
  private initialization: Promise<void> | null = null;
  private queue: Promise<void> = Promise.resolve();
  private readonly issuedDemoControlIds = new Set<string>();

  constructor(storage: WebDemoDataStorage, clock: WebClock = systemWebClock) {
    this.storage = storage;
    this.clock = clock;
  }

  private clone(value: unknown): WebDemoDataSnapshot {
    return webDemoDataSnapshotV2Schema.parse(value);
  }

  private persist(snapshot: WebDemoDataSnapshot): void {
    try {
      this.storage.write(JSON.stringify(snapshot));
    } catch (error) {
      throw normalizeWebDemoError(error, 'WEB_DEMO_DATA_SAVE_FAILED');
    }
  }

  private async initialize(): Promise<void> {
    if (this.snapshot !== null) return;
    if (this.initialization === null) {
      this.initialization = Promise.resolve().then(() => {
        let stored: string | null;
        try {
          stored = this.storage.read();
        } catch (error) {
          throw normalizeWebDemoError(error, 'WEB_DEMO_DATA_LOAD_FAILED');
        }

        if (stored !== null) {
          let parsed: unknown;
          try {
            parsed = JSON.parse(stored);
          } catch {
            parsed = null;
          }
          const v2 = webDemoDataSnapshotV2Schema.safeParse(parsed);
          if (v2.success) {
            this.snapshot = v2.data;
            return;
          }
          const v1 = webDemoDataSnapshotV1Schema.safeParse(parsed);
          if (v1.success) {
            try {
              const migrated = this.clone(migrateWebDemoDataV1(v1.data));
              this.persist(migrated);
              this.snapshot = migrated;
              return;
            } catch (error) {
              if (isSaveError(error)) throw error;
              throw normalizeWebDemoError(error, 'WEB_DEMO_DATA_LOAD_FAILED');
            }
          }
          // Invalid or obsolete data is replaced only after the deterministic v2 Seed is durable.
        }

        const seed = this.clone(createWebDemoSeed());
        this.persist(seed);
        this.snapshot = seed;
      });
    }

    const pending = this.initialization;
    try {
      await pending;
    } catch (error) {
      if (this.initialization === pending) this.initialization = null;
      throw error;
    }
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private materialize(signal?: AbortSignal): WebDemoDataSnapshot {
    const current = this.clone(this.snapshot);
    const candidate = this.clone(materializeWebAnalysisRuntimes(current, this.clock.now()));
    if (JSON.stringify(candidate) !== JSON.stringify(current)) {
      throwIfAborted(signal);
      this.persist(candidate);
      this.snapshot = candidate;
    }
    return this.clone(this.snapshot);
  }

  getSnapshot(options: { signal?: AbortSignal } = {}): Promise<WebDemoDataSnapshot> {
    return this.enqueue(async () => {
      throwIfAborted(options.signal);
      await this.initialize();
      throwIfAborted(options.signal);
      return this.materialize(options.signal);
    });
  }

  async listVideoRecords(options: { signal?: AbortSignal } = {}): Promise<WebVideoRecord[]> {
    const snapshot = await this.getSnapshot(options);
    return snapshot.videos.map((video) => ({
      video,
      analysisTask: snapshot.analysisTasks.find((task) => task.videoId === video.id) ?? null,
    }));
  }

  async getVideoRecordById(
    videoId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<WebVideoRecord | null> {
    const normalizedVideoId = videoId.trim();
    const records = await this.listVideoRecords(options);
    return records.find((record) => record.video.id === normalizedVideoId) ?? null;
  }

  async getAnalysisTaskStateByVideoId(
    videoId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<WebAnalysisTaskState> {
    const snapshot = await this.getSnapshot(options);
    const task = snapshot.analysisTasks.find((candidate) => candidate.videoId === videoId.trim());
    return {
      task: task ?? null,
      runtimeActive: task !== undefined && snapshot.analysisRuntimes[task.id] !== undefined,
    };
  }

  async getAnalysisResultByVideoId(
    videoId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<AnalysisResult | null> {
    const snapshot = await this.getSnapshot(options);
    return snapshot.analysisResults.find((result) => result.videoId === videoId.trim()) ?? null;
  }

  async getCvDemoOutputByVideoId(
    videoId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<WebCvDemoOutput | null> {
    const snapshot = await this.getSnapshot(options);
    return snapshot.cvDemoOutputs.find(({ output }) => output.videoId === videoId.trim()) ?? null;
  }

  async getAnalysisLogsByVideoId(
    videoId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<WebAnalysisTaskLogEntry[]> {
    const snapshot = await this.getSnapshot(options);
    const task = snapshot.analysisTasks.find((candidate) => candidate.videoId === videoId.trim());
    return task ? snapshot.analysisLogs.filter(({ taskId }) => taskId === task.id) : [];
  }

  retryAnalysis(videoId: string, options: { signal?: AbortSignal } = {}): Promise<AnalysisTask> {
    return this.enqueue(async () => {
      throwIfAborted(options.signal);
      await this.initialize();
      const current = this.materialize(options.signal);
      const normalizedVideoId = videoId.trim();
      const video = current.videos.find(({ id }) => id === normalizedVideoId);
      if (!video) throw createWebDemoError('WEB_VIDEO_NOT_FOUND', { retryable: false });
      if (video.uploadStatus !== 'uploaded') {
        throw createWebDemoError('WEB_ANALYSIS_RETRY_NOT_ALLOWED', { retryable: false });
      }
      const task = current.analysisTasks.find((candidate) => candidate.videoId === video.id);
      if (!task) throw createWebDemoError('WEB_ANALYSIS_NOT_FOUND', { retryable: false });
      if (task.status !== 'failed') {
        throw createWebDemoError('WEB_ANALYSIS_RETRY_NOT_ALLOWED', { retryable: false });
      }
      const retryCount = task.retryCount + 1;
      const now = this.clock.now().toISOString();
      const retriedTask: AnalysisTask = {
        ...task,
        status: 'queued',
        stage: 'queued',
        progress: 0,
        retryCount,
        errorCode: undefined,
        errorMessage: undefined,
        startedAt: undefined,
        completedAt: undefined,
        updatedAt: now,
      };
      const candidate = this.clone({
        ...current,
        analysisTasks: current.analysisTasks.map((item) =>
          item.id === task.id ? retriedTask : item,
        ),
        analysisResults: current.analysisResults.filter((result) => result.videoId !== video.id),
        cvDemoOutputs: current.cvDemoOutputs.filter(({ output }) => output.videoId !== video.id),
        analysisLogs: [
          ...current.analysisLogs,
          {
            id: `${task.id}-retry-${retryCount}-user`,
            taskId: task.id,
            timestamp: now,
            level: 'info',
            audience: 'user',
            userMessage: '分析任务已重新提交。',
            stage: 'queued',
          },
          {
            id: `${task.id}-retry-${retryCount}-developer`,
            taskId: task.id,
            timestamp: now,
            level: 'info',
            audience: 'developer',
            developerMessage: `Demo retry attempt ${retryCount} entered the queue.`,
            stage: 'queued',
          },
        ],
        analysisRuntimes: {
          ...current.analysisRuntimes,
          [task.id]: { taskId: task.id, attempt: retryCount, queuedAt: now },
        },
      });
      throwIfAborted(options.signal);
      this.persist(candidate);
      this.snapshot = candidate;
      return this.clone(candidate).analysisTasks.find(({ id }) => id === task.id) as AnalysisTask;
    });
  }

  resetDemoData(options: { signal?: AbortSignal } = {}): Promise<WebDemoDataSnapshot> {
    return this.enqueue(async () => {
      throwIfAborted(options.signal);
      const candidate = this.clone(createWebDemoSeed());
      throwIfAborted(options.signal);
      this.persist(candidate);
      this.snapshot = candidate;
      return this.clone(candidate);
    });
  }

  createDemoScenario(
    kind: WebDemoScenarioKind,
    options: { signal?: AbortSignal } = {},
  ): Promise<WebDemoScenarioBundle> {
    return this.enqueue(async () => {
      throwIfAborted(options.signal);
      await this.initialize();
      const current = this.materialize(options.signal);
      const entities = createWebDemoScenarioEntities(
        current,
        kind,
        this.clock.now(),
        this.issuedDemoControlIds,
      );
      const candidate = this.clone({
        ...current,
        videos: [...current.videos, entities.video],
        analysisTasks: [...current.analysisTasks, entities.task],
        analysisResults: entities.result
          ? [...current.analysisResults, entities.result]
          : current.analysisResults,
        cvDemoOutputs: entities.cv
          ? [...current.cvDemoOutputs, entities.cv]
          : current.cvDemoOutputs,
        analysisLogs: [...current.analysisLogs, ...entities.logs],
      });
      throwIfAborted(options.signal);
      this.persist(candidate);
      this.snapshot = candidate;
      this.issuedDemoControlIds.add(entities.video.id);
      this.issuedDemoControlIds.add(entities.task.id);
      return createScenarioBundle(this.clone(candidate), entities.video.id);
    });
  }

  forceCompleteAnalysis(
    videoId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<WebDemoScenarioBundle> {
    return this.enqueue(async () => {
      throwIfAborted(options.signal);
      await this.initialize();
      const current = this.materialize(options.signal);
      throwIfAborted(options.signal);
      const normalizedVideoId = videoId.trim();
      const video = current.videos.find(({ id }) => id === normalizedVideoId);
      if (!video) throw createWebDemoError('WEB_VIDEO_NOT_FOUND', { retryable: false });
      const task = current.analysisTasks.find((candidate) => candidate.videoId === video.id);
      if (!task) throw createWebDemoError('WEB_ANALYSIS_NOT_FOUND', { retryable: false });
      if (video.uploadStatus !== 'uploaded' || !['queued', 'processing'].includes(task.status)) {
        throw createWebDemoError('WEB_ANALYSIS_FORCE_COMPLETE_NOT_ALLOWED', { retryable: false });
      }
      const now = this.clock.now();
      const nowMs = now.getTime();
      const createdAtMs = Date.parse(task.createdAt);
      const existingStartedAtMs = task.startedAt ? Date.parse(task.startedAt) : Number.NaN;
      if (!Number.isFinite(createdAtMs) || createdAtMs > nowMs) {
        throw createWebDemoError('WEB_ANALYSIS_FORCE_COMPLETE_NOT_ALLOWED', { retryable: false });
      }
      const startedAt =
        Number.isFinite(existingStartedAtMs) && existingStartedAtMs <= nowMs
          ? task.startedAt
          : task.createdAt;
      const timestamp = now.toISOString();
      const completedTask: AnalysisTask = {
        ...task,
        status: 'succeeded',
        stage: 'completed',
        progress: 100,
        errorCode: undefined,
        errorMessage: undefined,
        startedAt,
        completedAt: timestamp,
        updatedAt: timestamp,
      };
      const assets = createWebAnalysisAssets(video, completedTask, { createdAt: timestamp });
      const runtimes = { ...current.analysisRuntimes };
      delete runtimes[task.id];
      const userLogId = createUniqueLogId(current, `${task.id}-force-complete-user`);
      const snapshotWithUserLog = {
        ...current,
        analysisLogs: [
          ...current.analysisLogs,
          {
            id: userLogId,
            taskId: task.id,
            timestamp,
            level: 'info' as const,
            audience: 'user' as const,
            userMessage: '分析任务已由开发控制立即完成。',
            stage: 'completed' as const,
          },
        ],
      };
      const developerLogId = createUniqueLogId(
        snapshotWithUserLog,
        `${task.id}-force-complete-developer`,
      );
      const candidate = this.clone({
        ...current,
        analysisTasks: current.analysisTasks.map((item) =>
          item.id === task.id ? completedTask : item,
        ),
        analysisResults: [
          ...current.analysisResults.filter((result) => result.videoId !== video.id),
          assets.result,
        ],
        cvDemoOutputs: [
          ...current.cvDemoOutputs.filter(({ output }) => output.videoId !== video.id),
          assets.cv,
        ],
        analysisLogs: [
          ...snapshotWithUserLog.analysisLogs,
          {
            id: developerLogId,
            taskId: task.id,
            timestamp,
            level: 'info',
            audience: 'developer',
            developerMessage: 'Demo control forced the active task to completed state.',
            stage: 'completed',
          },
        ],
        analysisRuntimes: runtimes,
      });
      throwIfAborted(options.signal);
      this.persist(candidate);
      this.snapshot = candidate;
      return createScenarioBundle(this.clone(candidate), video.id);
    });
  }

  deleteVideo(videoId: string, options: { signal?: AbortSignal } = {}): Promise<void> {
    return this.enqueue(async () => {
      throwIfAborted(options.signal);
      await this.initialize();
      const current = this.materialize(options.signal);
      const normalizedVideoId = videoId.trim();
      if (!current.videos.some((video) => video.id === normalizedVideoId)) {
        throw createWebDemoError('WEB_VIDEO_NOT_FOUND', { retryable: false });
      }
      const taskIds = new Set(
        current.analysisTasks
          .filter(({ videoId: value }) => value === normalizedVideoId)
          .map(({ id }) => id),
      );
      const runtimes = { ...current.analysisRuntimes };
      for (const taskId of taskIds) delete runtimes[taskId];
      const candidate = this.clone({
        ...current,
        videos: current.videos.filter((video) => video.id !== normalizedVideoId),
        analysisTasks: current.analysisTasks.filter((task) => task.videoId !== normalizedVideoId),
        analysisResults: current.analysisResults.filter(
          (result) => result.videoId !== normalizedVideoId,
        ),
        cvDemoOutputs: current.cvDemoOutputs.filter(
          ({ output }) => output.videoId !== normalizedVideoId,
        ),
        analysisLogs: current.analysisLogs.filter(({ taskId }) => !taskIds.has(taskId)),
        analysisRuntimes: runtimes,
      });
      throwIfAborted(options.signal);
      this.persist(candidate);
      this.snapshot = candidate;
    });
  }
}

function createScenarioBundle(
  snapshot: WebDemoDataSnapshot,
  videoId: string,
): WebDemoScenarioBundle {
  const video = snapshot.videos.find(({ id }) => id === videoId);
  const task = snapshot.analysisTasks.find((candidate) => candidate.videoId === videoId);
  if (!video || !task) throw createWebDemoError('WEB_DEMO_CONTROL_FAILED');
  return {
    videoRecord: { video, analysisTask: task },
    taskState: { task, runtimeActive: snapshot.analysisRuntimes[task.id] !== undefined },
    result: snapshot.analysisResults.find((candidate) => candidate.videoId === videoId) ?? null,
    cv: snapshot.cvDemoOutputs.find(({ output }) => output.videoId === videoId) ?? null,
    logs: snapshot.analysisLogs.filter(({ taskId }) => taskId === task.id),
  };
}

function isSaveError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'WEB_DEMO_DATA_SAVE_FAILED'
  );
}
