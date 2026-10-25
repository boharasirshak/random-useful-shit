// Shared helpers for the scrapers. Every source writes raw/<source>.json in the shape README.md describes.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = dirname(fileURLToPath(import.meta.url));
export const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
export const CATEGORIES = ['entree', 'side', 'drink', 'sauce', 'dessert', 'breakfast', 'appetizer', 'base', 'snack', 'dairy', 'meat', 'frozen', 'bakery', 'produce', 'pantry', 'meal', 'protein'];

export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const slug = s => String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const num = v => (v == null || v === '' ? undefined : Number(String(v).replace(/[^0-9.-]/g, '')) || 0);
export const round = (v, d = 1) => (v == null ? undefined : Math.round(v * 10 ** d) / 10 ** d);

export const inCache = url => existsSync(join(ROOT, 'cache', 'http', createHash('sha1').update(url).digest('hex')));

// GET with a browser UA, 3 tries and an on-disk cache (cache/http/<sha1>), so a re-run after a parser fix costs nothing.
export async function get(url, { json = false, headers = {}, cache = true, ttlDays = 7 } = {}) {
  const key = join(ROOT, 'cache', 'http', createHash('sha1').update(url).digest('hex'));
  if (cache && existsSync(key)) {
    const { t, body } = JSON.parse(readFileSync(key, 'utf8'));
    if (Date.now() - t < ttlDays * 864e5) return json ? JSON.parse(body) : body;
  }
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA, accept: json ? 'application/json' : 'text/html,*/*', ...headers } });
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      if (!r.ok) return null; // 403/404: not retryable, let the caller decide
      const body = await r.text();
      mkdirSync(dirname(key), { recursive: true });
      writeFileSync(key, JSON.stringify({ t: Date.now(), url, body }));
      return json ? JSON.parse(body) : body;
    } catch (e) {
      last = e;
      await sleep(1500 * (i + 1));
    }
  }
  throw last;
}

// Headless Chromium for sites that block plain fetches (Akamai, Cloudflare). Usage: const { page, close } = await browser();
export async function browser() {
  const { chromium } = await import('playwright');
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 }, locale: 'en-US' });
  const page = await ctx.newPage();
  return { page, ctx, close: () => b.close() };
}

// Build one item. Numbers are per the serving the place sells (one sandwich, one bottle, one bowl); grams when known.
export function item({ place, name, category, kcal, p, c, f, na, serving, grams, image, brand, barcode, id }) {
  if (!CATEGORIES.includes(category)) throw new Error(`${name}: bad category ${category}`);
  const out = { id: id ?? `${place}-${slug(name)}`, place, name: String(name).trim(), category, kcal: Math.round(kcal), p: round(p), c: round(c), f: round(f), na: na == null ? undefined : Math.round(na) };
  if (serving) out.serving = String(serving).trim();
  if (grams) out.grams = Math.round(grams);
  if (image) out.image = image;
  if (brand) out.brand = String(brand).trim();
  if (barcode) out.barcode = String(barcode);
  return out;
}

// Write raw/<source>.json. Drops duplicate ids (first wins) and items with no calories, and says what it kept.
export function save(source, { places = [], items }) {
  const seen = new Set();
  const kept = items.filter(i => {
    if (seen.has(i.id) || !Number.isFinite(i.kcal)) return false;
    seen.add(i.id);
    return true;
  });
  const data = { source, fetched: new Date().toISOString().slice(0, 10), places, items: kept };
  mkdirSync(join(ROOT, 'raw'), { recursive: true });
  writeFileSync(join(ROOT, 'raw', `${source}.json`), JSON.stringify(data, null, 1) + '\n');
  const noImg = kept.filter(i => !i.image).length;
  console.log(`${source}: ${kept.length} items (${items.length - kept.length} dropped, ${noImg} without image)`);
  return data;
}
