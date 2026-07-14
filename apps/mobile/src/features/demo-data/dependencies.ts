import type { Clock, IdGenerator } from './types';

export const systemClock: Clock = { now: () => new Date() };

export function createIdGenerator(clock: Clock = systemClock): IdGenerator {
  let sequence = 0;
  return {
    next(prefix) {
      sequence += 1;
      return `${prefix}-${clock.now().getTime().toString(36)}-${sequence.toString(36)}`;
    },
  };
}
