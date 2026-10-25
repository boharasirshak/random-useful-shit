// Jersey Mike's: the nutrition page on jerseymikes.com reads subs.jerseymikes.com/nutrition/data (products × sizes) and
// /nutrition/<product>/<size> (every ingredient with its macros; a sub as sold = the default "D" ingredients summed).
import { get, item, save, sleep } from '../../lib.mjs';

const PLACE = { id: 'jerseymikes', name: "Jersey Mike's", kind: 'fast', orders: { 'À la carte': null } };
const BASE = 'https://subs.jerseymikes.com';
// category → [app category, size names to keep]
const CATS = { 'Cold Subs': ['entree', ['Regular', 'Giant']], 'Hot Subs': ['entree', ['Regular', 'Giant']], Breakfast: ['breakfast', ['Regular']], 'Sides, Drinks, & Desserts': ['side', ['Regular']] };
const SIDES = { Chips: 'side', Cookie: 'dessert', Brownie: 'dessert', 'French Fries': 'side' };

export async function scrape() {
  const items = [];
  for (const cat of await get(`${BASE}/nutrition/data`, { json: true })) {
    const def = CATS[cat.name];
    if (!def) continue;
    for (const p of cat.products) {
      const name = p.name.replace(/\s+/g, ' ').trim();
      if (/halal|lto/i.test(name)) continue;
      let category = def[0];
      if (category === 'side') { category = SIDES[name]; if (!category) continue; }
      for (const size of p.sizes.filter(s => def[1].includes(s.name))) {
        const d = await get(`${BASE}/nutrition/${p.id}/${size.id}`, { json: true });
        const rows = d.product_ingredients.filter(r => r.inclusion_type === 'D');
        if (!rows.length) continue;
        const sum = k => rows.reduce((t, r) => t + Number(r[k]), 0);
        items.push(item({
          place: 'jerseymikes', name: category === 'entree' || category === 'breakfast' ? `${name} (${size.name})` : name, category,
          kcal: sum('nutrition__total_calories__cal'), p: sum('nutrition__protein__g'), c: sum('nutrition__total_carbohydrate__g'), f: sum('nutrition__total_fat__g'), na: sum('nutrition__sodium__mg'),
          image: size.image ? `${BASE}/media/static/bedrock/lg/${size.image}.png` : undefined,
        }));
        await sleep(400);
      }
    }
  }
  return save('jerseymikes', { places: [PLACE], items });
}
