// Panera: www-api.panerabread.com (menu categories, placards, per-size nutrition) answers the browser session only,
// so everything is fetched with page.evaluate(fetch) from panerabread.com. Cafe 500000 is the national default menu.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { browser, item, ROOT, save, sleep } from '../../lib.mjs';

const CAFE = 500000;
const API = 'https://www-api.panerabread.com/www-api/public/menu';
const IMG = 'https://www.panerabread.com/content/dam/panerabread/menu-omni/integrated-web/grid/rect';
// top-level category slug → our category. Everything not listed (kids, catering, family feasts, combos, dupes) is skipped.
const MULTI = /pack|dozen|tote|loaf|miche|feast|tub/i; // whole loaves, cookie packs, coffee totes: not one person's order
const CATS = { sandwiches: 'entree', salads: 'entree', 'salad-stuffers': 'entree', 'soups-and-mac': 'entree', 'market-bowls': 'entree', breakfast: 'breakfast', bakery: 'dessert', beverages: 'drink', 'sides-and-spreads': 'side' };

export async function scrape() {
  const { page, close } = await browser();
  await page.goto('https://www.panerabread.com/en-us/menu.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  // Same on-disk cache as lib get(), keyed by url+body, since these calls can't go through fetch().
  const api = async (url, body) => {
    const key = join(ROOT, 'cache', 'http', createHash('sha1').update(url + (body ?? '')).digest('hex'));
    if (existsSync(key)) return JSON.parse(JSON.parse(readFileSync(key, 'utf8')).body);
    const text = await page.evaluate(([u, b]) => fetch(u, { method: b ? 'POST' : 'GET', body: b, headers: { accept: 'application/json', 'content-type': 'application/json;charset=UTF-8', 'x-origin-source': 'iWeb' } }).then(r => r.text()), [url, body]);
    await sleep(500);
    const data = JSON.parse(text); // throws on an HTML bot page, which is what we want
    mkdirSync(join(ROOT, 'cache', 'http'), { recursive: true });
    writeFileSync(key, JSON.stringify({ t: Date.now(), url, body: text }));
    return data;
  };
  try {
    const { versions: v } = await api(`https://mobile-adapter.cloud.panerabread.com/www-api/public/menu/v2/versions/${CAFE}`);
    const cats = (await api(`${API}/categories/${CAFE}/version/${v.mnavCategory}/${v.mnavCategorySchedule}/${v.productCombo}/en-US?cloud=false`)).categoryDict;
    const slugs = await api(`${API}/categories/${CAFE}/${v.mnavCategory}/url-slugs?cloud=false`);
    const { placards } = await api(`${API}/placards/${CAFE}/version/${v.mnavPlacard}/${v.mnavPlacardSchedule}/en-US?cloud=false`);
    const hashes = Object.fromEntries((await api(`${API}/placards/${CAFE}/${v.mnavCategory}/${v.mnavPlacard}/${v.menuPDP}/${v.retiredProducts}/url-slugs?placardScheduleVersion=${v.mnavPlacardSchedule}&locale=en-US&cloud=false`)).map(s => [s.plcId, s.hash]));

    const wanted = new Map(); // plcId → category, first category wins
    const walk = (catId, category) => {
      const c = cats[catId];
      if (!c || /group/i.test(c.name)) return;
      for (const id of [...(c.placards ?? []), ...(c.heroPlacards ?? [])]) if (!wanted.has(id)) wanted.set(id, category);
      for (const s of c.subCategories ?? []) walk(s.catId, category);
    };
    for (const { slug, catId } of slugs) if (CATS[slug]) walk(catId, CATS[slug]);

    const items = [];
    for (const [plcId, category] of wanted) {
      const p = placards[plcId];
      if (!p || p.productType === 'COMBO' || !hashes[plcId] || MULTI.test(p.name)) continue;
      const detail = await api(`${API}/placard/hash/${hashes[plcId]}?cloud=false`);
      const sizes = detail.actionPalette?.find(a => a.group === 'size')?.options ?? [];
      // Food: every size (Whole/Half, Cup/Bowl). Drinks: the default size only. Stuffers are their own placard.
      const picks = sizes.filter(s => s.calories && !/stuffer/i.test(s.name) && !MULTI.test(s.name) && (p.productType !== 'BEVERAGE' || s.isDefault));
      for (const s of picks.length ? picks : [{ itemId: p.defaultItemId, name: null }]) {
        const n = await api(`${API}/item/price/nutrition?cafeId=${CAFE}&nutritionVersion=${v.productNutrient}&cloud=false`, JSON.stringify({ item: { itemId: s.itemId, quantity: 1, type: 'PRODUCT' } }));
        const g = name => n.nutrition?.find(x => x.name === name)?.value;
        if ([g('Fat'), g('Carbohydrates'), g('Protein')].some(x => x == null)) continue;
        items.push(item({
          place: 'panera', category: p.productType === 'SPREAD' ? 'sauce' : category,
          name: s.name ? `${p.name} (${s.name})` : p.name,
          kcal: n.calories, p: g('Protein'), c: g('Carbohydrates'), f: g('Fat'), na: g('Sodium'),
          image: p.imgKey ? `${IMG}/${p.imgKey}.jpg` : undefined,
        }));
      }
    }
    return save('panera', { places: [{ id: 'panera', name: 'Panera Bread', kind: 'fast', orders: { 'À la carte': null } }], items });
  } finally {
    await close();
  }
}
