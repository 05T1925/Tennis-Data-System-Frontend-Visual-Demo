import { createIdGenerator } from '../dependencies';
import { DefaultDemoDataRepository } from '../DemoDataRepository';
import type { DemoDataStorage } from '../storage';
import type { Clock } from '../types';

export class MutableClock implements Clock {
  constructor(private value: Date = new Date('2026-07-14T00:00:00.000Z')) {}

  now() {
    return new Date(this.value);
  }

  advance(milliseconds: number) {
    this.value = new Date(this.value.getTime() + milliseconds);
  }
}

export class MemoryDemoDataStorage implements DemoDataStorage {
  value: string | null = null;
  failReads = 0;
  failWrites = false;
  reads = 0;
  writes = 0;
  removes = 0;
  private nextWriteGate:
    | {
        started: () => void;
        release: Promise<void>;
      }
    | undefined;

  async read() {
    this.reads += 1;
    if (this.failReads > 0) {
      this.failReads -= 1;
      throw new Error('Memory storage read failed.');
    }
    return this.value;
  }

  async write(value: string) {
    this.writes += 1;
    if (this.failWrites) throw new Error('Memory storage write failed.');
    if (this.nextWriteGate) {
      const gate = this.nextWriteGate;
      this.nextWriteGate = undefined;
      gate.started();
      await gate.release;
    }
    this.value = value;
  }

  async remove() {
    this.removes += 1;
    this.value = null;
  }

  blockNextWrite() {
    let markStarted: (() => void) | undefined;
    let releaseWrite: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const release = new Promise<void>((resolve) => {
      releaseWrite = resolve;
    });
    this.nextWriteGate = {
      started: () => markStarted?.(),
      release,
    };
    return {
      started,
      release: () => releaseWrite?.(),
    };
  }
}

export function createTestContext(
  storage = new MemoryDemoDataStorage(),
  clock = new MutableClock(),
) {
  const idGenerator = createIdGenerator(clock);
  const repository = new DefaultDemoDataRepository(storage, clock, idGenerator);
  return { clock, idGenerator, repository, storage };
}
