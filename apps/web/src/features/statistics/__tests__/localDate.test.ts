import { describe, expect, it } from 'vitest';

import {
  getLastSevenLocalDays,
  getLocalDateKey,
  getLocalDayBounds,
  getMillisecondsUntilNextLocalDay,
} from '../localDate';

describe('local calendar helpers', () => {
  it('formats local dates without a fixed timezone', () => {
    expect(getLocalDateKey(new Date(2026, 6, 8, 23, 0, 0))).toBe('2026-07-08');
  });

  it('uses local calendar advancement instead of fixed-day subtraction', () => {
    const days = getLastSevenLocalDays(new Date(2026, 2, 10, 12, 0, 0));
    expect(days).toHaveLength(7);
    for (let index = 1; index < days.length; index += 1) {
      const previous = new Date(days[index - 1].startMs);
      const current = new Date(days[index].startMs);
      const expected = new Date(previous);
      expected.setDate(previous.getDate() + 1);
      expect(current.getTime()).toBe(expected.getTime());
    }
  });

  it('returns left-closed/right-open bounds and the next-midnight delay', () => {
    const date = new Date(2026, 6, 18, 23, 59, 59, 500);
    const bounds = getLocalDayBounds(date);
    expect(bounds.startMs).toBe(new Date(2026, 6, 18).getTime());
    expect(bounds.endMs).toBe(new Date(2026, 6, 19).getTime());
    expect(getMillisecondsUntilNextLocalDay(date)).toBe(500);
  });
});
