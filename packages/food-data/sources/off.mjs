// Open Food Facts: US products, most-scanned first. Keeps the ones with a photo, calories and all three macros.
// API v2 search, 100 per page. Per-serving numbers when OFF has a serving, else per 100 g.
import { get, item, save, sleep } from '../lib.mjs';

const FIELDS = 'code,product_name,product_name_en,brands,quantity,serving_size,serving_quantity,nutriments,image_front_url,categories_tags,unique_scans_n,lang';

// First matching tag wins. OFF tags are hierarchical, so the specific ones go first.
const CAT = [
  ['protein', ['protein-bars', 'protein-shakes', 'protein-powders', 'sports-nutrition', 'meal-replacement', 'protein-drinks']],
  ['frozen', ['frozen-foods', 'frozen-pizzas', 'frozen-meals', 'frozen-desserts', 'ice-creams', 'ice-cream']],
  ['bakery', ['breads', 'bakery', 'bagels', 'tortillas', 'buns', 'muffins', 'bread', 'english-muffins']],
  ['breakfast', ['breakfast-cereals', 'granolas', 'oatmeal', 'pancakes', 'waffles', 'breakfast', 'cereals']],
  ['snack', ['chips', 'crisps', 'crackers', 'popcorn', 'nuts', 'jerky', 'salty-snacks', 'trail-mix', 'pretzels', 'cereal-bars', 'granola-bars', 'nut-butters', 'peanut-butters', 'bars']],
  ['dessert', ['chocolates', 'candies', 'confectioneries', 'biscuits-and-cakes', 'cakes', 'cookies', 'puddings', 'pastries', 'sweet-snacks', 'gummies']],
  ['dairy', ['yogurts', 'cheeses', 'butters', 'creams', 'eggs', 'cottage-cheese', 'dairies']],
  ['drink', ['beverages', 'sodas', 'juices', 'waters', 'energy-drinks', 'coffees', 'teas', 'plant-based-milks', 'milks', 'drinks', 'smoothies', 'sports-drinks']],
  ['meat', ['meats', 'poultry', 'chicken', 'sausages', 'hams', 'bacon', 'deli', 'seafood', 'fishes', 'meat-products', 'rotisserie', 'turkey']],
  ['produce', ['fruits', 'vegetables', 'salads', 'fresh-fruits', 'fresh-vegetables']],
  ['meal', ['meals', 'prepared-meals', 'sandwiches', 'pizzas', 'soups', 'burritos', 'ready-meals', 'instant-noodles', 'pasta-dishes', 'salad-kits', 'microwave-meals', 'noodles']],
  ['sauce', ['sauces', 'condiments', 'dressings', 'spreads', 'dips', 'salsas']],
];

export function categoryOf(tags = []) {
  const t = tags.map(x => x.replace(/^[a-z]{2}:/, ''));
  for (const [cat, words] of CAT) if (t.some(tag => words.some(w => tag === w || tag.endsWith('-' + w) || tag.startsWith(w + '-')))) return cat;
  return 'pantry';
}

const per = (n, key, g) => (n[`${key}_serving`] != null ? n[`${key}_serving`] : n[`${key}_100g`] != null && g ? (n[`${key}_100g`] * g) / 100 : undefined);

export function toItem(p) {
  const n = p.nutriments ?? {};
  const name = (p.product_name_en || p.product_name || '').trim();
  // English name, a photo, and a US/Canada barcode (UPC-A: 12 digits, or EAN-13 with a leading 0). "Sold in the US" alone lets a lot of Moroccan dairy through.
  if (!name || !/^[\x20-\x7E]+$/.test(name) || !p.image_front_url || p.lang !== 'en' || !/^0?\d{12}$/.test(p.code)) return null;
  const g = Number(p.serving_quantity) || (n['energy-kcal_serving'] ? undefined : 100);
  const kcal = per(n, 'energy-kcal', g), pr = per(n, 'proteins', g), c = per(n, 'carbohydrates', g), f = per(n, 'fat', g);
  if (![kcal, pr, c, f].every(Number.isFinite) || kcal <= 0 || kcal > 3000) return null;
  const serving = p.serving_size?.trim() || (g === 100 ? '100 g' : undefined);
  const out = item({
    place: 'store', name, brand: p.brands?.split(',')[0], barcode: p.code, category: categoryOf(p.categories_tags),
    kcal, p: pr, c, f, na: per(n, 'sodium', g) != null ? per(n, 'sodium', g) * 1000 : undefined,
    serving, grams: g && g !== 100 ? g : undefined, image: p.image_front_url,
    id: `store-${p.code}`,
  });
  out.pop = p.unique_scans_n ?? 0; // scans: how popular it is, for the bundled subset
  return out;
}

// Anonymous search stops at page 10 (1000 results), so the catalogue is sliced: per category, the most-scanned
// products among the US top 100k of the year, 10 pages each. Union by barcode.
const SLICES = ['snacks', 'salty-snacks', 'chips-and-fries', 'crackers', 'popcorn', 'nuts', 'meat-snacks', 'biscuits-and-cakes', 'cookies', 'chocolates', 'candies', 'confectioneries',
  'beverages', 'sodas', 'energy-drinks', 'juices', 'waters', 'coffees', 'teas', 'sports-drinks', 'plant-based-milks', 'milks', 'iced-teas',
  'dairies', 'yogurts', 'cheeses', 'ice-cream', 'eggs', 'butters',
  'meats', 'poultry', 'sausages', 'deli-meats', 'bacon', 'seafood', 'prepared-meats',
  'frozen-foods', 'frozen-pizzas', 'frozen-meals', 'frozen-desserts',
  'breads', 'bagels', 'tortillas', 'breakfast-cereals', 'granolas', 'cereal-bars', 'protein-bars', 'protein-shakes', 'sports-nutrition', 'meal-replacement',
  'meals', 'sandwiches', 'pizzas', 'soups', 'instant-noodles', 'salads', 'burritos', 'pasta-dishes',
  'sauces', 'condiments', 'dressings', 'spreads', 'nut-butters', 'dips', 'salsas',
  'fruits', 'vegetables', 'fresh-fruits', 'legumes', 'rices', 'pastas', 'desserts', 'puddings', 'pastries'];
const YEAR = process.env.OFF_YEAR ?? '2024';

export async function scrape() {
  const byCode = new Map();
  for (const [n, slice] of SLICES.entries()) {
    for (let page = 1; page <= 10; page++) {
      const url = `https://world.openfoodfacts.org/api/v2/search?popularity_tags=top-100000-us-scans-${YEAR}&categories_tags=en:${slice}&sort_by=unique_scans_n&page_size=100&page=${page}&fields=${FIELDS}`;
      let r;
      try {
        r = await get(url, { json: true, headers: { 'user-agent': 'random-useful-shit food-data (github.com/boharasirshak)' } });
      } catch (e) {
        console.log(`off: ${slice} p${page}: ${e.message}`);
        await sleep(10_000);
        continue;
      }
      if (!r?.products?.length) break;
      for (const p of r.products) {
        if (byCode.has(p.code)) continue;
        const it = toItem(p);
        if (it) byCode.set(p.code, it);
      }
      if (r.products.length < 100) break;
      await sleep(1000); // OFF asks for ≤100 search calls/min; stay well under
    }
    console.log(`off: ${n + 1}/${SLICES.length} ${slice}: ${byCode.size} total`);
  }
  return save('off', { places: [{ id: 'store', name: 'Store', kind: 'store' }], items: [...byCode.values()] });
}
