export type LocalDay = { dateKey: string; label: string; startMs: number; endMs: number };

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getLocalDayBounds(date: Date): { startMs: number; endMs: number } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

export function getLastSevenLocalDays(date: Date): LocalDay[] {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    return {
      dateKey: getLocalDateKey(day),
      label: `${pad(day.getMonth() + 1)}-${pad(day.getDate())}`,
      startMs: day.getTime(),
      endMs: next.getTime(),
    };
  });
}

export function getMillisecondsUntilNextLocalDay(date: Date): number {
  const { endMs } = getLocalDayBounds(date);
  return Math.max(1, endMs - date.getTime());
}
