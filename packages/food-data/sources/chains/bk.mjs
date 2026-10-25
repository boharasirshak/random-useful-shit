// Burger King (and Popeyes, which imports rbi() below): RBI sites keep the menu in a public Sanity dataset.
// One GROQ query walks the default menu: sections → items / pickers (size variants) → items or single-slot combos
// (Popeyes sells "3Pc Tenders" as a combo whose mainItem carries the nutrition). nutritionWithModifiers is the item
// as sold (`nutrition` alone is the bare base). Some menu items only carry calories; a second query over every
// item document with full macros fills those in by name.
import { get, item, save } from '../../lib.mjs';

const ITEM = `_type, "name": name.en, nutritionWithModifiers, nutrition, "img": image.asset._ref`;
// Menu → sections (plain references) → items / pickers / combos; a picker's options wrap the reference in { option }.
const COMBO = `"main": mainItem->{ ${ITEM} }, "slot": options[0]->{ "name": name.en, "opts": options[]{ "x": option->{ ${ITEM} } } }`;
const MENU = `*[_id=="feature-menu-singleton"][0].defaultMenu->options[]->{ "section": name.en,
  "opts": options[]->{ ${ITEM}, ${COMBO},
    "opts": options[]{ "x": option->{ ${ITEM}, ${COMBO} } } } }`;
const FULL = `*[_type=="item" && defined(nutritionWithModifiers.proteins)]{ ${ITEM} }`;

// Sanity image ref "image-<hash>-<w>x<h>-<ext>" → CDN URL.
const imageUrl = (project, dataset, ref) => { const m = ref?.match(/^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/); return m && `https://cdn.sanity.io/images/${project}/${dataset}/${m[1]}-${m[2]}.${m[3]}`; };

const SIZES = { small: 'S', sm: 'S', medium: 'M', med: 'M', large: 'L', lg: 'L', regular: 'Reg', reg: 'Reg', 'jr.': 'Jr', jr: 'Jr' };
const SIZE_RE = /^(value|small|sm|medium|med|large|lg|regular|reg|jr\.?|kids?|extra large|xl)\b\.? ?(.+)$|^(.+?) - (small|sm|medium|med|large|lg|regular|reg)$/i;

// "Small French Fries" → "French Fries (S)", "8 Pc. Mozzarella Fries" → "Mozzarella Fries (8 pc)". null = a size or pack we do not keep.
export function tidyName(raw, isDrink) {
  let name = raw.replace(/[®™]/g, '').replace(/\s+/g, ' ').trim();
  if (/^FS |^(\d+|half gallon|gallon)\b.*(biscuits|pies?|cups?|tea|peppers?)$|^\d+ jalape/i.test(name)) return null; // Freestyle duplicates, multi-packs
  let size;
  const m = name.match(SIZE_RE);
  if (m) {
    const s = (m[1] ?? m[4]).toLowerCase();
    name = m[2] ?? m[3];
    size = SIZES[s] ?? null;
    if (size === null || (isDrink && size !== 'M')) return null;
  }
  name = name.replace(/^(\d+) ?Pc\.? (.+?)\s*$/i, '$2 ($1 pc)').replace(/^(.+?) - (\d+) ?Pc\.?$/i, '$1 ($2 pc)').replace(/^(\d+)oz Bottle (.+)$/i, '$2 ($1 oz bottle)');
  return size ? `${name} (${size})` : name;
}

export async function rbi({ place, name, project, dataset, sections, orders }) {
  const q = query => get(`https://${project}.apicdn.sanity.io/v2026-04-24/data/query/${dataset}?query=${encodeURIComponent(query)}`, { json: true }).then(r => r.result);
  const [menu, full] = await Promise.all([q(MENU), q(FULL)]);
  // Same name twice (e.g. "Classic Chicken Sandwich" and an all-caps POS copy): exact spelling wins, then first seen.
  const byName = new Map();
  for (const x of full) { byName.set(x.name.trim(), byName.get(x.name.trim()) ?? x); const k = x.name.trim().toLowerCase(); if (!byName.has(k)) byName.set(k, x); }
  const macros = x => {
    const n = x.nutritionWithModifiers?.proteins != null ? x.nutritionWithModifiers : x.nutrition?.proteins != null ? x.nutrition : (byName.get(x.name.trim()) ?? byName.get(x.name.trim().toLowerCase()))?.nutritionWithModifiers;
    return n && [n.calories, n.proteins, n.carbohydrates, n.fat].every(Number.isFinite) ? n : null;
  };

  const items = [];
  const seen = new Set();
  const add = (x, category) => {
    if (!x?.name) return;
    if (x._type === 'combo') { // Popeyes sells "3Pc Tenders" as a combo: its mainItem is the food; "2Pc Signature Chicken" has the pieces in its first slot
      if (x.main) return add({ ...x.main, img: x.main.img ?? x.img }, category);
      for (const o of x.slot?.opts ?? []) add(o.x, category);
      return;
    }
    if (x._type !== 'item') return;
    const nm = tidyName(x.name, category === 'drink');
    if (!nm || seen.has(nm) || /meal|combo|bundle|family|party|box\b/i.test(nm)) return;
    const n = macros(x);
    if (!n || (!n.calories && !/water|diet|zero|unsweet/i.test(nm))) return; // no macros, or a 0-kcal placeholder
    seen.add(nm);
    const cat = category === 'side' && /pie|cake|cookie|beignet|sundae|brownie|cinnamon|cupcake/i.test(nm) ? 'dessert' : category;
    items.push(item({ place, name: nm, category: cat, kcal: n.calories, p: n.proteins, c: n.carbohydrates, f: n.fat, na: n.sodium, grams: n.weight, image: imageUrl(project, dataset, x.img) }));
  };
  // Sections in the order given: the first section an item appears in decides its category (BK lists burgers under breakfast too).
  for (const [section, category] of Object.entries(sections)) {
    for (const sec of menu.filter(s => s.section?.trim() === section)) {
      for (const x of sec.opts ?? []) {
        if (x?._type === 'combo' && /combo|meal|box|bundle|family/i.test(x.name ?? '')) continue;
        add(x, category);
        for (const o of x?.opts ?? []) if (!/combo|meal|box|bundle|family/i.test(o.x?.name ?? '')) add(o.x, category);
      }
    }
  }
  return save(place, { places: [{ id: place, name, kind: 'fast', orders }], items });
}

export const scrape = () => rbi({
  place: 'bk', name: 'Burger King', project: 'kjfd81ul', dataset: 'prod_bk_us',
  sections: { 'Flame Grilled Burgers': 'entree', 'Chicken & Fish': 'entree', Sides: 'side', 'Drinks & Coffee': 'drink', Sweets: 'dessert', 'Breakfast Sandwiches': 'breakfast', Burritos: 'breakfast', 'Breakfast Sides': 'side', Condiments: 'sauce' },
  orders: { 'À la carte': null, Meal: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } },
});
