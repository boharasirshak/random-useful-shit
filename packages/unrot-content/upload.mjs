// Publishes the full catalog to UploadThing: bulk/images/*.jpg as `unrot-img-<id>.jpg` and cards-full.json as
// `unrot-cards.json` (every card's `image` rewritten to its public URL), both under stable customIds. The app checks
// `unrot-cards.json` on launch. uploaded.json (committed) remembers what's up, so a re-run sends only changes.
// Needs UPLOADTHING_TOKEN in a .env here, in packages/food-data, or at the repo root. Run after build-full.mjs.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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
const save = () => writeFileSync(manifestUrl, JSON.stringify(manifest) + '\n');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const full = JSON.parse(readFileSync(new URL('./cards-full.json', import.meta.url), 'utf8'));
for (const c of full.cards) if (c.image && !c.image.startsWith('http')) c.image = `${BASE}/unrot-img-${c.image}`;
const imgDir = new URL('./bulk/images/', import.meta.url);
const files = [
  ...(existsSync(imgDir) ? readdirSync(imgDir).filter(f => f.endsWith('.jpg')).map(f => ({ name: `unrot-img-${f}`, buf: readFileSync(new URL(f, imgDir)), type: 'image/jpeg' })) : []),
  { name: 'unrot-cards.json', buf: Buffer.from(JSON.stringify(full)), type: 'application/json' },
];
const todo = files.map(f => ({ ...f, hash: sha(f.buf) })).filter(f => manifest[f.name] !== f.hash || f.name === 'unrot-cards.json');
console.log(`${files.length} files, ${todo.length} to upload → ${BASE}`);
const changed = [...new Set([...todo.filter(f => manifest[f.name]).map(f => f.name), 'unrot-cards.json'])];
await utapi.deleteFiles(changed, { keyType: 'customId' }).catch(() => {});

// 20 uploads a second allowed: 15 per batch, a second apart, failures retried.
let queue = todo, failed = 0;
for (let pass = 1; pass <= 4 && queue.length; pass++) {
  if (pass > 1) await sleep(5000 * pass);
  const retry = [];
  for (let i = 0; i < queue.length; i += 15) {
    const batch = queue.slice(i, i + 15), started = Date.now();
    let results;
    try {
      results = await utapi.uploadFiles(batch.map(f => new UTFile([f.buf], f.name, { customId: f.name, type: f.type })), { concurrency: 5, acl: 'public-read' });
    } catch {
      retry.push(...batch);
      await sleep(3000);
      continue;
    }
    results.forEach((r, j) => (!r.error || /\(409\)/.test(r.error.message) ? (manifest[batch[j].name] = batch[j].hash) : retry.push(batch[j])));
    save();
    if (i % 300 === 0) console.log(`${Object.keys(manifest).length}/${files.length} up`);
    await sleep(Math.max(0, 1100 - (Date.now() - started)));
  }
  queue = retry;
}
failed = queue.length;
console.log(`done, ${failed} failed: ${BASE}/unrot-cards.json (${Math.round(files.at(-1).buf.length / 1024)} KB, ${full.cards.length} cards). The app wants EXPO_PUBLIC_DATA_URL=${BASE}`);
process.exit(failed ? 1 : 0);
