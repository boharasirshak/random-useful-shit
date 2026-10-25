// Fallback for chains whose own sites block automated browsers (McDonald's, KFC, Dairy Queen, Subway) and the convenience stores that publish no nutrition page of their own (Wawa, 7-Eleven, Costco food court): fastfoodnutrition.org,
// which republishes each chain's published nutrition, one page per item and per size, with schema.org MenuItem JSON
// and a product photo. Not used for a chain we can read from the source.
import { get, inCache, item, num, save, sleep } from '../lib.mjs';

const COMBO = { 'À la carte': null, Meal: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } };
const CHAINS = [
  { id: 'mcd', slug: 'mcdonalds', name: "McDonald's", orders: COMBO },
  { id: 'kfc', slug: 'kfc', name: 'KFC', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'] } } },
  { id: 'dq', slug: 'dairy-queen', name: 'Dairy Queen', orders: COMBO },
  { id: 'subway', slug: 'subway', name: 'Subway', orders: { 'À la carte': null } },
  { id: 'wawa', slug: 'wawa', name: 'Wawa', orders: { 'À la carte': null } },
  { id: '7eleven', slug: '7-eleven', name: '7-Eleven', orders: { 'À la carte': null } },
  { id: 'costco', slug: 'costco', name: 'Costco Food Court', orders: { 'À la carte': null } },
];
const ONLY = process.env.FFN_CHAINS?.split(','); // e.g. FFN_CHAINS=subway node scrape.mjs ffn
const SKIP_HEADING = /happy|kid|hack|discontinued|catering|family|bucket|party|share|box meal|fill up|combo|meal deal|add ons|milk for|^bread$|^cheese$/i;
const SKIP_ITEM = /happy meal|kids|basket|bucket|meal\b|combo|catering|family|packet|sweetener|salt|sugar|cream\b|jam|preserves|margarine/i;
const SKIP_SIZE = /kids|basket|child|senior|mini|jug|half-gallon|extra-small|extra-large/;
const CATEGORY = [
  [/breakfast/i, 'breakfast'], [/beverage|drink|coffee|mccafe|shake|frozen|smoothie|tea|lemonade/i, 'drink'],
  [/dessert|treat|blizzard|cake|cone|sundae|sweet|cookie|pie/i, 'dessert'], [/condiment|sauce|dressing|dip/i, 'sauce'],
  [/side|snack|fries|potato|biscuit|bread/i, 'side'], [/appetizer/i, 'appetizer'],
  [/burger|sandwich|chicken|wrap|salad|entree|entrée|nugget|strip|tender|finger|hot dog|basket|bowl|plate|burrito|taquito|pizza|hoagie|sub\b|lunch|dinner|menu items|soup/i, 'entree'],
];
const clean = s => s.replace(/&reg;|&copy;|&trade;|®|™|©/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|’/g, "'").replace(/\s+/g, ' ').trim()
  .replace(/^(Extra Small|Small|Medium|Large|Extra Large) (.+)$/, (_, s, r) => `${r} (${{ 'Extra Small': 'XS', 'Extra Large': 'XL' }[s] ?? s[0]})`)
  .replace(/^(\d+)[- ]?(piece|pc|ct) (.+)$/i, '$3 ($1 pc)');

function menuItem(html) {
  for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try {
      const d = JSON.parse(m[1]);
      if (d['@type'] === 'MenuItem' && d.nutrition?.calories) return d;
    } catch {}
  }
  return null;
}

export async function scrape() {
  for (const chain of CHAINS.filter(c => !ONLY || ONLY.includes(c.id))) {
    const base = `https://fastfoodnutrition.org/${chain.slug}`;
    const list = await get(base);
    const items = [];
    let category = null;
    const seen = new Set();
    // Headings and item links, in page order; a heading sets the category for the links after it.
    for (const m of list.matchAll(/<h2[^>]*>(.*?)<\/h2>|href="(\/[a-z0-9-]+\/([a-z0-9-]+))"/g)) {
      if (m[1]) {
        const h = m[1].replace(/<[^>]+>/g, '');
        category = SKIP_HEADING.test(h) ? null : CATEGORY.find(([re]) => re.test(h))?.[1] ?? null;
        continue;
      }
      if (!category || !m[2].startsWith(`/${chain.slug}/`) || seen.has(m[2])) continue;
      seen.add(m[2]);
      const url = `https://fastfoodnutrition.org${m[2]}`;
      const fresh = !inCache(url);
      const page = await get(url).catch(() => null);
      if (fresh) await sleep(500);
      if (!page) continue;
      const sizes = [...new Set([...page.matchAll(new RegExp(`href="(${m[2]}/([a-z0-9-]+))"`, 'g'))].map(x => x[1]))].filter(s => !SKIP_SIZE.test(s));
      const pages = sizes.length ? [] : [page];
      for (const s of sizes) {
        const fresh = !inCache(`https://fastfoodnutrition.org${s}`);
        const p = await get(`https://fastfoodnutrition.org${s}`).catch(() => null);
        if (fresh) await sleep(500);
        if (p) pages.push(p);
      }
      for (const p of pages) {
        const d = menuItem(p);
        // Protein isn't in the schema.org block, only in the facts table: <td title="Amount of protein in …">25g</td>
        const protein = p.match(/title="Amount of protein in[^"]*"\s*>\s*([\d.]+)\s*g/)?.[1];
        if (!d || protein == null) continue;
        d.nutrition.proteinContent = protein;
        const name = clean(d.name);
        if (SKIP_ITEM.test(name)) continue;
        const n = d.nutrition;
        items.push(item({
          place: chain.id, name, category, kcal: num(n.calories), p: num(n.proteinContent), c: num(n.carbohydrateContent), f: num(n.fatContent), na: num(n.sodiumContent),
          serving: n.servingSize?.trim() || undefined, grams: /^\d+\s*g/.test(n.servingSize ?? '') ? num(n.servingSize) : undefined,
          image: p.match(/property="og:image" content="([^"]+)"/)?.[1],
        }));
      }
    }
    save(chain.id, { places: [{ id: chain.id, name: chain.name, kind: 'fast', orders: chain.orders }], items });
  }
}
