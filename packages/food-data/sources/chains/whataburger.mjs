// Whataburger: the nutrition PDF linked in whataburger.com's footer (wbimageserver.whataburger.com/Nutrition.pdf) for
// numbers. It is laid out in two columns, so a line can hold two items; a cell's character offset says which column.
// Photos come from the ordering site's menu API, captured by clicking through the categories in the browser.
import { item, save } from '../../lib.mjs';
import { pdfText, isNum, num, clean, plausible } from './lib/pdf.mjs';
import { captureJson, norm } from './lib/browse.mjs';

const PDF = 'https://wbimageserver.whataburger.com/Nutrition.pdf';
const IMG = 'https://wbimageserver.whataburger.com/food/';
const CAT = { BURGERS: 'entree', CHICKEN: 'entree', 'ALL-TIME FAVORITES & SEASONAL SANDWICHES': 'entree', 'JUNIOR ALL-TIME FAVORITES & SEASONAL SANDWICHES': 'entree', SALADS: 'entree', SIDES: 'side', 'ADD-ONS': 'side', 'ADD-ONS (CONTINUED)': 'side', CONDIMENTS: 'sauce', 'DIPPING SAUCES & DRESSINGS': 'sauce', BREAKFAST: 'breakfast', 'BREAKFAST A LA CARTE': 'breakfast', 'ORANGE JUICE & MILK': 'drink', 'COFFEE & TEA': 'drink', 'SOFT DRINKS': 'drink', 'SOFT DRINKS (CONTINUED)': 'drink', DESSERTS: 'dessert', 'SHAKES & MALTS': 'dessert', 'FOR THE KIDS': null };

export async function scrape() {
  const text = await pdfText(PDF);
  const lines = text.split('\n');
  // the right column starts where the second header of the first two-header line starts
  const cellsAt = line => { const out = []; let i = 0; for (const part of line.split(/( {3,})/)) { if (part.trim()) out.push([i, part.trim()]); i += part.length; } return out; };
  const two = lines.map(l => cellsAt(l).filter(([, c]) => c in CAT)).find(m => m.length === 2);
  const boundary = two ? two[1][0] - 12 : 150;
  const items = []; const section = ['', ''];
  for (const line of lines) {
    const cols = [[], []];
    for (const [i, c] of cellsAt(line)) cols[i >= boundary ? 1 : 0].push(c);
    cols.forEach((cells, col) => {
      let name = [], nums = [];
      for (const cell of cells) {
        if (isNum(cell) || /^\d+-\d+$/.test(cell)) { nums.push(isNum(cell) ? num(cell) : 0); continue; }
        if (cell in CAT) { section[col] = cell; continue; }
        if (nums.length) break; // a second item in the same column cell list: never happens, but don't merge
        name.push(cell);
      }
      if (!name.length || nums.length < 11) return;
      const cat = CAT[section[col]];
      const n = clean(name.join(' ')).replace(/^#?\d+\s+/, '').replace(/\s*\([^)]*fl oz\)/, '').replace(/\s*\(single\)/, '');
      const [kcal, , f, , , , na, c, , , p] = nums;
      if (!cat || /^(Kid|Note:|Jalapeños \(whole)|per slice|per portion cup|Decaf|Diet |Zero|Light Lemonade|Caffeine Free/.test(n) || !plausible(kcal, p, c, f)) return;
      let label = n;
      const m = n.match(/^(Small|Medium|Large) (.*)$/);
      if (m) { if (m[1] !== 'Medium') return; label = `${m[2]} (M)`; }
      items.push(item({ place: 'whataburger', name: label, category: cat, kcal, p, c, f, na }));
    });
  }
  // photos: click each category on the menu page and keep the recipe lists the SPA loads
  const hits = await captureJson('https://whataburger.com/locations/550/menu', /api\.whataburger\.com\/.*\/recipes/, { ms: 1000, act: async page => {
    await page.waitForTimeout(8000);
    const cats = await page.$$eval('a[href*="/menu/categories/"]', as => as.map(a => a.getAttribute('href')));
    for (const href of cats) {
      if (/kids|Group|TestCategory/i.test(href)) continue;
      await page.click(`a[href="${href}"]`).catch(() => {}); await page.waitForTimeout(3500);
      await page.goBack().catch(() => {}); await page.waitForTimeout(2500);
    }
  } });
  const img = {};
  for (const h of hits) for (const g of h.body ?? []) for (const r of g.recipes ?? []) if (r.imageUrl) img[norm(clean(r.name))] ??= IMG + r.imageUrl;
  let n = 0;
  for (const it of items) { const k = norm(it.name.replace(/ \(M\)$/, '')); const u = img[k] ?? img[k + ' sandwich'] ?? img[k.replace(/ with .*/, '')]; if (u) { it.image = u; n++; } }
  console.log(`whataburger: ${Object.keys(img).length} photos from menu api, ${n} matched`);
  return save('whataburger', { places: [{ id: 'whataburger', name: 'Whataburger', kind: 'fast', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'] } } }], items });
}
