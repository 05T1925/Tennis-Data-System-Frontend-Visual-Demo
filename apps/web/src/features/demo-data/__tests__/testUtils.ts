import type { WebDemoDataStorage } from '../types';

export class MemoryWebDemoDataStorage implements WebDemoDataStorage {
  value: string | null = null;
  reads = 0;
  writes = 0;
  failReads = 0;
  failWrites = false;
  onWrite: (() => void) | null = null;

  read(): string | null {
    this.reads += 1;
    if (this.failReads > 0) {
      this.failReads -= 1;
      throw new Error('Memory read failed.');
    }
    return this.value;
  }

  write(value: string): void {
    this.writes += 1;
    if (this.failWrites) throw new Error('Memory write failed.');
    this.value = value;
    this.onWrite?.();
  }
}
