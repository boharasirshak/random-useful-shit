// Jack in the Box: the only published nutrition is a poster PDF (jackinthebox.com → "Nutrition & Allergens", hosted on
// Sanity). Its text comes out scrambled, so rows are rebuilt from glyph positions and a row is kept only when its
// calories agree with its macros and its fat calories (a misread column fails that). Photos: the menu API the site calls.
import { browser, item, save } from '../../lib.mjs';
import { pdfText, clean } from './lib/pdf.mjs';
import { norm } from './lib/browse.mjs';

const SITE = 'https://www.jackinthebox.com';
const ALLERGEN = /^(?:[SEMWFCPT]{1,6}(?:ss)?|ss|[SEMWFCPT],)$/;
const NUM = /^-?\d+(\.\d+)?$|^--$|^\.5$/;
const JUNK = /Nutrition information|crunchy toppings|see nutritional|Better for You|secua gnippi|eihcnu|^\d+[A-Z]|^(Other|Salads|Breakfast|Beverages|Kids|Sweet N|ﬂ\.? ?oz\.?)$/;
const STRIP = /\^?Buns contain sesame in some regions\.?|^(Burgers & More|Chicken & More|Cheeses|Jack's Deals|Snacks & Sides|S?andwich Sauces|Side Salad\*?|Taco, Regular \(1 Taco\)|Stuﬀed Jalapeños \(3 pc\.\)|Seasoned Curly Fries \(Medium\)|The Cluck Chicken Sandwich(?= Real))\s+(?=\S)/g;
const CATS = [[/Breakfast|Croissant|Burrito|French Toast|Hash Brown|Extreme Sausage|Sourdough Breakfast|Supreme Croissant|Ultimate Breakfast|Loaded Breakfast/i, 'breakfast'], [/Shake|Cake|Churros|Cheesecake|Cookie|Brownie/i, 'dessert'], [/\bTea\b|Coffee|Coﬀee|Red Bull|Juice|Water|^Milk$|Coca|Coke|Sprite|Fanta|Dr Pepper|Barq|Lemonade|Boba|Hi-C|Powerade/i, 'drink'], [/Fries|Onion Rings|Egg Roll|Jalapeño|Jalapenos|Halfsies|Side Salad|^(American|Real Swiss|Swiss Style) Cheese$|Taco, Tiny|Grilled Onions/i, 'side'], [/Sauce|Dip Cup|Dipping|Dressing|Ketchup|Mustard|Mayo|Syrup|Jelly|Jam|Butter \(|Spread|Salsa|Croutons|Tortilla Strips/i, 'sauce']];
const close = (a, b, tol) => Math.abs(a - b) <= Math.max(20, tol * Math.max(a, b));

export async function scrape() {
  const home = await (await fetch(SITE + '/', { headers: { 'user-agent': 'Mozilla/5.0' } })).text().catch(() => '');
  const pdf = home.match(/https:\/\/cdn\.sanity\.io\/files\/[^"]+\.pdf/)?.[0] ?? 'https://cdn.sanity.io/files/j2jr32rk/content-production/5cbdb27f7f3cd5978732e01d566d4e11e064f0e4.pdf';
  const chunks = JSON.parse(await pdfText(pdf, 'chunks'));
  chunks.sort((a, b) => b[1] - a[1] || a[2] - b[2]);
  const rows = []; let cur = null;
  for (const ch of chunks) { if (!cur || Math.abs(cur.y - ch[1]) > 2.5) rows.push(cur = { y: ch[1], parts: [] }); cur.parts.push(ch); }
  const found = [];
  for (const row of rows) {
    const toks = row.parts.sort((a, b) => a[2] - b[2]).flatMap(p => p[3].split(/\s+/)).filter(Boolean);
    const segs = []; let name = [], nums = [];
    for (const t of toks) {
      if (NUM.test(t)) { nums.push(t === '--' ? 0 : Number(t)); continue; }
      if (ALLERGEN.test(t)) continue;
      if (nums.length) { segs.push([name, nums]); name = []; nums = []; }
      name.push(t);
    }
    segs.push([name, nums]);
    for (const [n, v] of segs) {
      if (!n.length || v.length < 13) continue;
      const [g, kcal, calFat, f, sat, trans, , na, , c, fiber, sugar, p] = v;
      let label = clean(n.join(' ').replace(/\(a al carte\)|\(in Munchie Meal\)/, '')).replace(STRIP, '').trim();
      const sane = kcal > 0 && close(kcal, 4 * p + 4 * c + 9 * f, 0.15) && close(calFat, 9 * f, 0.2) && sat <= f + 0.5 && trans <= 5 && fiber <= Math.max(c, 1) && sugar <= c + 1 && na < 6000 && g < 2000;
      if (JUNK.test(label) || label.length < 3 || label.split(' ').length > 7 || !sane) continue;
      label = label.replace(/^(Rg|Lg) (.*?) with Whipped Topping -\s?(\d+) ?oz$/, (m, s, x) => `${x} (${s[0]})`).replace(/ - (Rg|Lg)\.$/, (m, s) => ` (${s[0]})`).replace(/\s*-\s*(\d+) ?ﬂ?\.? ?oz\.?$/, ' ($1 oz)').replace(/ \((Small|Medium|Large)\)$/, (m, s) => ` (${s[0]})`).replace(/Coﬀee/g, 'Coffee').replace(/Stuﬀed/g, 'Stuffed').replace(/ﬂ\./g, 'fl');
      found.push({ label, g, kcal, f, na, c, p });
    }
  }
  // a row glued to its neighbour panel repeats another row's numbers under a longer name: keep the shorter name
  const items = [];
  for (const f of found) {
    const key = [f.kcal, f.f, f.c, f.p, f.na].join('/');
    const dup = found.find(o => o !== f && [o.kcal, o.f, o.c, o.p, o.na].join('/') === key && f.label.includes(o.label) && o.label.length < f.label.length);
    if (dup || /Kid|Munchie|Allergen|Nutrition/i.test(f.label)) continue;
    items.push(item({ place: 'jackinbox', name: f.label, category: CATS.find(([re]) => re.test(f.label))?.[1] ?? 'entree', kcal: f.kcal, p: f.p, c: f.c, f: f.f, na: f.na, grams: f.g }));
  }
  // photos
  const img = {};
  const { page, close: done } = await browser();
  try {
    await page.goto(SITE + '/menu', { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForTimeout(6000);
    const api = 'https://api.jackintheboxdigital.com/digital-account/menu-experience-api';
    const call = u => page.evaluate(async u => { const r = await fetch(u, { headers: { 'x-jitb-platform': 'web', 'x-jitb-integration-type': 'olo' } }); return r.ok ? r.json() : null; }, u);
    for (const c of (await call(`${api}/v1/menu/0/categories`)) ?? []) {
      if (/kids|deals|what-s-new|munchie/i.test(c.slug)) continue;
      for (const p of (await call(`${api}/v2/menu/0/categories/slug/${c.slug}/items`))?.items ?? []) if (p.imageUrl) img[norm(clean(p.name))] ??= p.imageUrl;
      await page.waitForTimeout(600);
    }
  } finally { await done(); }
  let n = 0;
  for (const it of items) { const k = norm(it.name.replace(/ \([SMLR]\)$| \(\d+ pc\.?\)$/, '')); const u = img[k] ?? img[Object.keys(img).find(x => x.startsWith(k) || k.startsWith(x))]; if (u) { it.image = u; n++; } }
  console.log(`jackinbox: ${Object.keys(img).length} photos from menu api, ${n} matched`);
  return save('jackinbox', { places: [{ id: 'jackinbox', name: 'Jack in the Box', kind: 'fast', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'] } } }], items });
}
