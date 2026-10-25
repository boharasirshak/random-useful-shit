// Arby's: the ordering menu JSON behind arbys.com/menu has full macros for every product, size variant and sauce.
import { item, save } from '../../lib.mjs';
import { inspireMacros, inspireMenu } from './_shared/util.mjs';

const PLACE = { id: 'arbys', name: "Arby's", kind: 'fast', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } } };
// category slug (minus its hash) → app category. Kids, meals, limited-time and "Meat & 3" boxes are left out.
const CATS = { 'slow-roasted-beef': 'entree', cheesesteaks: 'entree', 'steak-nuggets': 'entree', 'crispy-juicy-chicken': 'entree', 'crafted-sandwiches': 'entree', 'value-menu': 'entree', 'sides-snacks': 'side', desserts: 'dessert', beverages: 'drink' };
const SIZE = { small: 'S', medium: 'M', large: 'L', xl: 'XL' };
const sized = /^(Small|Medium|Large|XL|\d+-Pc) (.+)$/i;

export async function scrape() {
  const menu = await inspireMenu('api.arbys.com');
  const products = Object.entries(menu.products).map(([id, p]) => ({ id, ...p }));
  const has = p => Number.isFinite(inspireMacros(p).p);
  const items = [];
  const add = (p, category, name = p.displayName) => {
    const m = inspireMacros(p);
    const s = name.match(sized);
    if (s) name = `${s[2]} (${SIZE[s[1].toLowerCase()] ?? s[1].replace('-Pc', ' pc')})`;
    name = name.replace(/ (\d+)PC$/i, ' ($1 pc)');
    if (m.kcal > 0) items.push(item({ place: 'arbys', name, category, ...m, image: p.imageUrl }));
  };
  for (const [catId, cat] of Object.entries(menu.categories)) {
    const category = CATS[catId.replace(/-[0-9a-f]{8}$/, '')];
    if (!category) continue;
    for (const ref of Object.keys(cat.childRefs ?? {})) {
      const p = menu.products[ref.replace('products.', '')];
      if (!p || (catId.startsWith('value-menu') && !/slider/i.test(p.displayName))) continue;
      if (has(p)) { add(p, category); continue; }
      // A parent like "Curly Fries" or "Jamocha Shake": its sizes are separate products. Medium if there is one, else every size.
      const variants = products.filter(v => has(v) && v.imageUrl && sized.test(v.displayName) && v.displayName.match(sized)[2] === p.displayName);
      const keep = variants.filter(v => /^Medium /.test(v.displayName));
      for (const v of keep.length ? keep : variants) add(v, category, v.displayName);
    }
  }
  // Fountain drinks only exist inside the combos' "Drink" groups; sauces inside the add-on groups.
  for (const g of Object.values(menu.productGroups)) {
    const sauce = /sauce|condiment|dipping/i.test(g.displayName), drink = g.displayName === 'Drink';
    if (!sauce && !drink) continue;
    for (const ref of Object.keys(g.childRefs ?? {})) {
      const p = menu.products[ref.replace('products.', '')];
      if (!p || !has(p) || /^no /i.test(p.displayName)) continue;
      if (sauce) add(p, 'sauce', p.displayName.replace(/ Packet$/, ''));
      else if (/^Medium /.test(p.displayName)) add(p, 'drink');
    }
  }
  return save('arbys', { places: [PLACE], items });
}
