// Taco Bell: the menu (categories, names, photos, calories) is in tacobell.com's Next.js __NEXT_DATA__; the full
// nutrition table Taco Bell publishes lives on Nutritionix (tacobell.com/nutrition/info links to it, and product
// pages link the same label ids). Rows are matched to menu products by name tokens, calories cross-checked.
import { get, item, save, sleep } from '../../lib.mjs';

const SITE = 'https://www.tacobell.com';
const TABLE = 'https://www.nutritionix.com/taco-bell/menu/premium';
const SKIP_CATEGORIES = /best sellers|featured|online exclusives|luxe value|boxes & combos|groups|veggie cravings|early access/i;
const CATEGORY = { tacos: 'entree', burritos: 'entree', specialties: 'entree', quesadillas: 'entree', nachos: 'entree', bowls: 'entree', 'cantina-chicken-menu': 'entree', drinks: 'drink', breakfast: 'breakfast', 'snacks-sweets': 'side' };

const nextData = html => JSON.parse(html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)[1]).props.pageProps;
const num = s => (s == null ? undefined : Number(String(s).replace(/[^0-9.]/g, ''))); // "1,050mg", "&lt;1g"
// "Quesadilla - Chicken" and "Chicken Quesadilla" → the same key.
const key = s => s.toLowerCase().replace(/[®™]|&(amp;)?(reg|trade);?|\(v\)|\(regional\)|\bfl oz\b/g, m => (m === 'fl oz' ? 'oz' : '')).replace(/&/g, ' and ').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w && w !== 'the' && w !== 'with').sort().join(' ');

// Nutritionix table → { key: { name, kcal, p, c, f, na } }, drinks keyed with their size.
function parseTable(html) {
  const rows = new Map();
  for (const row of html.match(/<tr class="(?:even|odd)">.*?<\/tr>/gs) ?? []) {
    const name = row.match(/class="nmItem" title="([^"]*)"/)?.[1].replace(/&amp;/g, '&');
    const cols = [...row.matchAll(/<td class="col"[^>]*title="([^"]*)"/g)].map(m => m[1]);
    const col = label => num(cols.find(c => c.endsWith(label))?.replace(label, '').trim());
    if (!name || !cols.length) continue;
    const r = { name, kcal: col('Calories'), f: col('Total Fat'), na: col('Sodium'), c: col('Total Carbohydrates'), p: col('Protein') };
    if ([r.kcal, r.p, r.c, r.f].every(Number.isFinite) && !rows.has(key(name))) rows.set(key(name), r);
  }
  return rows;
}

export async function scrape() {
  const table = parseTable(await get(TABLE));
  const cats = nextData(await get(`${SITE}/food`)).filteredCategories.filter(c => !SKIP_CATEGORIES.test(c.label));
  const items = [];
  const seen = new Set();
  for (const cat of cats) {
    const slug = cat.slug.split('/').pop();
    const category = CATEGORY[slug];
    if (!category) { console.log(`tacobell: unmapped category ${slug}, skipped`); continue; }
    const { products = [] } = nextData(await get(`${SITE}${cat.slug}`));
    await sleep(400);
    for (const p of products) {
      const name = p.name.replace(/[®™]/g, '').replace(/\s+/g, ' ').trim();
      if (seen.has(name) || /party pack|12 pack|variety|box$|combo|meal|deal|\bduos\b|2pk|^large /i.test(name)) continue;
      if (p.itemType !== 'Product' && !(p.itemType === 'ComboProduct' && p.isComboALC)) continue;
      // Drinks are listed per size on the table (16 oz is the regular cup); "Soft Taco" is "Soft Taco - Beef" there.
      const row = [name, `${name} (16 oz)`, `${name} beef`].map(n => table.get(key(n))).find(Boolean);
      if (!row) { console.log(`tacobell: no nutrition row for "${name}"`); continue; }
      const kcal = Number(p.calories);
      if (kcal > 0 && Math.abs(kcal - row.kcal) > Math.max(20, kcal * 0.15)) { console.log(`tacobell: "${name}" ${kcal} vs table ${row.kcal}, skipped`); continue; }
      seen.add(name);
      const size = row.name.match(/\((\d+) (?:fl )?oz\)/)?.[1].concat(' oz');
      const big = p.images?.find(i => i.format === '750x340') ?? p.images?.find(i => i.imageType === 'PRIMARY');
      items.push(item({
        place: 'tacobell', name: size ? `${name} (${size})` : name,
        category: /(sauce|salsa|sour cream|packet|creamer|guacamole)$/i.test(name) && !/chips/i.test(name) ? 'sauce' : category === 'side' && /cinnabon|churro|cookie|delight|twist|empanada|cake/i.test(name) ? 'dessert' : category,
        kcal: row.kcal, p: row.p, c: row.c, f: row.f, na: row.na, image: big?.url,
      }));
    }
    console.log(`tacobell: ${cat.label}: ${items.length} so far`);
  }
  const place = { id: 'tacobell', name: 'Taco Bell', kind: 'fast', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } } };
  return save('tacobell', { places: [place], items });
}
