// Starbucks US: the ordering menu JSON (apiproxy/v1/ordering/menu) lists products; each product's
// apiproxy/v1/ordering/<n>/<form> carries per-size nutrition. Drinks at Grande, food as sold. Plain get() works.
import { get, item, save, sleep } from '../../lib.mjs';

const API = 'https://www.starbucks.com/apiproxy/v1/ordering';
const SKIP = /^(At Home Coffee|The Latest|Coffee Traveler|Shopping Bag)$/; // retail beans, seasonal dupes, 96 oz boxes
const FOOD = { Breakfast: 'breakfast', Bakery: 'dessert', Treats: 'dessert', Lunch: 'entree', Snacks: 'side' };

const fact = (facts, re) => facts.find(f => re.test(f.id))?.value;

export async function scrape() {
  const menu = await get(`${API}/menu`, { json: true });
  const products = []; // [product, category]
  const walk = (node, cat) => {
    if (SKIP.test(node.name)) return;
    const c = cat ?? FOOD[node.name];
    for (const p of node.products ?? []) products.push([p, c]);
    for (const ch of node.children ?? []) walk(ch, c);
  };
  for (const m of menu.menus) walk(m, undefined);

  const items = [];
  for (const [p, cat] of products) {
    const d = await get(`${API}${p.uri.replace(/^\/product/, '')}`, { json: true });
    await sleep(500);
    const prod = d?.products?.[0];
    if (!prod) continue;
    const drink = /bev/i.test(prod.productType);
    const size = prod.sizes.find(s => s.sizeCode === 'Grande') ?? prod.sizes.find(s => s.default) ?? prod.sizes[0];
    const n = size?.nutrition;
    if (!n?.additionalFacts) continue;
    const f = n.additionalFacts;
    const [fat, carb, pro, na] = [fact(f, /^totalFat$/), fact(f, /carb/i), fact(f, /protein/i), fact(f, /sodium/i)];
    if ([fat, carb, pro].some(v => v == null)) continue;
    items.push(item({
      place: 'starbucks', category: drink ? 'drink' : cat ?? 'side',
      name: drink && prod.sizes.length > 1 ? `${prod.name} (${size.name})` : prod.name,
      kcal: n.calories?.displayValue, p: pro, c: carb, f: fat, na,
      serving: n.servingSize?.displayValue, image: prod.imageURL || p.imageURL || undefined,
    }));
  }
  return save('starbucks', { places: [{ id: 'starbucks', name: 'Starbucks', kind: 'fast', orders: { 'À la carte': null } }], items });
}
