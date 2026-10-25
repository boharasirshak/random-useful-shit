// Chick-fil-A: the full nutrition table embedded in chick-fil-a.com/nutrition-allergens (every item and size),
// photos from each item's page (og:image). Names are cleaned to match the ids the app already ships (cfa-nuggets-8-ct…).
import { get, item, num, save, sleep } from '../../lib.mjs';

const MENUS = { Breakfast: 'breakfast', 'Entrées': 'entree', Salads: 'entree', Sides: 'side', Treats: 'dessert', Drinks: 'drink', Coffee: 'drink', 'Dipping Sauces': 'sauce', Dressings: 'sauce' };
const RENAME = [
  [/Chick-fil-A[®™]?\s*(?=Chicken|Deluxe|Nuggets|Chick-n|Cool Wrap|Waffle|Diet Lemonade|Lemonade|Icedream|Grilled Chicken Club)/g, ''],
  [/[®™]/g, ''], [/’/g, "'"],
  ['Freshly-Brewed Sweetened Iced Tea', 'Sweet Tea'], ['Freshly-Brewed Unsweetened Iced Tea', 'Unsweet Tea'],
  ['DASANI Bottled Water', 'Bottled Water'], ['Grilled Chicken Club Sandwich', 'Grilled Chicken Club'], ['Waffle Potato Fries', 'Waffle Fries'],
];
export function clean(title) {
  let t = title;
  for (const [a, b] of RENAME) t = t.replace(a, b);
  t = t.replace(/^(Small|Medium|Large) (.+)$/, (_, s, rest) => `${rest} (${s[0]})`); // Medium X → X (M)
  t = t.replace(/^(\d+) ct (.+)$/, '$2 ($1 ct)'); // 8 ct X → X (8 ct)
  t = t.replace(/^(Cup|Bowl) of (.+)$/, '$2 ($1)');
  return t.replace(/\s+/g, ' ').trim();
}
const SKIP = /Gallon|Tray|Kid|30 ct|10 ct|6 pack|Catering| w\/ | - no |Bottled (Sweet|Unsweet|Lemonade|Diet)|Seasonal|Bag of Ice/;

export async function scrape() {
  const html = await get('https://www.chick-fil-a.com/nutrition-allergens');
  // Three [{"menu":…}] tables are inlined (allergens, nutrition, …): take the one with calories.
  const tables = [];
  for (const m of html.matchAll(/\[\{"menu":"/g)) {
    let depth = 0, k = m.index;
    for (; k < html.length; k++) {
      if (html[k] === '[') depth++;
      else if (html[k] === ']' && --depth === 0) break;
    }
    tables.push(html.slice(m.index, k + 1));
  }
  const table = JSON.parse(tables.find(t => t.includes('"Calories"')).replace(/&quot;/g, '"').replace(/&#039;|&#8217;/g, "'").replace(/&amp;/g, '&').replace(/\\\//g, '/'));

  const rows = []; // { title, link, fields, category }
  for (const menu of table) {
    const category = MENUS[menu.menu];
    if (!category) continue;
    for (const it of menu.items) {
      const subs = it.sub_items.filter(s => !SKIP.test(s.title));
      const sized = subs.some(s => /^(Small|Medium|Large|\d+ ct|Cup of|Bowl of) /.test(s.title));
      const keep = sized ? subs : subs.length && !subs.some(s => / w\/ /.test(s.title)) ? subs : [it]; // sizes/flavours replace the parent; "w/ cheese" variants don't
      for (const r of keep) rows.push({ ...r, link: r.link?.includes('/menu/') ? r.link : it.link, category });
    }
  }

  const images = new Map();
  const items = [];
  for (const r of rows) {
    if (SKIP.test(r.title)) continue;
    const f = Object.fromEntries(r.fields.map(x => [x.label, x.value]));
    if (f.Calories == null || f['Protein (g)'] == null) continue;
    let image;
    if (r.link?.includes('chick-fil-a.com/menu/')) {
      if (!images.has(r.link)) {
        const page = await get(r.link).catch(() => null);
        images.set(r.link, page?.match(/property="og:image" content="([^"]+)"/)?.[1]);
        await sleep(400);
      }
      image = images.get(r.link);
    }
    const grams = num(f['Serving Size']);
    items.push(item({
      place: 'cfa', name: clean(r.title), category: r.category, kcal: f.Calories, p: f['Protein (g)'], c: f['Carbohydrates (g)'], f: f['Fat (g)'], na: f['Sodium (mg)'],
      serving: grams ? `${grams} g` : undefined, grams, image,
    }));
  }
  return save('cfa', {
    places: [{ id: 'cfa', name: 'Chick-fil-A', kind: 'fast', orders: { 'À la carte': null, Meal: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } } }],
    items,
  });
}
