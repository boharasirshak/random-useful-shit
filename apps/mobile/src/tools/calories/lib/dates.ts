// Days are local "YYYY-MM-DD" strings everywhere.
export const DAY_MS = 864e5;

export const toDay = (d: Date) => d.toLocaleDateString('en-CA');
export const today = () => toDay(new Date());
export const ts = (day: string) => new Date(day + 'T00:00').getTime();

export function shift(day: string, n: number) {
  const d = new Date(day + 'T00:00');
  d.setDate(d.getDate() + n);
  return toDay(d);
}

export const daysBetween = (a: string, b: string) => Math.round((ts(b) - ts(a)) / DAY_MS);

export const nice = (day: string) =>
  day === today() ? 'Today'
    : day === shift(today(), -1) ? 'Yesterday'
    : new Date(day + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export const longDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
