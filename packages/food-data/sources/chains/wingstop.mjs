// Wingstop: macros from the Nutritional Guide PDF its /nutrition page links to (per wing / tender / sandwich, by flavor);
// photos from the ordering menu JSON behind wingstop.com/menu. The PDF's drinks table has no protein column, so drinks are left out.
import { get, item, save } from '../../lib.mjs';
import { pdfRows } from './_shared/pdf.mjs';
import { norm, splitRow } from './_shared/util.mjs';

const PLACE = { id: 'wingstop', name: 'Wingstop', kind: 'fast', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } } };
const PDF = 'https://s3.amazonaws.com/wingstop.com/assets/static/WSR18-0009-Corporate-NutritionalGuide-JumboWings-HR_OFFICAL.pdf';
const MENU = 'https://ecomm.wingstop.com/menu-worker?slug=wingstop-menu-vendor&serviceMode=carryout&loyaltyTier=null';
// PDF section → [item name prefix, serving, image search]
const SECTIONS = { CLASSIC: ['Classic Wings', '1 wing', 'classic wings'], BONELESS: ['Boneless Wings', '1 wing', 'boneless wings'], TENDERS: ['Chicken Tenders', '1 tender', 'crispy tenders'], SANDWICH: ['Chicken Sandwich', '1 sandwich', 'chicken sandwich'] };

export async function scrape() {
  const menu = await get(MENU, { json: true });
  const image = {};
  for (const c of menu.data.categories) for (const { item: i, itemGroup: g } of c.products) if ((i ?? g)?.images?.[0]) image[norm((i ?? g).name)] ??= (i ?? g).images[0].uri;
  const img = name => { const k = norm(name); return image[k] ?? Object.entries(image).find(([a]) => a.includes(k) || k.includes(a))?.[1]; };

  const items = [];
  let section;
  for (const { cells } of await pdfRows(PDF)) {
    const { head, nums } = splitRow(cells);
    if (!nums.length) { // section titles sit in the table's header band, sometimes on the same line as column labels
      const s = head.map(h => Object.keys(SECTIONS).find(k => h.startsWith(k)) ?? (/^(SIDES|BEVERAGES)$/.test(h) ? h : null)).find(Boolean);
      if (s) section = s;
      continue;
    }
    if (nums.length < 15 || head.length !== 2 || section === 'BEVERAGES') continue;
    const [name, serving] = head; // kcal fat sat trans chol sodium carbs fiber sugars added protein ...
    const [kcal, f, , , , na, c, , , , p] = nums;
    const grams = Number(serving.match(/\(([\d.]+)g\)/)?.[1]) || undefined;
    if (!(kcal > 0)) continue;
    if (SECTIONS[section]) {
      const [prefix, serve, pic] = SECTIONS[section];
      items.push(item({ place: 'wingstop', name: `${prefix} - ${name}`, category: 'entree', kcal, p, c, f, na, serving: serve, grams, image: img(pic) }));
    } else {
      const category = /dip|sauce/i.test(name) ? 'sauce' : /brownie/i.test(name) ? 'dessert' : 'side';
      items.push(item({ place: 'wingstop', name: name.replace(/ (Regular|Large)$/, ' ($1)'), category, kcal, p, c, f, na, serving: serving.replace(/\s*\(.*\)/, ''), grams, image: img(name.replace(/ (Regular|Large)$/, '').replace('Blue', 'Bleu')) }));
    }
  }
  return save('wingstop', { places: [PLACE], items });
}
