// Raising Cane's: macros from the Allergen & Nutritional Information PDF its /allergens page embeds; photos from the menu page's
// Gatsby page-data (raisingcanes.com blocks plain fetches, so that one goes through the browser).
import { browser, item, save } from '../../lib.mjs';
import { pdfRows } from './_shared/pdf.mjs';
import { norm, splitRow } from './_shared/util.mjs';

const PLACE = { id: 'canes', name: "Raising Cane's", kind: 'fast', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } } };
const PDF = 'https://raisingcanes.cdn.prismic.io/raisingcanes/IxTKraMRo_HyNWx2_Allergen%26NutritionalInformation_ALL_DIGITAL_8.26.pdf';
const CAT = name => (/sauce/i.test(name) ? 'sauce' : /fries|toast|coleslaw/i.test(name) ? 'side' : 'entree');

export async function scrape() {
  const { page, close } = await browser();
  await page.goto('https://www.raisingcanes.com/menu/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const menu = await page.evaluate(() => fetch('/page-data/menu/page-data.json').then(r => r.json()));
  await close();
  const image = {};
  (function walk(o) {
    if (!o || typeof o !== 'object') return;
    if (o.name && o.image?.gatsbyImageData?.images?.fallback?.src) image[norm(o.name.replace(/^The /, ''))] ??= o.image.gatsbyImageData.images.fallback.src.split('?')[0];
    for (const v of Object.values(o)) walk(v);
  })(menu);
  const img = name => { const k = norm(name); return image[k] ?? Object.entries(image).find(([a]) => k.includes(a))?.[1]; };

  const items = [];
  let section = '';
  for (const { cells } of await pdfRows(PDF)) {
    if (/^[A-Z*-]{1,8}$/.test(cells.at(-1)) && cells.length > 2) cells.pop(); // the allergen-code column
    const { head, nums } = splitRow(cells);
    if (!nums.length) { if (/^[A-Z &]+$/.test(head[0] ?? '')) section = head[0]; continue; }
    if (nums.length < 10 || head.length < 2) continue;
    const [name, serving] = head; // kcal fat sat trans chol sodium carbs fiber sugar protein
    const [kcal, f, , , , na, c, , , p] = nums;
    let keep = name, category = CAT(name);
    if (/COMBINATION/.test(section)) { if (/kid|posty/i.test(name)) continue; }
    else if (/DRINKS/.test(section)) {
      const m = name.match(/^(.*?)\s*-\s*(Regular|Large)$/);
      if (/Half Sweet\/Half Unsweet/.test(name)) continue;
      if (!m || (m[2] === 'Large' && !/tea|lemonade/i.test(m[1]))) continue;
      keep = `${m[1]} (${m[2]})`; category = 'drink';
    } else if (!/INDIVIDUAL/.test(section)) continue;
    if (!(kcal > 0)) continue;
    items.push(item({ place: 'canes', name: keep, category, kcal, p, c, f, na, serving, grams: Number(serving.match(/\((\d+) g\)/)?.[1]) || undefined, image: img(name.replace(/\s*-\s*(Regular|Large)$/, '')) }));
  }
  return save('canes', { places: [PLACE], items });
}
