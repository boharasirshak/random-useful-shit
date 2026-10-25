// Farmer's Fridge: farmersfridge.com is a Gatsby site, so /page-data/menu/page-data.json lists every product and each
// product's page-data carries its Cloudinary images, including the Nutrition Facts label. The site only prints calories
// as text, so the label image is OCR'd with the macOS Vision framework (lib/ocr.swift) to get the macros.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get, item, save, sleep, ROOT, UA } from '../../lib.mjs';
import { plausible } from './lib/pdf.mjs';

const SITE = 'https://www.farmersfridge.com';
const CDN = 'https://res.cloudinary.com/fftech/image/upload';
const CAT = { 'High Protein Bowls': 'entree', Bowls: 'entree', Salads: 'entree', 'Sandwiches & Wraps': 'entree', Breakfast: 'breakfast', 'Sides & Snacks': 'side' };
const OCR = join(dirname(fileURLToPath(import.meta.url)), 'lib', 'ocr.swift');

const url = m => m && `${CDN}/v${m.version}/${m.public_id}.png`;

export async function scrape() {
  const menu = await get(`${SITE}/page-data/menu/page-data.json`, { json: true });
  const products = new Map();
  for (const c of menu.result.data.allFridgeMenuCategory.nodes) for (const p of c.children) if (CAT[c.name] && !products.has(p.sku)) products.set(p.sku, { ...p, cat: CAT[c.name] });
  const dir = join(ROOT, 'cache', 'ff-labels'); mkdirSync(dir, { recursive: true });
  const todo = [];
  for (const p of products.values()) {
    const pd = await get(`${SITE}/page-data${p.productPagePath.replace(/\/$/, '')}/page-data.json`, { json: true });
    const fp = pd?.result?.data?.fridgeMenuProduct; if (!fp) continue;
    p.label = url(fp.cloudinaryMedia?.Nutritional); p.top = fp.cloudinaryMedia?.TopDown ?? p.cloudinaryMedia?.TopDown;
    if (!p.label) continue;
    p.file = join(dir, `${p.sku}-${fp.cloudinaryMedia.Nutritional.version}.png`);
    if (!existsSync(p.file)) { const r = await fetch(p.label, { headers: { 'user-agent': UA } }); if (r.ok) writeFileSync(p.file, Buffer.from(await r.arrayBuffer())); await sleep(400); }
    if (existsSync(p.file)) todo.push(p);
  }
  // Vision drops the odd image when handed a long batch, so OCR in small batches and retry the blanks once
  const ocr = files => JSON.parse(execFileSync('swift', [OCR, ...files], { encoding: 'utf8', maxBuffer: 64e6 }));
  const lines = new Map();
  for (let pass = 0; pass < 2; pass++) {
    const pending = todo.filter(p => !lines.get(p.file)?.length);
    for (let i = 0; i < pending.length; i += 6) { const batch = pending.slice(i, i + 6); ocr(batch.map(p => p.file)).forEach((l, j) => lines.set(batch[j].file, l)); }
  }
  const items = []; const bad = [];
  todo.forEach(p => {
    const t = (lines.get(p.file) ?? []).join('\n');
    const pick = re => { const m = t.match(re); return m ? Number(m[1]) : undefined; };
    // Vision sometimes splits a label and its value onto separate lines, and the serving line can sit between "Calories" and the number
    const kcal = pick(/Calories\n(?:1 Container[^\n]*\n)?(\d+)\b/), f = pick(/Total Fat\s*(\d+(?:\.\d+)?)g/), c = pick(/Total Carbohydrate\s*(\d+(?:\.\d+)?)g/), pr = pick(/Protein\s*(\d+(?:\.\d+)?)g/), na = pick(/Sodium\s*(\d+)mg/), g = pick(/\((\d+)g\)/);
    if (![kcal, f, c, pr].every(Number.isFinite) || !plausible(kcal, pr, c, f)) { bad.push(p.prettyName); return; }
    if (kcal < 5) return; // sparkling water
    const category = /LaCroix|Spindrift|Olipop|Latte|Kombucha|Juice|Soda/i.test(p.prettyName) ? 'drink' : /Breakfast|Oats|Yogurt|Chia/i.test(p.prettyName) ? 'breakfast' : p.cat === 'side' && /Cookie|Brownie|Bark|Chocolate|Bites|Cheesecake/i.test(p.prettyName) ? 'dessert' : p.cat;
    items.push(item({ place: 'farmersfridge', name: p.prettyName, category, kcal, p: pr, c, f, na, grams: g, image: p.top && `${CDN}/w_480/v${p.top.version}/${p.top.public_id}.png` }));
  });
  if (bad.length) console.log(`farmersfridge: label OCR failed for ${bad.length}: ${bad.join('; ')}`);
  return save('farmersfridge', { places: [{ id: 'farmersfridge', name: "Farmer's Fridge", kind: 'fast', orders: { 'À la carte': null } }], items });
}
