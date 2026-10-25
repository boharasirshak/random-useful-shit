// In-N-Out: in-n-out.com sits behind Incapsula + hCaptcha for anything automated, so this reads the Internet Archive's
// copy of the chain's own nutrition page (in-n-out.com/menu/nutrition-info). Photos are the page's own, via the archive too.
import { gunzipSync } from 'node:zlib';
import { get, item, save, UA } from '../../lib.mjs';

const PAGE = 'https://www.in-n-out.com/menu/nutrition-info';
const WB = 'https://web.archive.org/web/2026id_/';

async function archived(url) {
  const r = await fetch(WB + url, { headers: { 'user-agent': UA }, redirect: 'follow' });
  if (!r.ok) throw new Error(`archive: HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return (buf[0] === 0x1f && buf[1] === 0x8b ? gunzipSync(buf) : buf).toString('utf8');
}

const CAT = n => (/Fries/.test(n) ? 'side' : /Shake|Cocoa|Coffee|Milk|Lemonade|Tea|Cola|Up|Root Beer|Dr Pepper|Diet|Sprite|Minute Maid|Beverage|Soda/i.test(n) ? (/Shake/.test(n) ? 'dessert' : 'drink') : 'entree');

export async function scrape() {
  const html = await archived(PAGE);
  const items = [];
  const panels = html.split('js-accordion__panel').slice(1);
  for (const p of panels) {
    const name = p.match(/<h2>(.*?)<\/h2>/)?.[1];
    const dl = p.match(/<dl>([\s\S]*?)<\/dl>/)?.[1];
    if (!name || !dl) continue;
    const v = {}; for (const m of dl.matchAll(/<dt>(.*?)<\/dt>\s*<dd>(.*?)<\/dd>/g)) v[m[1].trim()] = parseFloat(m[2]);
    const img = p.match(/<img src="([^"]+)"/)?.[1];
    const clean = name.replace(/&#174;|&reg;|®|\*/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
    if (!(v['Total Calories'] > 0) || v.Protein == null) continue;
    items.push(item({ place: 'innout', name: clean, category: CAT(clean), kcal: v['Total Calories'], p: v.Protein, c: v['Total Carbohydrates'], f: v['Total Fat'], na: v.Sodium, grams: v['Serving Size'], image: img ? WB + new URL(img, PAGE).href : undefined }));
  }
  return save('innout', { places: [{ id: 'innout', name: 'In-N-Out', kind: 'fast', orders: { 'À la carte': null, Meal: { slots: ['entree', 'side', 'drink'] } } }], items });
}
