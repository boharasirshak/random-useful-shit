// Google Drive REST calls. The backup is one JSON file in the hidden appDataFolder:
// only this app can see it, and it doesn't clutter the user's Drive.
const API = 'https://www.googleapis.com';
const FILE = 'calorie-tracker-backup.json';

async function call(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(API + path, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } });
  if (!res.ok) throw new Error(`Google Drive error ${res.status}: ${await res.text()}`);
  return res;
}

async function findBackup(token: string): Promise<{ id: string; modifiedTime: string } | null> {
  const q = encodeURIComponent(`name='${FILE}'`);
  const res = await call(token, `/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)`);
  const { files } = await res.json();
  return files[0] ?? null;
}

export async function uploadBackup(token: string, json: string) {
  const existing = await findBackup(token);
  if (existing) {
    await call(token, `/upload/drive/v3/files/${existing.id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: json });
    return;
  }
  // New file: multipart = metadata (name + hidden folder) and content in one request.
  const boundary = 'calorie-tracker';
  const body = [
    `--${boundary}`, 'Content-Type: application/json; charset=UTF-8', '', JSON.stringify({ name: FILE, parents: ['appDataFolder'] }),
    `--${boundary}`, 'Content-Type: application/json', '', json, `--${boundary}--`,
  ].join('\r\n');
  await call(token, '/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
}

export async function downloadBackup(token: string): Promise<unknown | null> {
  const existing = await findBackup(token);
  if (!existing) return null;
  return (await call(token, `/drive/v3/files/${existing.id}?alt=media`)).json();
}
