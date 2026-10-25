// raw/*.json → out/foods.json (everything), out/popular.json (what the app bundles), out/images/<id>.jpg.
// Photos: fetched once into cache/img/, resized by images.py. Run after any scrape; needs the network only for new photos.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORIES, ROOT, UA, sleep } from './lib.mjs';

const POPULAR_STORE = Number(process.env.POPULAR_STORE ?? 1500); // most-scanned store items that ship inside the app

const raws = readdirSync(join(ROOT, 'raw')).filter(f => f.endsWith('.json')).sort().map(f => JSON.parse(readFileSync(join(ROOT, 'raw', f), 'utf8')));
// Store products come as typed on the pack: "THIN-SLICED", "organic GREEK YOGURT plain". Title-case the shouted ones.
const SMALL = new Set(['a', 'an', 'and', 'of', 'the', 'with', 'in', 'on', 'or', 'n']);
export const tidyName = s => {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t !== t.toUpperCase() || !/[A-Z]{3}/.test(t)) return t;
  return t.toLowerCase().replace(/[a-z0-9']+/g, (w, i) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)));
};

const places = new Map(), items = new Map();
for (const r of raws) {
  for (const p of r.places) places.set(p.id, p);
  for (const i of r.items) {
    i.name = tidyName(i.name);
    if (i.brand) i.brand = tidyName(i.brand);
    if (!CATEGORIES.includes(i.category)) throw new Error(`${r.source}: ${i.id} has category ${i.category}`);
    if (!places.has(i.place)) throw new Error(`${r.source}: ${i.id} has unknown place ${i.place}`);
    if (!items.has(i.id)) items.set(i.id, i);
  }
}
console.log(`${raws.length} sources, ${places.size} places, ${items.size} items`);

// 1. Fetch photos (6 at a time) into cache/img/<id>.<ext>; a failed fetch leaves no file and the item just has no photo.
const imgDir = join(ROOT, 'cache', 'img');
mkdirSync(imgDir, { recursive: true });
const have = new Set(readdirSync(imgDir).map(f => f.replace(/\.[a-z]+$/, '')));
const failed = new Set(existsSync(join(imgDir, '..', 'img-failed.json')) ? JSON.parse(readFileSync(join(imgDir, '..', 'img-failed.json'), 'utf8')) : []);
const todo = [...items.values()].filter(i => i.image && !have.has(i.id) && !failed.has(i.id));
console.log(`photos: ${have.size} cached, ${todo.length} to fetch`);
let n = 0;
async function worker() {
  for (let i; (i = todo.shift()); ) {
    try {
      const r = await fetch(i.image, { headers: { 'user-agent': UA, accept: 'image/*,*/*' } });
      const type = r.headers.get('content-type') ?? '';
      if (!r.ok || !type.startsWith('image/')) throw new Error(`${r.status} ${type}`);
      const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'jpg';
      writeFileSync(join(imgDir, `${i.id}.${ext}`), Buffer.from(await r.arrayBuffer()));
      have.add(i.id);
    } catch (e) {
      failed.add(i.id);
      if (failed.size <= 20) console.log(`photo failed: ${i.id} ${e.message}`);
    }
    if (++n % 500 === 0) console.log(`photos: ${n} fetched`);
    await sleep(100);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
writeFileSync(join(imgDir, '..', 'img-failed.json'), JSON.stringify([...failed]));

// 2. Resize. images.py prints {id, fit} per photo; fit = contain for cutouts (transparent PNGs), cover for photos.
const outImg = join(ROOT, 'out', 'images');
mkdirSync(outImg, { recursive: true });
const fits = new Map();
if (have.size) {
  const lines = execFileSync('python3', [join(ROOT, 'images.py'), imgDir, outImg], { maxBuffer: 1 << 28 }).toString().trim().split('\n');
  for (const l of lines) {
    const r = JSON.parse(l);
    if (r.fit) fits.set(r.id, r.fit);
  }
}

// 3. Write. `image` becomes the local file; the source URL stays as `src`.
const all = [...items.values()].map(i => {
  const o = { ...i, src: i.image };
  delete o.image;
  if (fits.has(i.id)) {
    o.image = `images/${i.id}.jpg`;
    if (fits.get(i.id) === 'contain') o.fit = 'contain';
  }
  return o;
});
const version = createHash('sha1').update(JSON.stringify(all)).digest('hex').slice(0, 10);
const foods = { version, places: [...places.values()], items: all };
mkdirSync(join(ROOT, 'out'), { recursive: true });
writeFileSync(join(ROOT, 'out', 'foods.json'), JSON.stringify(foods));
const topStore = all.filter(i => i.place === 'store' && i.image).sort((a, b) => (b.pop ?? 0) - (a.pop ?? 0)).slice(0, POPULAR_STORE);
const popular = { version, places: foods.places, items: [...all.filter(i => i.place !== 'store'), ...topStore] };
writeFileSync(join(ROOT, 'out', 'popular.json'), JSON.stringify(popular));
const sizeOf = f => (readFileSync(join(ROOT, 'out', f)).length / 1e6).toFixed(1) + ' MB';
console.log(`out/foods.json: ${all.length} items (${all.filter(i => i.image).length} with photo), ${sizeOf('foods.json')}`);
console.log(`out/popular.json: ${popular.items.length} items, ${sizeOf('popular.json')}; version ${version}`);
