// Puts out/foods.json and out/images/*.jpg on UploadThing, where the app downloads them from. Every file is uploaded
// with its own name as the customId, so its URL is stable: https://<APP_ID>.ufs.sh/f/<id>.jpg and …/f/foods.json.
// uploaded.json (committed) remembers what's up there and its hash, so a re-run only sends what changed.
// Needs UPLOADTHING_TOKEN in packages/food-data/.env or the repo's root .env (the dashboard's API key, v7 token).
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { UTApi, UTFile } from 'uploadthing/server';
import { ROOT } from './lib.mjs';

for (const f of [join(ROOT, '.env'), join(ROOT, '..', '..', '.env')]) if (existsSync(f)) process.loadEnvFile(f);
const token = process.env.UPLOADTHING_TOKEN;
if (!token) throw new Error('UPLOADTHING_TOKEN is not set (put it in packages/food-data/.env or the root .env)');
const { appId } = JSON.parse(Buffer.from(token, 'base64').toString());
const BASE = `https://${appId}.ufs.sh/f`;
const utapi = new UTApi({ token, logLevel: 'Fatal' }); // the SDK logs every failed upload as a page of JSON; we report them ourselves

const manifestPath = join(ROOT, 'uploaded.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const sha = buf => createHash('sha1').update(buf).digest('hex').slice(0, 16);
const saveManifest = () => writeFileSync(manifestPath, JSON.stringify(manifest, null, 0) + '\n');

// foods.json for the app: every photo as its public URL, so the app needs nothing but this one file's address.
const foods = JSON.parse(readFileSync(join(ROOT, 'out', 'foods.json'), 'utf8'));
for (const i of foods.items) if (i.image) i.image = `${BASE}/${i.id}.jpg`;
const files = [
  ...readdirSync(join(ROOT, 'out', 'images')).filter(f => f.endsWith('.jpg')).map(f => ({ name: f, read: () => readFileSync(join(ROOT, 'out', 'images', f)), type: 'image/jpeg' })),
  { name: 'foods.json', read: () => Buffer.from(JSON.stringify(foods)), type: 'application/json' },
];
const hashed = files.map(f => ({ ...f, buf: f.read() })).map(f => ({ ...f, hash: sha(f.buf) }));

// What's already there (an earlier run may have stopped before recording it): a file can't be re-uploaded under
// its customId, so anything listed counts as up, with the current hash. foods.json is the exception: always resent.
for (let offset = 0; ; offset += 500) {
  const { files: up, hasMore } = await utapi.listFiles({ limit: 500, offset });
  for (const u of up) {
    const f = u.customId && hashed.find(h => h.name === u.customId);
    if (f && !manifest[f.name] && f.name !== 'foods.json') manifest[f.name] = f.hash;
  }
  if (!hasMore || !up.length) break;
}
saveManifest();
const todo = hashed.filter(f => manifest[f.name] !== f.hash || f.name === 'foods.json');
console.log(`${files.length} files, ${Object.keys(manifest).length} already up, ${todo.length} to upload → ${BASE}`);

// A changed file is deleted first: the same customId can't be uploaded twice.
const changed = [...new Set([...todo.filter(f => manifest[f.name]).map(f => f.name), 'foods.json'])];
if (changed.length) await utapi.deleteFiles(changed, { keyType: 'customId' }).catch(e => console.log(`delete: ${e.message}`));

// The ingest endpoint allows 20 uploads a second: batches of 15, 5 in flight, at least a second apart, 429s retried.
const BATCH = 15;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let failed = 0, sent = 0;
let queue = todo;
for (let pass = 1; pass <= 4 && queue.length; pass++) {
  if (pass > 1) {
    console.log(`retrying ${queue.length} after a pause (pass ${pass})`);
    await sleep(5000 * pass);
  }
  const retry = [];
  for (let i = 0; i < queue.length; i += BATCH) {
    const batch = queue.slice(i, i + BATCH);
    const started = Date.now();
    let results;
    try {
      results = await utapi.uploadFiles(batch.map(f => new UTFile([f.buf], f.name, { customId: f.name, type: f.type })), { concurrency: 5, acl: 'public-read' });
    } catch (e) {
      console.log(`batch at ${i}: ${e.message}`);
      retry.push(...batch);
      await sleep(3000);
      continue;
    }
    results.forEach((r, j) => {
      if (!r.error || /\(409\)/.test(r.error.message)) manifest[batch[j].name] = batch[j].hash; // 409: already up
      else retry.push(batch[j]);
    });
    sent += batch.length;
    saveManifest();
    if (sent % 300 < BATCH) console.log(`${Object.keys(manifest).length}/${files.length} up, ${retry.length} to retry`);
    await sleep(Math.max(0, 1100 - (Date.now() - started)));
  }
  queue = retry;
}
failed = queue.length;
for (const f of queue.slice(0, 10)) console.log(`still failed: ${f.name}`);
console.log(`done, ${failed} failed. The app wants EXPO_PUBLIC_FOOD_DATA_URL=${BASE} in apps/mobile/.env`);
process.exit(failed ? 1 : 0);
