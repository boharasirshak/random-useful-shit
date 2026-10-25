// Chipotle: the nutrition calculator's two XHRs (services.chipotle.com, Kasada-protected so Playwright captures them).
// menu-metadata/nutrition has macros + photos per CMG id; universalmenus/menurules has the names and what goes in a bowl.
// Build-your-own: proteins are entrees, rice/beans/tortillas are base, toppings side, salsas sauce.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, browser, item, save } from '../../lib.mjs';

const PAGE = 'https://www.chipotle.com/nutrition-calculator';
const NUTRITION = /menu-metadata\/nutrition\?/;
const RULES = /universalmenus\/menurules\?/;

// Same on-disk cache as lib.get(), for bodies that only a browser can fetch.
function cachePath(url) { return join(ROOT, 'cache', 'http', createHash('sha1').update(url).digest('hex')); }
function cached(url, ttlDays = 7) {
  const key = cachePath(url);
  if (!existsSync(key)) return null;
  const { t, body } = JSON.parse(readFileSync(key, 'utf8'));
  return Date.now() - t < ttlDays * 864e5 ? JSON.parse(body) : null;
}
function store(url, body) { mkdirSync(join(ROOT, 'cache', 'http'), { recursive: true }); writeFileSync(cachePath(url), JSON.stringify({ t: Date.now(), url, body })); }

async function fetchBoth() {
  const hit = cached(PAGE + '#nutrition') && cached(PAGE + '#rules');
  if (hit) return { nutrition: cached(PAGE + '#nutrition'), rules: cached(PAGE + '#rules') };
  const { page, close } = await browser();
  try {
    const want = [page.waitForResponse(r => NUTRITION.test(r.url()), { timeout: 60000 }), page.waitForResponse(r => RULES.test(r.url()), { timeout: 60000 })];
    await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const [n, r] = await Promise.all(want);
    const nutrition = await n.text(), rules = await r.text();
    store(PAGE + '#nutrition', nutrition);
    store(PAGE + '#rules', rules);
    return { nutrition: JSON.parse(nutrition), rules: JSON.parse(rules) };
  } finally {
    await close();
  }
}

// name → [category, rename?]. Names are Chipotle's own (menurules itemName), so ids stay stable.
const BASE = { 'White Rice': 1, 'Brown Rice': 1, 'Black Beans': 1, 'Pinto Beans': 1, 'Mexican Cauliflower Rice': 1, 'Supergreens Lettuce Blend': 1 };
const TOPPING = { Cheese: 1, 'Romaine Lettuce': 1, Guacamole: 1, 'Fajita Veggies': 1, 'Sour Cream': 1, 'Queso Blanco': 1 };
const SAUCE = { 'Fresh Tomato Salsa': 1, 'Roasted Chili-Corn Salsa': 1, 'Tomatillo-Green Chili Salsa': 1, 'Tomatillo-Red Chili Salsa': 1, 'Chipotle-Honey Vinaigrette': 1, 'Cilantro Lime Sauce': 1 };
const SIDES = { Chips: 1, 'Large Chips': 1, 'Chips & Guacamole': 1, 'Chips & Queso Blanco': 1, 'Chips & Fresh Tomato Salsa': 1, 'Side of Guacamole': 1, 'Side of Queso Blanco': 1, 'Large Side of Guacamole': 1, 'Chili Lime Chips': 1 };
const DRINKS = ['22 fl oz Soda/Iced Tea', '22 fl oz Tractor Organic Lemonade', '22 fl oz Tractor Organic Mandarin Agua Fresca', '22 fl oz Tractor Organic Berry Agua Fresca', '22 fl oz Tractor Organic Hibiscus Lemonade', '22 fl oz Tractor Organic Watermelon Limeade', '22 fl oz Tractor Organic Mango Lemonade', 'Mexican Coca-Cola', 'Mexican Sprite', 'Jarritos Mango', 'Jarritos Guava', 'Jarritos Grapefruit', 'Bottled Water', 'Topo Chico Mineral Water', 'Apple Juice', 'Tractor Organic Black Tea', 'Tractor Organic Lemonade'];

export async function scrape() {
  const { nutrition, rules } = await fetchBoth();
  const meta = nutrition.items; // CMG id → { nutrition, portion, thumbnailUrl }
  const items = [];
  const seen = new Set();

  const add = (id, name, category) => {
    const m = meta[id], n = m?.nutrition;
    if (!n || n.tcal == null || n.prot == null || n.carb == null || n.tfat == null || seen.has(name)) return;
    if (n.tcal > 0 && !(n.prot + n.carb + n.tfat)) return; // calories but no macros (a few drinks): Chipotle has not filled them in
    seen.add(name);
    const p = m.portion, oz = p?.unit === 'oz' ? p.value : undefined;
    items.push(item({
      place: 'chipotle', name, category, kcal: n.tcal, p: n.prot, c: n.carb, f: n.tfat, na: n.sodi,
      serving: p?.value ? `${p.value} ${p.unit}` : undefined, grams: oz ? oz * 28.35 : undefined,
      image: m.thumbnailUrl && !m.thumbnailUrl.endsWith('.svg') ? m.thumbnailUrl : undefined,
    }));
  };

  // Proteins: the "<Protein> Bowl" record is the protein portion itself (4 oz chicken = 180 kcal); veggie is 0 kcal and skipped by the guard below.
  for (const e of rules.entrees) if (e.itemType === 'Bowl' && meta[e.itemId]?.nutrition?.tcal > 0) add(e.itemId, e.primaryFillingName.trim(), 'entree');

  // Components come from what a bowl / burrito / taco / salad can contain.
  const contents = new Map();
  for (const e of rules.entrees) for (const c of e.contents ?? []) if (!contents.has(c.itemName)) contents.set(c.itemName, c.itemId);
  for (const [name, id] of contents) {
    if (BASE[name]) add(id, name, 'base');
    else if (TOPPING[name]) add(id, name, 'side');
    else if (SAUCE[name]) add(id, name, 'sauce');
    else if (name === 'Soft Flour Tortilla') add(id, 'Soft Flour Tortillas (3 Tacos)', 'base');
    else if (name === 'Crispy Corn Tortilla') add(id, 'Crispy Corn Tortillas (3 Tacos)', 'base');
  }
  const tortilla = rules.sides.find(s => s.itemName === 'Tortilla on the Side');
  if (tortilla) add(tortilla.itemId, 'Flour Tortilla (Burrito)', 'base');

  for (const s of rules.sides) if (SIDES[s.itemName]) add(s.itemId, s.itemName, 'side');

  for (const d of rules.drinks) {
    if (!DRINKS.includes(d.itemName.trim()) || !meta[d.itemId]?.portion?.value) continue;
    const name = d.itemName.trim().replace(/^22 fl oz (.+)$/, '$1 (22 fl oz)');
    add(d.itemId, name, 'drink');
  }

  const place = {
    id: 'chipotle', name: 'Chipotle', kind: 'fast',
    orders: {
      'À la carte': null,
      Bowl: { slots: ['base', 'base', 'entree'], extras: ['side', 'sauce'] },
      Burrito: { slots: ['base', 'base', 'base', 'entree'], extras: ['side', 'sauce'] },
      Tacos: { slots: ['base', 'entree'], extras: ['side', 'sauce'] },
    },
  };
  return save('chipotle', { places: [place], items });
}
