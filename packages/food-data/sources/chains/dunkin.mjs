// Dunkin': macros from the Nutrition Guide PDF its /nutrition page links to (the ordering API only has calories); photos from
// that ordering API. Drinks in Medium only; regional, kosher and packaged (grocery) rows left out.
import { item, save } from '../../lib.mjs';
import { pdfRows } from './_shared/pdf.mjs';
import { inspireMenu, norm, splitRow } from './_shared/util.mjs';

const PLACE = { id: 'dunkin', name: "Dunkin'", kind: 'fast', orders: { 'À la carte': null } };
const PDF = 'https://assets.ctfassets.net/ubkcphxhphh0/3qEP8wMU2IFmLsLyEeWLuc/7bdae361f785d1611d25c4d859f8c721/DD_W7_nutrition_guide.pdf';
const CATEGORY = h => /regional|kosher|packaged|k-cup|catering/i.test(h) ? null
  : /donut|munchkin|pie|cookie|brownie/i.test(h) ? 'dessert'
  : /hash brown/i.test(h) ? 'side'
  : /cream cheese|condiment|spread|butter/i.test(h) ? 'sauce'
  : /muffin|bagel|croissant|bakery|toast|stuffer|sandwich|wrap|omelet|bacon|kolache|wake-up|bites/i.test(h) ? 'breakfast'
  : /coffee|latte|espresso|brew|refresher|coolatta|frozen|tea|lemonade|chocolate|matcha|cappuccino|macchiato|americano|zero|energy|beverage|chiller|dunkalatte|smoothie/i.test(h) ? 'drink' : null;
const SIZES = /^(Small|Medium|Large|Extra Large|X-?Large)$/;
// "Hot Coffee with Cream and Sugar", "… with Whole Milk": the PDF lists every milk/sugar permutation; keep the base drink.
const PERMUTATION = / with (Cream|Skim Milk|Whole Milk|Oat ?milk|Almond ?[Mm]ilk|Black|Sugar|Espresso Shot|Sugar Free)|^Box 'O Joe/i;

export async function scrape() {
  const menu = await inspireMenu('api-idp.dunkindonuts.com');
  const api = {};
  for (const p of Object.values(menu.products)) if (p.imageUrl && !p.isVirtual) for (const k of new Set([norm(p.displayName), norm(p.displayName.replace(/Original Blend|Dunkin'|s$/g, ''))])) api[k] ??= p.imageUrl;
  // exact name, else the longest menu name the PDF name contains ("Nutty Pumpkin Iced Coffee" → "Iced Coffee")
  const img = name => { const k = norm(name.replace(/ (Donut|Stick|Munchkins)$/, '')); return api[k] ?? Object.keys(api).filter(a => a.length > 5 && k.includes(a)).sort((a, b) => b.length - a.length).map(a => api[a])[0]; };

  const rows = await pdfRows(PDF);
  const items = [], fragments = [];
  let category;
  for (let i = 0; i < rows.length; i++) {
    const { y, cells } = rows[i];
    const { head, nums } = splitRow(cells);
    if (rows[i + 1]?.cells[0] === 'Serving Size') { category = CATEGORY(head.join(' ')); continue; } // section header
    if (nums.length >= 15 && head.length >= 2) {
      const [kcal, f, , , , na, c, , , , p] = nums; // kcal fat sat trans chol sodium carb fiber sugars added protein ...
      items.push({ y, name: head.slice(0, -1).join(' '), serving: head[head.length - 1], kcal, f, na, c, p, category });
    } else if (head.length === 1 && !nums.length && category) fragments.push({ y, text: head[0] });
  }
  // A long name wraps onto the line above or below its numbers; glue each fragment to the nearest row.
  for (const fr of fragments) {
    const near = items.reduce((a, b) => (Math.abs(b.y - fr.y) < Math.abs(a.y - fr.y) ? b : a));
    if (Math.abs(near.y - fr.y) < 20) near.name += ' ' + fr.text;
  }
  const out = [];
  for (const r of items) {
    const name = r.name.replace(/\s*-?\s*(Small|Medium|Large|Extra Large|X-?Large)$/, '').replace(/\s*-\s*$/, '').replace(/\s+/g, ' ').trim();
    if (!r.category || !(r.kcal > 0) || PERMUTATION.test(name)) continue;
    const sized = SIZES.test(r.serving);
    if (sized && r.serving !== 'Medium') continue;
    out.push(item({ place: 'dunkin', name: sized ? `${name} (M)` : name, category: r.category, kcal: r.kcal, p: r.p, c: r.c, f: r.f, na: r.na, serving: sized ? undefined : r.serving, image: img(name) }));
  }
  return save('dunkin', { places: [PLACE], items: out });
}
