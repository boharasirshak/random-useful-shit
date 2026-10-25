// Sweetgreen: sweetgreen.com/nutrition/ is a plain server-rendered page of tables (one per menu section) with serving
// grams and full macros; sweetgreen.com/menu has the photos. Build-your-own ingredients are not published with
// nutrition, so there is no component list here, only the named menu items.
import { get, item, save } from '../../lib.mjs';
import { norm } from './lib/browse.mjs';

const CAT = { Salads: 'entree', Bowls: 'entree', 'Warm plates': 'entree', Wraps: 'entree', Sides: 'side', Dessert: 'dessert', Beverages: 'drink' };
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim();

export async function scrape() {
  const html = await get('https://www.sweetgreen.com/nutrition/');
  if (!html) throw new Error('nutrition page unreachable');
  const items = [];
  for (const [, section, table] of html.matchAll(/<h3[^>]*nutrition-table-section__title[^>]*>([^<]+)<\/h3>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/g)) {
    const cat = CAT[section.trim()];
    if (!cat) continue;
    for (const [, row] of table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
      const th = row.match(/<th[^>]*>([\s\S]*?)<\/th>/)?.[1] ?? '';
      if (/nutrition-availability/.test(th)) continue; // "Select Boston locations only"
      const name = strip(th);
      const td = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => strip(m[1]));
      if (!name || td.length < 11) continue;
      const n = s => Number(String(s).replace(/[^0-9.]/g, ''));
      const [serving, , kcal, f, , , , na, c, , , p] = td;
      if (!(n(kcal) > 0)) continue;
      items.push(item({ place: 'sweetgreen', name, category: cat, kcal: n(kcal), p: n(p), c: n(c), f: n(f), na: n(na), grams: n(serving) || undefined }));
    }
  }
  const menu = await get('https://www.sweetgreen.com/menu/');
  const img = {};
  for (const [, src, title] of (menu ?? '').matchAll(/<li class="menu-item">[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?menu-item__title">([^<]+)</g)) img[norm(strip(title))] ??= (src.startsWith('//') ? 'https:' : '') + src.replace(/&amp;/g, '&');
  let n = 0;
  for (const it of items) { const u = img[norm(it.name)]; if (u) { it.image = u; n++; } }
  console.log(`sweetgreen: ${Object.keys(img).length} photos on menu page, ${n} matched`);
  return save('sweetgreen', { places: [{ id: 'sweetgreen', name: 'Sweetgreen', kind: 'fast', orders: { 'À la carte': null } }], items });
}
