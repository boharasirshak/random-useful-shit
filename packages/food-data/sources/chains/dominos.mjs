// Domino's: the Nutrition Guide PDF (linked as "Nutrition details" on dominos.com/content/nutrition). Pizzas are given per
// ingredient per slice, so a slice of cheese/pepperoni is summed the way the chain's Cal-O-Meter does: crust + sauce +
// cheese (+ topping). Specialty pizzas (per Large slice), hoagies, sides, chicken, sandwiches, pasta and desserts are
// listed whole. No photos: dominos.com serves unnamed CMS assets.
import { item, save } from '../../lib.mjs';
import { pdfText, split, clean } from './lib/pdf.mjs';

const PDF = 'https://www.dominos.com/cms/assets/0e4a30f5-a8fb-4c2d-ab54-b1aae92b72df';
const SIDES = { BREADS: 'side', CHICKEN: 'entree', DESSERTS: 'dessert', 'DIPPING CUPS': 'sauce', 'OVEN-BAKED SANDWICHES': 'entree', 'PENNE PASTA': 'entree', SALADS: 'side', 'SALAD DRESSINGS': 'sauce' };

export async function scrape() {
  const text = await pdfText(PDF);
  const items = []; const seen = new Set();
  const push = (name, category, [g, kcal, f, , , , na, c, , , , p], serving) => { if (seen.has(name)) return; seen.add(name); items.push(item({ place: 'dominos', name, category, kcal, p, c, f, na, grams: g, serving })); };
  const vals = {}; // build-your-own component numbers: '<size prefix><sub>' → name → numbers
  let page = '', sub = '', pizza = '', sidesDone = false;
  for (const line of text.split('\n')) {
    const { head, nums } = split(line);
    if (!head.length) continue;
    const h = head.join(' ');
    if (/^\d+" (Large|Medium|Small|Extra Large) |^Hand Tossed Breakfast|^Domino's Hoagies/.test(h) || /Specialty Pizzas/i.test(h)) { page = h; sub = ''; continue; }
    if (/^Sandwiches, Pasta/.test(h)) { if (page.startsWith('Sandwiches')) sidesDone = true; page = h; sub = ''; continue; }
    if (!nums.length) { if (/^\*?[A-Z][A-Z ,&()\-'0-9]+$/.test(h) || /^1 TOPPING PIZZA/.test(h)) sub = h.replace(/^\*/, '').replace(/^1 TOPPING.*/, '1 TOPPING'); continue; }
    if (nums.length < 12) continue;
    const name = clean(head[0]);
    const prefix = page.startsWith('14" Large Hand Tossed') ? '' : page.startsWith('12" Medium Pan') ? 'PAN ' : null;
    if (prefix != null) { (vals[prefix + sub] ??= {})[name] = nums.slice(-12); continue; }
    const size = head.find(c => /\(1\/\d pizza\)/.test(c));
    if (size) { if (head[0] !== size) pizza = clean(head[0]); if (/^L /.test(size)) push(`${pizza} (slice, Large)`, 'entree', nums.slice(-12), '1/8 pizza'); continue; }
    if (page.startsWith("Domino's Hoagies") && sub === 'STANDARD BUILDS') { push(`${name} Hoagie (half)`, 'entree', nums.slice(-12), '1/2 hoagie'); continue; }
    if (page.startsWith('Sandwiches') && !sidesDone) {
      const cat = SIDES[sub]; if (!cat) continue;
      const serving = head[1] ?? '';
      let label = name.replace(/Di ppi ng Cup/, 'Dipping Cup').replace(/\s+/g, ' ');
      if (sub === 'DIPPING CUPS' && !/Cup$/.test(label)) label += ' Dipping Cup';
      if (/pieces/.test(serving)) label += ` (${serving.replace(' pieces', ' pc')})`;
      if (/1\/2 Sandwich/.test(serving)) label += ' Sandwich (half)';
      push(label, cat, nums.slice(-12), serving);
    }
  }
  const add = (...rows) => rows.reduce((a, r) => a.map((v, i) => v + (r?.[i] ?? 0)), new Array(12).fill(0));
  const L = vals, crust = L.CRUST ?? {}, sauce = L.SAUCE?.['Pizza Sauce'], cheese = L['CHEESE ONLY PIZZA']?.['Regular Cheese'], cheeseT = L['CHEESE PIZZA ALONG WITH OTHER TOPPINGS']?.['Regular Cheese'], top = L['1 TOPPING'] ?? {};
  for (const [label, c] of [['Hand Tossed', crust['Hand Tossed (Serving Size is 1/8 of Pizza)'] && add(crust['Hand Tossed (Serving Size is 1/8 of Pizza)'], crust['Garlic Oil Blend (Hand Tossed Only)'])], ['Crunchy Thin Crust', crust['Crunchy Thin (Serving Size is 1/8 of Pizza)']]]) {
    if (!c || !sauce || !cheese) continue;
    push(`Cheese Pizza, ${label} (slice, Large)`, 'entree', add(c, sauce, cheese), '1/8 pizza');
    for (const t of ['Pepperoni', 'Italian Sausage', 'Ham', 'Bacon', 'Premium Chicken', 'Mushrooms', 'Beef']) if (top[t]) push(`${t} Pizza, ${label} (slice, Large)`, 'entree', add(c, sauce, cheeseT, top[t]), '1/8 pizza');
  }
  const pan = L['PAN CRUST']?.['Pan Pizza (Serving Size is 1/8 of Pizza)'], panS = L['PAN SAUCE']?.['Pizza Sauce'], panC = L['PAN CHEESE ONLY PIZZA']?.['Regular Cheese'], panCT = L['PAN CHEESE PIZZA ALONG WITH OTHER TOPPINGS']?.['Regular Cheese'], panT = L['PAN 1 TOPPING'] ?? {};
  if (pan && panS && panC) { push('Cheese Pizza, Handmade Pan (slice, Medium)', 'entree', add(pan, panS, panC), '1/8 pizza'); if (panT.Pepperoni) push('Pepperoni Pizza, Handmade Pan (slice, Medium)', 'entree', add(pan, panS, panCT, panT.Pepperoni), '1/8 pizza'); }
  return save('dominos', { places: [{ id: 'dominos', name: "Domino's", kind: 'fast', orders: { 'À la carte': null } }], items });
}
