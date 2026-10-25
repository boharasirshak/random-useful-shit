// Jimmy John's: whole-sub macros from the Nutritionix data file its nutrition page links to; photos from the ordering API (needs a real browser).
import { browser, item, save } from '../../lib.mjs';
import { nixMacros, nixMenu, norm, unescape } from './_shared/util.mjs';

const PLACE = { id: 'jimmyjohns', name: "Jimmy John's", kind: 'fast', orders: { 'À la carte': null } };
const CATS = { Originals: 'entree', Favorites: 'entree', 'Plain Slims': 'entree', Gargantuan: 'entree', 'Toasted Sandwiches': 'entree', Wraps: 'entree', 'Sides & Sauces': 'side', Dessert: 'dessert' };

export async function scrape() {
  const nix = await nixMenu('jimmy-johns');
  const cats = Object.fromEntries(nix.categories.map(c => [c.id, c.name]));
  // photos: the menu page fetches /api/products?storeId=… for its default store
  const { page, close } = await browser();
  const products = page.waitForResponse(r => r.url().includes('/api/products?'), { timeout: 60000 }).then(r => r.json());
  await page.goto('https://www.jimmyjohns.com/menu', { waitUntil: 'domcontentloaded', timeout: 60000 });
  // "Slim 1" vs "Slim 1 - Ham & Provolone", "Regular Jimmy Chips®" vs "Regular Chips": match on a loose key, exact first then by prefix.
  const key = s => norm(s.replace(/\(.*?\)|jimmy|,.*$/gi, ''));
  const image = {};
  for (const p of (await products).products) image[key(p.name)] ??= p.images.find(i => i.groupName === 'desktop-menu')?.url;
  await close();
  const find = name => { const k = key(name); return image[k] ?? Object.entries(image).filter(([a]) => a.startsWith(k) || k.startsWith(a)).sort((a, b) => a[0].length - b[0].length)[0]?.[1]; };
  const items = [];
  for (const it of nix.items) {
    const cat = CATS[cats[it.categoryId]];
    if (!it.isActive || !cat) continue;
    let name = unescape(it.name), size;
    const s = name.match(/\s*\((8"|16")\)$/);
    if (s) { size = s[1]; name = name.slice(0, s.index); }
    else if (/\(Little John/.test(name)) continue;
    const m = nixMacros(it.nutrition);
    if (!(m.kcal > 0)) continue;
    const category = cat === 'side' ? (/ranch|spread/i.test(name) ? 'sauce' : 'side') : cat;
    items.push(item({ place: 'jimmyjohns', name: size ? `${name} (${size})` : name.replace(/, (Small|Large)$/, ' ($1)'), category, ...m, serving: it.servingUnitName ? `1 ${it.servingUnitName}` : undefined, image: find(name) }));
  }
  return save('jimmyjohns', { places: [PLACE], items });
}
