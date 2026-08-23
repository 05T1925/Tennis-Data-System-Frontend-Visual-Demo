import type { DemoDataRepository } from './DemoDataRepository';

export interface DemoDataService {
  resetDemoData(options?: { signal?: AbortSignal }): Promise<void>;
}

export class DefaultDemoDataService implements DemoDataService {
  constructor(private readonly repository: DemoDataRepository) {}

  async resetDemoData(options: { signal?: AbortSignal } = {}) {
    await this.repository.reset(options);
  }
}
