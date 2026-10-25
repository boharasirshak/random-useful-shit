// Sheetz: the calculator on sheetz.com/nutrition is a Nutritionix embed; its data file (every MTO item, its default
// ingredients and per-ingredient nutrition) is linked from the embed page. An item is the sum of its default ingredients ×
// quantity × serving size × the template's group multiplier (pumps per size), which is what the calculator shows (checked
// against it: Big Mozz Burger 720 kcal, Shwingz dozen 870, Caramel Vanilla latte 110). Fully build-your-own items (MTO
// burger, hot dog, subs) and recipes whose required choices (milk, bun) have no default are skipped: their defaults are
// half a product. No photos: the ordering site needs a store picked first.
import { get, item, save } from '../../lib.mjs';

const EMBED = 'https://www.nutritionix.com/sheetz/nutrition-calculator/premium';
const SKIP = /^Self-serv|Seasonal|Catering|Protein Pack'd|Craft'd Popz/;
const CAT = [[/Donuts|Shweetz|Cheezecake|Milkshake/, 'dessert'], [/Breakfast/, 'breakfast'], [/Appz|Sidez/, 'side'], [/Latte|Mocha|Cold Brew|Americano|Cappuccino|Cider|Chai|Hot Chocolate|Lemonade|Refresher|Smoothie|Coffee/, 'drink']];

export async function scrape() {
  const html = await get(EMBED);
  const url = html?.match(/https:\/\/[a-z0-9.]+\.cloudfront\.net\/calculator\/[\d-]+\.json(\.gz)?/)?.[0];
  if (!url) throw new Error('calculator data url not found on ' + EMBED);
  const { calculator: d } = await get(url, { json: true });
  const groupOf = {}; // ingredient id → group ids
  for (const [gid, list] of Object.entries(d.groupIngredients)) for (const { ingredient_id } of list) (groupOf[ingredient_id] ??= []).push(gid);
  const items = []; let skipped = 0;
  for (const [cid, cat] of Object.entries(d.categories)) {
    if (SKIP.test(cat.name)) continue;
    const category = CAT.find(([re]) => re.test(cat.name))?.[1] ?? 'entree';
    for (const { item_id } of d.categoryItems[cid] ?? []) {
      const it = d.items[item_id]; const defaults = Object.values(d.itemDefaultIngredients[item_id] ?? {});
      if (!it || !defaults.length || /\bMTO\b|Made-To-Order|Make Your Own|Build Your Own/.test(it.name)) continue;
      const tgroups = (d.templateGroups[it.template_id] ?? []).map(g => String(g.group_id));
      const mult = gid => d.templateGroupMultipliers[it.template_id]?.[gid]?.multiplier ?? 1;
      // a single-choice bread/milk/base group with nothing chosen by default → the default build is half a product
      const incomplete = tgroups.some(gid => d.groups[gid]?.multiple_select === 0 && /bread|bun|roll|milk|base|tortilla|wrap|crust/i.test(d.groups[gid].name) && !defaults.some(x => groupOf[x.ingredient_id]?.includes(gid)));
      if (incomplete) { skipped++; continue; }
      const t = { kcal: 0, p: 0, c: 0, f: 0, na: 0, g: 0 };
      for (const x of defaults) {
        const ing = d.ingredients[x.ingredient_id]; if (!ing) continue;
        const gid = (groupOf[x.ingredient_id] ?? []).find(g => tgroups.includes(g));
        const q = (x.quantity ?? 1) * (x.serving_size ?? 1) * (gid ? mult(gid) * (d.groupIngredientsMultiplierValue[gid]?.[x.ingredient_id]?.multiplier ?? 1) : 1);
        t.kcal += ing.calories * q; t.p += ing.protein * q; t.c += ing.total_carb * q; t.f += ing.total_fat * q; t.na += ing.sodium * q; t.g += (x.serving_weight_grams ?? 0) * (x.quantity ?? 1) * (gid ? mult(gid) : 1);
      }
      if (t.kcal < 1 || Math.abs(4 * t.p + 4 * t.c + 9 * t.f - t.kcal) > Math.max(30, 0.25 * t.kcal)) { skipped++; continue; } // e.g. Shwingz: the chain's own data has 499 g fat
      let name = it.name.replace(/^SBC /, '').replace(/\s*-\s*(Regular|Large|Extra Large|Half|Whole|Bag|Bucket|Cup)\b\s*(\(.*\))?$/, (m, s) => ` (${{ Regular: 'Regular', Large: 'L', 'Extra Large': 'XL' }[s] ?? s})`).replace(/\s+/g, ' ').replace(/\s,/g, ',').trim();
      name = name.replace(/\s*-\s*(\d+)(?: [Pp]iece)?$/, ' ($1 pc)');
      if (/\(XL\)|\(Almond, Oat Milk\)|\((?:[2-9]\d|1\d) pc\)|\(Bucket\)|Box$|Party|Platter - 2|Dozen/.test(name) || t.kcal > 1500) continue; // party sizes
      name = name.replace(/ \(Regular\)/, '').replace(/ \((with )?2%,? ?(or )?Skim Milk\)/, '');
      items.push(item({ place: 'sheetz', name, category, kcal: t.kcal, p: t.p, c: t.c, f: t.f, na: t.na, grams: t.g || undefined }));
    }
  }
  console.log(`sheetz: ${skipped} recipes skipped (incomplete default build or inconsistent numbers)`);
  return save('sheetz', { places: [{ id: 'sheetz', name: 'Sheetz', kind: 'fast', orders: { 'À la carte': null } }], items });
}
