// Backup file format: the whole app state as one JSON file.
import type { Logs } from './log.ts';
import type { Profile } from './model.ts';

export type AppData = {
  profile: Profile;
  shake: number;
  logs: Logs;
  weights: Record<string, number>;
  done: Record<string, boolean>; // days marked "Done for the Day"
};
export type BackupFile = { app: 'calorie-tracker'; version: 1; savedAt: string; data: AppData };

export const toBackup = (data: AppData, now = new Date()): BackupFile => ({ app: 'calorie-tracker', version: 1, savedAt: now.toISOString(), data });

export function fromBackup(json: unknown): BackupFile {
  const f = json as BackupFile;
  if (f?.app !== 'calorie-tracker' || f.version !== 1 || typeof f.data !== 'object') throw new Error('Not a Calorie Tracker backup');
  const { profile, shake, logs, weights } = f.data;
  if (!profile || typeof shake !== 'number' || typeof logs !== 'object' || typeof weights !== 'object') throw new Error('Backup is incomplete');
  return f;
}
