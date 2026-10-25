// Bits shared by several chain scrapers. Not a source: scrape.mjs only loads sources/chains/*.mjs, not this folder.
import { get } from '../../../lib.mjs';

// "SuperSONIC® Double Cheeseburger" → "supersonicdoublecheeseburger", for matching names across a chain's PDF, API and menu page.
export const norm = s => String(s).toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9]/g, '');
const SMALL = new Set(['a', 'an', 'and', 'the', 'with', 'of', 'in', 'on', '&', 'n']);
export const titleCase = s => String(s).toLowerCase().split(/\s+/).map((w, i) => (i && SMALL.has(w) ? w : w.replace(/[a-z]/, ch => ch.toUpperCase()))).join(' ');
const ENT = { reg: '®', trade: '™', amp: '&', rsquo: "'", lsquo: "'", nbsp: ' ', ntilde: 'ñ', eacute: 'é', '#39': "'" };
export const unescape = s => String(s).replace(/&(#?\w+);?/g, (m, e) => ENT[e] ?? m).replace(/\s+/g, ' ').trim();

// Inspire Brands ordering menu (Arby's, Sonic, Dunkin): one JSON with every product, category and modifier. Needs the channel header.
export const inspireMenu = host => get(`https://${host}/menu/0`, { json: true, headers: { 'x-channel': 'WEBOA' } });
export function inspireMacros(p) {
  const m = p.nutrition?.macroNutrients ?? {};
  const v = k => m[k]?.weight?.value;
  return { kcal: v('calories'), p: v('protein'), c: v('totalCarbohydrate'), f: v('fatTotal'), na: v('sodium'), grams: v('servingWeight') };
}

// Nutritionix "Interactive Nutrition Menu" data file that the chain's own nutrition page loads (Culver's, Jimmy John's). Gzip is transparent to fetch.
export const nixMenu = brand => get(`https://nix-vue-inm.s3.amazonaws.com/restaurant/${brand}/data/menu-latest.json.gz`, { json: true });
export function nixMacros(n) {
  const v = k => n[`calculated${k[0].toUpperCase()}${k.slice(1)}`] || n[k];
  return { kcal: v('calories'), p: v('protein'), c: v('totalCarb'), f: v('totalFat'), na: v('sodium'), grams: v('servingWeight') };
}

// The trailing run of numeric cells in a PDF table row, and the cells before it. "< 1 g" counts as numeric.
export function splitRow(cells) {
  let i = cells.length;
  while (i > 0 && /^[<>]?\s*-?\d+(\.\d+)?\s*(g|mg|mcg)?$/.test(cells[i - 1])) i--;
  return { head: cells.slice(0, i), nums: cells.slice(i).map(c => Number(c.replace(/[^0-9.-]/g, ''))) };
}
