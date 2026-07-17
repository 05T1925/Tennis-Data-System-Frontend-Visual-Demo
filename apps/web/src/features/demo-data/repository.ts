import { createWebDemoError, normalizeWebDemoError, throwIfAborted } from './errors';
import { webDemoDataSnapshotSchema } from './schemas';
import { createWebDemoSeed } from './seed';
import type { WebDemoDataSnapshot, WebDemoDataStorage, WebVideoRecord } from './types';

export interface WebDemoDataRepository {
  getSnapshot(options?: { signal?: AbortSignal }): Promise<WebDemoDataSnapshot>;
  listVideoRecords(options?: { signal?: AbortSignal }): Promise<WebVideoRecord[]>;
  getVideoRecordById(
    videoId: string,
    options?: { signal?: AbortSignal },
  ): Promise<WebVideoRecord | null>;
  deleteVideo(videoId: string, options?: { signal?: AbortSignal }): Promise<void>;
}

export class DefaultWebDemoDataRepository implements WebDemoDataRepository {
  private readonly storage: WebDemoDataStorage;
  private snapshot: WebDemoDataSnapshot | null = null;
  private initialization: Promise<void> | null = null;
  private queue: Promise<void> = Promise.resolve();

  constructor(storage: WebDemoDataStorage) {
    this.storage = storage;
  }

  private clone(value: unknown): WebDemoDataSnapshot {
    return webDemoDataSnapshotSchema.parse(value);
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
          try {
            this.snapshot = this.clone(JSON.parse(stored));
            return;
          } catch {
            // Invalid or obsolete data is replaced only after the deterministic Seed is durable.
          }
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

  getSnapshot(options: { signal?: AbortSignal } = {}): Promise<WebDemoDataSnapshot> {
    return this.enqueue(async () => {
      throwIfAborted(options.signal);
      await this.initialize();
      throwIfAborted(options.signal);
      return this.clone(this.snapshot);
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

  deleteVideo(videoId: string, options: { signal?: AbortSignal } = {}): Promise<void> {
    return this.enqueue(async () => {
      throwIfAborted(options.signal);
      await this.initialize();
      const current = this.clone(this.snapshot);
      const normalizedVideoId = videoId.trim();
      if (!current.videos.some((video) => video.id === normalizedVideoId)) {
        throw createWebDemoError('WEB_VIDEO_NOT_FOUND', { retryable: false });
      }

      const candidate = this.clone({
        ...current,
        videos: current.videos.filter((video) => video.id !== normalizedVideoId),
        analysisTasks: current.analysisTasks.filter((task) => task.videoId !== normalizedVideoId),
      });
      throwIfAborted(options.signal);
      this.persist(candidate);
      this.snapshot = candidate;
    });
  }
}
