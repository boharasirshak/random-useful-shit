// Wendy's: order.wendys.com's gateway (api.app.prd.wendys.digital/web-client-gateway, plain JSON, no auth).
// getSiteMenu gives the menu for one store with calories/fat/protein/sodium but no carbs; NutritionServices/nutritionalData
// gives the full panel per sales item, so one call per item. Photos are app.wendys.com/unified/assets/menu/pg-cropped.
import { randomUUID } from 'node:crypto';
import { get, item, save, sleep } from '../../lib.mjs';

const API = 'https://api.app.prd.wendys.digital/web-client-gateway';
const COMMON = 'sourceCode=ORDER.WENDYS&version=2.23.1&lang=en&cntry=US';
const HEADERS = { referer: 'https://order.wendys.com/', origin: 'https://order.wendys.com', deviceid: randomUUID(), accept: 'application/json, text/plain, */*' };
const api = (path, ttlDays) => get(`${API}/${path}${path.includes('?') ? '&' : '?'}${COMMON}`, { json: true, headers: HEADERS, ttlDays });

// Sub-menu → category. Anything not here (combos, deals, kids) is skipped.
const SUBMENU = { Hamburgers: 'entree', 'Chicken, Nuggets & More': 'entree', Tenders: 'entree', 'Fresh-Made Salads': 'entree', 'Fries & Sides': 'side', Bakery: 'dessert', 'Frosty®': 'dessert', Beverages: 'drink', Coffee: 'drink', Croissants: 'breakfast', Biscuits: 'breakfast', Classics: 'breakfast', 'Breakfast Burrito': 'breakfast', 'Sides and Sweets': 'side' };
const SIZE = { small: 'S', medium: 'M', large: 'L', 'jr.': 'Jr', jr: 'Jr', junior: 'Jr', regular: 'Reg', value: null, kids: null, "kids'": null };
const SKIP = /party pack|family|\d-pack|bundle|\$/i;
// "10 PC. Chicken Nuggets" → "Chicken Nuggets (10 pc)", "French Toast Sticks, 4 PC" → "French Toast Sticks (4 pc)"
const pcs = s => s.replace(/^(\d+) PC\.? (.+)$/i, '$2 ($1 pc)').replace(/^(.+), (\d+) PC$/i, '$1 ($2 pc)');

export async function scrape() {
  const loc = await api('LocationServices/rest/nearbyLocations?channel=WEB&address=Columbus,+OH&radius=20&limit=5&hasMobileOrder=true', 30);
  const siteNum = loc.data[0].id;
  const { menuLists: m } = await api(`menu/getSiteMenu?siteNum=${siteNum}&freeStyleMenu=true&menuChannel=WEB_GUEST`);
  const menuItems = new Map(m.menuItems.map(x => [x.menuItemId, x]));
  const salesItems = new Map(m.salesItems.map(x => [x.salesItemId, x]));
  const modifiers = new Map(m.modifiers.map(x => [x.modifierId, x]));

  const items = [];
  const seen = new Set();
  for (const sub of m.subMenus) {
    const category = SUBMENU[sub.displayName];
    if (!category) continue;
    for (const id of sub.menuItems) {
      const mi = menuItems.get(id);
      if (!mi) continue;
      const base = pcs(mi.displayName.replace(/[®™]/g, '').trim());
      if (SKIP.test(base)) continue;
      for (const sid of mi.salesItemIds) {
        const si = salesItems.get(sid);
        if (!si?.isAvailable || si.isLTO || !si.productId) continue;
        const sd = (si.shortDescription ?? '').replace(/[®™]/g, '').trim();
        let size = sd && sd.toLowerCase() in SIZE ? SIZE[sd.toLowerCase()] : undefined;
        if (size === null) continue; // value / kids sizes
        if (category === 'drink' && mi.salesItemIds.length > 1 && size !== 'M') continue; // one size of each drink
        if (sub.displayName === 'Frosty®' && size && size !== 'S' && size !== 'M') continue;
        // Burgers list Single/Double/Triple or flavours as the short description.
        const name = size ? `${base} (${size})` : sd && !base.toLowerCase().includes(sd.toLowerCase()) ? pcs(`${base} ${sd}`) : base;
        if (seen.has(name) || SKIP.test(name)) continue;
        seen.add(name);
        const components = (si.defaultOptions ?? []).map(o => ({ id: modifiers.get(o.modifierId)?.componentId ?? String(o.modifierId), quantity: o.defaultQuantity || 1 }));
        const data = encodeURIComponent(JSON.stringify({ siteNum, products: [{ id: si.productId, components }] }));
        const n = (await api(`NutritionServices/rest/nutritionalData?data=${data}`))?.data;
        await sleep(500);
        if (!n || ![n.calories, n.protein, n.carbohydrates, n.totalFat].every(Number.isFinite)) continue;
        if (!n.calories && !/water|diet|zero|unsweet|coffee|tea/i.test(name)) continue; // Freestyle placeholder etc.
        items.push(item({ place: 'wendys', name, category, kcal: n.calories, p: n.protein, c: n.carbohydrates, f: n.totalFat, na: n.sodium, grams: n.weight, image: `https://app.wendys.com/unified/assets/menu/pg-cropped/${si.baseImageName ?? mi.baseImageName}_small_US_en.png` }));
      }
    }
    console.log(`wendys: ${sub.displayName}: ${items.length} so far`);
  }
  const place = { id: 'wendys', name: "Wendy's", kind: 'fast', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } } };
  return save('wendys', { places: [place], items });
}
