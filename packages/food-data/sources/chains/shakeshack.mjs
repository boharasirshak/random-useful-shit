// Shake Shack: the master nutrition & allergen PDF (shakeshack.com/nutritionandallergeninfo → widen.net) for numbers,
// the ordering API the menu page calls (ssma24.com, captured in the browser since shakeshack.com is behind Cloudflare) for photos.
import { item, save } from '../../lib.mjs';
import { pdfText, split, clean } from './lib/pdf.mjs';
import { captureJson, norm } from './lib/browse.mjs';

const PDF = 'https://shakeshack.widen.net/content/f0ckdbaukl/original/';
const CAT = { Burgers: 'entree', Chicken: 'entree', 'Breakfast*': 'breakfast', 'Flat -Top Dogs': 'entree', 'Fries & Sides': 'side', Sauces: 'sauce', Shakes: 'dessert', Floats: 'dessert', 'Cups & Sundaes': 'dessert', Drinks: 'drink', Extras: 'side' };
const BASE = /^(Potato Roll|Gluten Free Bun|Lettuce Wrap)$/;
const TOPPING = /^(Burger Patty|Veggie Patty|American Cheese|Avocado|Lettuce|Tomato|Pickle|Onion|Bacon \(2 Slices\)|Cherry Peppers|Pickled Jalapenos|Crispy Onions|Buttermilk Chicken Breast|Whipped Cream|Malt|Oreo Cookie Crumbs)$/;

export async function scrape() {
  const text = await pdfText(PDF);
  const items = []; let cat;
  for (const line of text.split('\n')) {
    const { head, nums } = split(line);
    if (!head.length) continue;
    if (!nums.length) { if (head.length === 1 && head[0] in CAT) cat = CAT[head[0]]; else if (/^(Combo Meals|Limited Time|Lifestyle|Beer)/.test(head[0])) cat = undefined; continue; }
    if (!cat || nums.length < 10) continue;
    const name = clean(head.join(' ').replace(/Contains:.*$/, '').replace(/,\s*$/, ''));
    if (!name || /Catering|Gallon|\(Gallon\)|Large\b.*\*$|Double Down/.test(name)) continue;
    const [kcal, f, , , , na, c, , , p] = nums.slice(-10);
    let category = cat;
    if (BASE.test(name)) category = 'base'; else if (TOPPING.test(name)) category = 'side';
    const label = name.replace(/^(.*), (Single|Double|Triple)$/, '$2 $1').replace(/ (Small|Large)\*?$/, ' ($1)');
    items.push(item({ place: 'shakeshack', name: label, category, kcal, p, c, f, na }));
  }
  // photos
  const hits = await captureJson('https://shakeshack.com/menu', /ssma24\.com\/v3\/locations\/\d+\/menu/, { ms: 12000 });
  const img = {};
  for (const c of hits[0]?.body?.data?.menu?.categories ?? []) for (const p of c.products ?? []) if (p.imageurl) img[norm(clean(p.name))] ??= p.imageurl;
  let n = 0;
  for (const it of items) {
    const k = norm(it.name), alt = norm(it.name.replace(/^(Single|Double|Triple) /, '')), alt2 = norm(it.name.replace(/^Single /, ''));
    const u = img[k] ?? img['the ' + k] ?? img[alt2] ?? img[alt];
    if (u) { it.image = u; n++; }
  }
  console.log(`shakeshack: ${Object.keys(img).length} photos in menu api, ${n} matched`);
  return save('shakeshack', { places: [{ id: 'shakeshack', name: 'Shake Shack', kind: 'fast', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'] } } }], items });
}
