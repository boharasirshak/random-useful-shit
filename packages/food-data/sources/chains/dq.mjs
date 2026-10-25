// Dairy Queen US: the menu page's __NEXT_DATA__ lists every item; each product page's __NEXT_DATA__ carries
// sizes[].nutritionDetail[] with full macros. Cloudflare challenges headless Chromium now and then, so blocked pages
// are skipped and the run gives up after 3 in a row. Sized items keep Small + Medium.
import { browser, item, save, sleep } from '../../lib.mjs';

const SITE = 'https://www.dairyqueen.com';
const CATS = { 'burgers-and-sandwiches': 'entree', 'chicken-baskets': 'entree', 'snacks-sides-and-salads': 'side', 'blizzard-treats': 'dessert', 'classic-treats': 'dessert', 'blended-beverages': 'drink', 'icy-cold-beverages': 'drink', 'orange-julius': 'drink' };
const SIZES = ['Small', 'Medium'];

// Every object in the Next.js page data that has the given key.
const findAll = (o, key, out = []) => {
  if (Array.isArray(o)) o.forEach(v => findAll(v, key, out));
  else if (o && typeof o === 'object') { if (key in o) out.push(o); Object.values(o).forEach(v => findAll(v, key, out)); }
  return out;
};
const clean = s => s.replace(/[®™]/g, '').replace(/\s+/g, ' ').trim();

export async function scrape() {
  const { page, close } = await browser();
  const data = async url => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);
    if (/just a moment|attention required|404/i.test(await page.title())) return null;
    return JSON.parse(await page.evaluate(() => document.getElementById('__NEXT_DATA__')?.textContent ?? 'null'))?.props?.pageProps;
  };
  try {
    const menu = findAll(await data(`${SITE}/en-us/menu/`), 'menuItems')[0]?.menuItems ?? [];
    const items = []; let blocked = 0, streak = 0;
    for (const m of menu) {
      const category = CATS[m.menuCategory?.[0]?.urlTitle];
      if (!category || m.availability === 'false') continue;
      const d = await data(`${SITE}/en-us/menu/${m.urlTitle}/`);
      if (!d) { blocked++; if (++streak >= 3) throw new Error(`${blocked} pages blocked by Cloudflare, giving up`); continue; }
      streak = 0;
      const sized = findAll(d, 'nutritionDetail').filter(s => s.nutritionDetail?.[0]?.caloriesKcal != null);
      const picks = sized.length > 1 ? sized.filter(s => SIZES.includes(s.size)) : sized;
      const image = m.image?.fileAsset?.versionPath ? `https://dairyqueen-prod.dotcdn.io${encodeURI(m.image.fileAsset.versionPath)}` : undefined;
      for (const s of picks) {
        const n = s.nutritionDetail[0];
        if ([n.totalFatG, n.carbohydratesG, n.proteinG].some(v => v == null)) continue;
        items.push(item({ place: 'dq', category, name: sized.length > 1 ? `${clean(m.title)} (${s.size})` : clean(m.title), kcal: n.caloriesKcal, p: n.proteinG, c: n.carbohydratesG, f: n.totalFatG, na: n.sodiumMg, image }));
      }
      await sleep(1500);
    }
    if (blocked) console.log(`dq: ${blocked} product pages blocked`);
    return save('dq', { places: [{ id: 'dq', name: 'Dairy Queen', kind: 'fast', orders: { 'À la carte': null, Meal: { slots: ['entree', 'side', 'drink'] } } }], items });
  } finally {
    await close();
  }
}
