// Weigh-in reminders: when to ping, and what to say. Pure, so it can be tested; scheduling lives in features/weigh.

export type Reminder = { on: boolean; hour: number; minute: number };
export const DEFAULT_REMINDER: Reminder = { on: false, hour: 7, minute: 30 };

// The next `days` reminder times, starting today unless you've already weighed in or the time has passed.
export function reminderTimes(now: Date, r: Reminder, weighedToday: boolean, days = 14): Date[] {
  const out: Date[] = [];
  for (let i = 0; out.length < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, r.hour, r.minute);
    if (i === 0 && (weighedToday || d <= now)) continue;
    out.push(d);
  }
  return out;
}

// Friendly, varied lines. The streak is what it'll be if you keep it going that morning.
export function reminderText(i: number, streak: number): { title: string; body: string } {
  const keep = streak + i;
  const lines = [
    { title: 'Morning! Hop on the scale', body: 'Ten seconds, then breakfast.' },
    { title: keep > 1 ? `Keep your ${keep}-day streak going` : 'Start a weigh-in streak', body: 'Step on the scale before you eat.' },
    { title: 'Quick weigh-in?', body: 'Every dot makes your trend line smarter.' },
    { title: 'Scale time', body: 'Same time every morning keeps it honest.' },
  ];
  return lines[i % lines.length];
}
