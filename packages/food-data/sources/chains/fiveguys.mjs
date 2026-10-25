// Five Guys: the US nutrition & allergen PDF linked from fiveguys.com/nutritional-allergy-information/. It lists components
// (patty, bun, cheese, bacon, fries by size, shake base + mix-ins), so the menu items are summed from them the way the
// chain's own calculator does. No per-item photos on fiveguys.com (the ordering site sits behind Cloudflare).
import { get, item, save } from '../../lib.mjs';
import { pdfText, split, clean } from './lib/pdf.mjs';

const PAGE = 'https://www.fiveguys.com/nutritional-allergy-information/';

export async function scrape() {
  const html = await get(PAGE);
  const url = html?.match(/https:\/\/www\.fiveguys\.com\/wp-content\/uploads\/[^"']+Nutrition[^"']*\.pdf/i)?.[0];
  if (!url) throw new Error('nutrition PDF link not found on ' + PAGE);
  const text = (await pdfText(url)).split('INGREDIENT LISTING')[0];

  // name → { g, kcal, p, c, f, na } per component. Section names are kept so a shake mix-in can be told from a mini mix-in.
  const comp = {}; let section = '';
  for (const line of text.split('\n')) {
    const { head, nums } = split(line);
    if (!head.length) continue;
    if (!nums.length) { if (/^[A-Z][A-Z &\-/]+$/.test(head[0].trim())) section = head[0].trim(); continue; }
    if (nums.length < 12) continue;
    const [g, kcal, , f, , , , na, c, , , p] = nums;
    const name = clean(head[0]).replace(/ \(Supplier [A-Z]\)/, '');
    const key = (section.startsWith('MINI') ? 'mini:' : '') + name;
    comp[key] ??= { g, kcal, p, c, f, na }; // first supplier listed wins
  }
  const need = k => { if (!comp[k]) throw new Error('component missing: ' + k); return comp[k]; };
  const sum = parts => parts.reduce((a, [k, q = 1]) => { const x = need(k); for (const f of ['g', 'kcal', 'p', 'c', 'f', 'na']) a[f] += x[f] * q; return a; }, { g: 0, kcal: 0, p: 0, c: 0, f: 0, na: 0 });
  const items = [];
  const add = (name, category, parts, extra = {}) => { const s = sum(parts); items.push(item({ place: 'fiveguys', name, category, kcal: s.kcal, p: s.p, c: s.c, f: s.f, na: s.na, grams: s.g, ...extra })); };

  const patty = ['Hamburger Patty'], cheese = ['Cheese (1 slice)'], bacon = ['Bacon (2 pieces)'];
  for (const [little, n] of [['', 2], ['Little ', 1]]) {
    const base = [['Hamburger Bun'], [patty[0], n]];
    add(`${little}Hamburger`, 'entree', base);
    add(`${little}Cheeseburger`, 'entree', [...base, [cheese[0], n]]);
    add(`${little}Bacon Burger`, 'entree', [...base, bacon]);
    add(`${little}Bacon Cheeseburger`, 'entree', [...base, [cheese[0], n], bacon]);
  }
  add('Veggie Sandwich', 'entree', [['Hamburger Bun'], ['Lettuce'], ['Tomatoes'], ['Onions / Grilled Onions'], ['Grilled Mushrooms'], ['Green Peppers']]);
  add('Grilled Cheese', 'entree', [['Hamburger Bun'], ['Cheese (1 slice)', 2]]);
  const dog = [['Hot Dog Buns'], ['Hot Dog']];
  add('Hot Dog', 'entree', dog);
  add('Cheese Dog', 'entree', [...dog, cheese]);
  add('Bacon Dog', 'entree', [...dog, bacon]);
  add('Bacon Cheese Dog', 'entree', [...dog, cheese, bacon]);
  for (const [style, label] of [['Five Guys Style', 'Fries'], ['Cajun Style', 'Cajun Fries']]) for (const size of ['Little', 'Regular', 'Large']) add(`${label} (${size})`, 'side', [[`${size} ${style}`]]);
  for (const t of ['Cheese (1 slice)', 'Bacon (2 pieces)', 'Mayonnaise', 'Ketchup', 'BBQ Sauce', 'A.1. Sauce', 'Relish', 'Grilled Mushrooms', 'Onions / Grilled Onions', 'Lettuce', 'Tomatoes', 'Green Peppers', 'Jalapeño Peppers']) add(t.replace(' / ', ' or '), 'side', [[t]]);
  add('Five Guys Sauce', 'sauce', [['Five Guys Sauce']]);
  add('Fry Sauce', 'sauce', [['Fry Sauce PC']]);
  add('Cheese Sauce', 'sauce', [['Cheese Sauce']]);
  add('Peanuts (1 oz)', 'side', [['Bulk Peanuts (1oz.)']]);
  const shakes = { Vanilla: [], Chocolate: [['Chocolate']], Strawberry: [['Strawberry']], 'Oreo Cookie': [['Oreo Cookie Pieces']], 'Salted Caramel': [['Salted Caramel']], Coffee: [['Coffee']], 'Peanut Butter': [['Peanut Butter']], "Reese's Peanut Butter Cup": [["Reese's Peanut Butter Cup"]], Banana: [['Banana Marinade']], Bacon: [['Bacon (2 pieces)']] };
  for (const [flavor, mix] of Object.entries(shakes)) {
    add(`${flavor} Milkshake`, 'dessert', [['Vanilla Shake Base'], ['Whipped Cream'], ...mix]);
    add(`${flavor} Milkshake (Mini)`, 'dessert', [['mini:Mini Vanilla Shake Base'], ['mini:Whipped Cream'], ...mix.map(([k]) => ['mini:' + k])]);
  }
  for (const d of ['Chocolate Milk', 'Low Fat Milk', 'Apple Juice', 'Orange Juice Blend']) add(d, 'drink', [[d]]);

  return save('fiveguys', { places: [{ id: 'fiveguys', name: 'Five Guys', kind: 'fast', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'] } } }], items });
}
