// Publishes the ambient tracks to UploadThing: out/<id>.m4a as `ambient-<id>.m4a` and tracks.json as
// `ambient-tracks.json`, under stable customIds, so the app can list and download them.
// Needs UPLOADTHING_TOKEN in a .env here, in packages/food-data, or at the repo root. Run: node upload.mjs
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// ponytail: the SDK is borrowed from food-data's node_modules so this package stays install-free.
const { UTApi, UTFile } = createRequire(new URL('../food-data/package.json', import.meta.url))('uploadthing/server');
for (const f of ['.env', '../food-data/.env', '../../.env']) if (existsSync(new URL(f, import.meta.url))) process.loadEnvFile(new URL(f, import.meta.url));
const token = process.env.UPLOADTHING_TOKEN;
if (!token) throw new Error('UPLOADTHING_TOKEN is not set (.env here, in packages/food-data, or at the repo root)');
const { appId } = JSON.parse(Buffer.from(token, 'base64').toString());
const BASE = `https://${appId}.ufs.sh/f`;
const utapi = new UTApi({ token, logLevel: 'Fatal' });
const sha = buf => createHash('sha1').update(buf).digest('hex').slice(0, 16);
const manifestUrl = new URL('./uploaded.json', import.meta.url);
const manifest = existsSync(manifestUrl) ? JSON.parse(readFileSync(manifestUrl, 'utf8')) : {};

const tracks = JSON.parse(readFileSync(new URL('./tracks.json', import.meta.url), 'utf8'));
const files = [
  ...tracks.map(t => ({ name: `ambient-${t.file}`, buf: readFileSync(new URL(`./out/${t.file}`, import.meta.url)), type: 'audio/mp4' })),
  { name: 'ambient-tracks.json', buf: Buffer.from(JSON.stringify(tracks)), type: 'application/json' },
];
const todo = files.map(f => ({ ...f, hash: sha(f.buf) })).filter(f => manifest[f.name] !== f.hash || f.name === 'ambient-tracks.json');
console.log(`${files.length} files, ${todo.length} to upload → ${BASE}`);
await utapi.deleteFiles([...new Set([...todo.filter(f => manifest[f.name]).map(f => f.name), 'ambient-tracks.json'])], { keyType: 'customId' }).catch(() => {});
let failed = 0;
for (const f of todo) {
  const r = await utapi.uploadFiles(new UTFile([f.buf], f.name, { customId: f.name, type: f.type }), { acl: 'public-read' });
  if (r.error && !/\(409\)/.test(r.error.message)) {
    failed++;
    console.log(`${f.name}: ${r.error.message}`);
  } else {
    manifest[f.name] = f.hash;
    writeFileSync(manifestUrl, JSON.stringify(manifest, null, 1) + '\n');
    console.log(`up: ${f.name} (${(f.buf.length / 1e6).toFixed(1)} MB)`);
  }
  await new Promise(r => setTimeout(r, 300));
}
console.log(`done, ${failed} failed. ${tracks.length} tracks at ${BASE}/ambient-tracks.json; the app wants EXPO_PUBLIC_DATA_URL=${BASE}`);
process.exit(failed ? 1 : 0);
