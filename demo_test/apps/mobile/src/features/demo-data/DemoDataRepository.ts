import { createDemoSeed } from './factories';
import { createDemoDataError, throwIfAborted } from './errors';
import { demoDataSnapshotSchema } from './schemas';
import type { DemoDataStorage } from './storage';
import { reconcileDemoData } from './transitions';
import type { Clock, DemoDataSnapshot, IdGenerator } from './types';

export interface DemoDataRepository {
  getSnapshot(options?: { signal?: AbortSignal }): Promise<DemoDataSnapshot>;
  update(
    updater: (current: DemoDataSnapshot) => DemoDataSnapshot,
    options?: { signal?: AbortSignal },
  ): Promise<DemoDataSnapshot>;
  reset(options?: { signal?: AbortSignal }): Promise<DemoDataSnapshot>;
}

function parseSnapshot(value: unknown) {
  return demoDataSnapshotSchema.parse(value);
}

export class DefaultDemoDataRepository implements DemoDataRepository {
  private snapshot: DemoDataSnapshot | null = null;
  private initialization: Promise<void> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly storage: DemoDataStorage,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
  ) {}

  private clone(snapshot: DemoDataSnapshot) {
    return parseSnapshot(snapshot);
  }

  private validateForSave(value: unknown) {
    try {
      return parseSnapshot(value);
    } catch (error) {
      throw createDemoDataError('DEMO_DATA_SAVE_FAILED', {
        technicalMessage:
          error instanceof Error ? error.message : 'Demo snapshot validation failed.',
      });
    }
  }

  private async persist(snapshot: DemoDataSnapshot) {
    try {
      await this.storage.write(JSON.stringify(snapshot));
    } catch (error) {
      throw createDemoDataError('DEMO_DATA_SAVE_FAILED', {
        technicalMessage: error instanceof Error ? error.message : 'Demo storage write failed.',
      });
    }
  }

  private async initialize() {
    if (this.snapshot) return;
    if (!this.initialization) {
      this.initialization = (async () => {
        let stored: string | null;
        try {
          stored = await this.storage.read();
        } catch (error) {
          throw createDemoDataError('DEMO_DATA_LOAD_FAILED', {
            technicalMessage: error instanceof Error ? error.message : 'Demo storage read failed.',
          });
        }
        if (stored === null) {
          const seed = this.validateForSave(createDemoSeed(this.clock, this.idGenerator));
          await this.persist(seed);
          this.snapshot = seed;
          return;
        }
        try {
          this.snapshot = parseSnapshot(JSON.parse(stored));
        } catch {
          const seed = this.validateForSave(createDemoSeed(this.clock, this.idGenerator));
          try {
            await this.persist(seed);
          } catch {
            // Recovery persistence failed, so this process explicitly falls back to in-memory Seed.
            this.snapshot = seed;
            return;
          }
          this.snapshot = seed;
        }
      })();
    }
    const initialization = this.initialization;
    try {
      await initialization;
    } catch (error) {
      if (this.initialization === initialization) this.initialization = null;
      throw error;
    }
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.writeQueue.then(operation, operation);
    this.writeQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async getSnapshot(options: { signal?: AbortSignal } = {}) {
    return this.enqueue(async () => {
      throwIfAborted(options.signal);
      await this.initialize();
      const current = this.snapshot as DemoDataSnapshot;
      const reconciled = this.validateForSave(
        reconcileDemoData(this.clone(current), this.clock, this.idGenerator),
      );
      if (JSON.stringify(reconciled) !== JSON.stringify(current)) {
        throwIfAborted(options.signal);
        await this.persist(reconciled);
        this.snapshot = reconciled;
      }
      return this.clone(this.snapshot as DemoDataSnapshot);
    });
  }

  async update(
    updater: (current: DemoDataSnapshot) => DemoDataSnapshot,
    options: { signal?: AbortSignal } = {},
  ) {
    return this.enqueue(async () => {
      throwIfAborted(options.signal);
      await this.initialize();
      const current = this.snapshot as DemoDataSnapshot;
      const beforeUpdate = reconcileDemoData(this.clone(current), this.clock, this.idGenerator);
      const candidate = updater(this.clone(beforeUpdate));
      const next = this.validateForSave(reconcileDemoData(candidate, this.clock, this.idGenerator));
      throwIfAborted(options.signal);
      await this.persist(next);
      // Memory changes only after durable persistence succeeds.
      this.snapshot = next;
      return this.clone(next);
    });
  }

  async reset(options: { signal?: AbortSignal } = {}) {
    return this.enqueue(async () => {
      throwIfAborted(options.signal);
      await this.initialize();
      const seed = this.validateForSave(createDemoSeed(this.clock, this.idGenerator));
      throwIfAborted(options.signal);
      await this.persist(seed);
      this.snapshot = seed;
      return this.clone(seed);
    });
  }
}
