// Culver's: macros from the Nutritionix data file its nutrition page loads; photos (and which sauces are on the menu) from culvers.com/menu/<category>.
import { get, item, save } from '../../lib.mjs';
import { nixMacros, nixMenu, norm, unescape } from './_shared/util.mjs';

const PLACE = { id: 'culvers', name: "Culver's", kind: 'fast', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } } };
const PAGES = ['butterburgers', 'chicken', 'sandwiches', 'seafood', 'salads', 'sides', 'drinks', 'fresh-frozen-custard', 'sauces-and-dressings'];
const CATS = { ButterBurgers: 'entree', 'Chicken & Sandwiches': 'entree', 'Seafood & Salads': 'entree', Sides: 'side', Drinks: 'drink', 'Fresh Frozen Custard': 'dessert', 'Lemon Ice': 'dessert' };
// The one size to keep when an item comes in several (burgers keep Single and Double). First match wins.
const RANK = ['Medium', '2 Scoop', '4 Piece', '2 Piece', 'Small', 'Mini', '3 Piece', '6 Piece', '1 Scoop', '1 Piece', 'Large'];
const ABBR = { Medium: 'M', Small: 'S', Large: 'L', Mini: 'Mini' };
const abbr = s => ABBR[s] ?? s.replace(' Piece', ' pc');

export async function scrape() {
  const nix = await nixMenu('culvers');
  const cats = Object.fromEntries(nix.categories.map(c => [c.id, c.name]));
  const byId = Object.fromEntries(nix.items.map(i => [i.id, i]));
  const split = name => { const m = unescape(name).match(/^(.*?),\s*([^,]+)$/); return m ? [m[1], m[2]] : [unescape(name), '']; };
  // menu pages: every product card has an image and a Nutritionix item (or sauce modifier) id
  const image = {}, sauceImage = {};
  for (const slug of PAGES) {
    const html = await get(`https://www.culvers.com/menu/${slug}`);
    const json = JSON.parse(html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)[1]);
    (function walk(o) {
      if (!o || typeof o !== 'object') return;
      if (o.nutritionUrl && o.image) {
        const id = Number(o.nutritionUrl.split('/').pop());
        if (slug === 'sauces-and-dressings') sauceImage[id] = o.image;
        else if (byId[id]) image[norm(split(byId[id].name)[0])] ??= o.image;
      }
      for (const v of Object.values(o)) walk(v);
    })(json.props.pageProps);
  }
  const items = [];
  const groups = {};
  for (const it of nix.items) {
    const cat = CATS[cats[it.categoryId]];
    if (!it.isActive || !cat) continue;
    const [base, size] = split(it.name);
    (groups[base] ??= []).push({ it, base, size, cat });
  }
  for (const g of Object.values(groups)) {
    let keep = g;
    if (g.length > 1) {
      if (g[0].cat === 'entree' && g.some(x => x.size === 'Single')) keep = g.filter(x => ['Single', 'Double'].includes(x.size));
      else { const best = RANK.find(r => g.some(x => x.size === r)); keep = g.filter(x => x.size === best); }
    }
    for (const { it, base, size, cat } of keep) {
      const m = nixMacros(it.nutrition);
      if (m.kcal > 0) items.push(item({ place: 'culvers', name: size ? `${base} (${abbr(size)})` : base, category: cat, ...m, serving: it.servingUnitName && it.servingUnitName !== 'Order' ? `1 ${it.servingUnitName}` : undefined, image: image[norm(base)] }));
    }
  }
  for (const mod of nix.modifiers) {
    if (!sauceImage[mod.id]) continue;
    const m = nixMacros(mod.nutrition);
    if (m.kcal > 0) items.push(item({ place: 'culvers', name: unescape(mod.name), category: 'sauce', ...m, image: sauceImage[mod.id] }));
  }
  return save('culvers', { places: [PLACE], items });
}
