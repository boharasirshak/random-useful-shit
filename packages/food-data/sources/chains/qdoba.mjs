// Qdoba: the Nutrition Facts PDF (qdoba.com/nutrition → ctfassets) for numbers; the Olo menu JSON that order.qdoba.com
// loads (captured in the browser, Cloudflare) for photos.
import { item, save } from '../../lib.mjs';
import { pdfText, split, clean } from './lib/pdf.mjs';
import { captureJson, norm } from './lib/browse.mjs';

const PDF = 'https://assets.ctfassets.net/0tc4847zqy12/bQFJBCmsAk4ww4qzdfAOm/10ad09aaf097d3e9fb10fc4c62af52c3/Nutrition_9.1.26.pdf';
const ENTREE = /Chicken|Steak|Ground Beef|Carnitas|Brisket|Chorizo \(3|Impossible|Eggs/;
const BASE = /Rice|Beans|Tortilla \(|Taco Shell|Tortilla Shell|Romaine Lettuce for Salad/;
const SAUCE = /Vinaigrette|Dressing|Crema/;

export async function scrape() {
  const text = await pdfText(PDF);
  const items = []; let section = '';
  for (const line of text.split('\n')) {
    const { head, nums } = split(line);
    if (!head.length) continue;
    if (nums.length < 13) { if (/^(Ingredients for|Signature Eats|Small Bites|Limited Time|Fountain Beverages|Bottled Beverages|Dessert|Create Your Own|Menu Board)/.test(head[0])) section = head[0]; continue; }
    let name = clean(head[0]).replace(/\(v\)|\(US\)/g, '').replace(/,\s*\(/, ' (').replace(/\((\.?\d+(\.\d+)?) oz\.?\s?\)/, (m, q) => `(${q.replace(/^\./, '0.').replace(/\.0$/, '')} oz)`).replace(/\s+/g, ' ').trim();
    if (/CANADA|select locations|Select Locations|Kit|\bLrg\b|\(Large\)|Fed Standards|CA Standards/.test(name)) continue;
    const [g, kcal, , f, , , , c, , , p, na] = nums.slice(-13);
    let category;
    if (section.startsWith('Ingredients for Entr')) category = ENTREE.test(name) ? 'entree' : BASE.test(name) ? 'base' : SAUCE.test(name) ? 'sauce' : 'side';
    else if (section.startsWith('Signature')) category = 'entree';
    else if (/Beverages/.test(section)) { category = 'drink'; name = name.replace(/ ?\(Reg\)| Reg$/, ' (Regular)').replace(/\(HFCS\)/, '').replace(/\s+/g, ' ').trim(); }
    else if (section === 'Dessert') { category = 'dessert'; name = name.replace(/ \(US\)/, ''); }
    else continue;
    if (/^Chorizo \(1\.5|^Bacon \(1 oz|Queso Diablo \(4|Three Cheese Queso \(4|Guacamole \(4|^Romaine Lettuce \(0|Flour Tortilla \(5\.5|Crispy Taco Shell|Chopped Cilantro/.test(name)) continue; // half portions / kids sizes
    items.push(item({ place: 'qdoba', name, category, kcal, p, c, f, na, grams: /Beverages/.test(section) ? undefined : g, serving: /Beverages/.test(section) ? `${g} fl oz` : undefined }));
  }
  // photos
  const hits = await captureJson('https://order.qdoba.com/menu', /\/api\/olo\/restaurants\/\d+\/menu/, { ms: 12000 });
  const menu = hits[0]?.body; const img = {};
  for (const c of menu?.categories ?? []) for (const p of c.products ?? []) {
    const f = (p.images ?? []).find(i => i.groupname === 'marketplace-product')?.filename ?? p.imagefilename;
    if (f) img[norm(clean(p.name))] ??= menu.imagepath + f;
  }
  let n = 0;
  const keys = Object.keys(img);
  for (const it of items) {
    const k = norm(it.name.replace(/ \(.*\)$/, '').replace(/^Hand Crafted |^Grilled Adobo |^Three Cheese |^Pork /, '').replace(/ - (Chicken|Steak|Brisket Birria)$/, ''));
    const hit = img[k] ?? img['side of ' + k] ?? img[keys.find(x => x.includes(k) && !x.includes('kit') && !x.includes('party'))];
    if (hit) { it.image = hit; n++; }
  }
  console.log(`qdoba: ${Object.keys(img).length} photos in olo menu, ${n} matched`);
  const extras = ['side', 'sauce'];
  return save('qdoba', { places: [{ id: 'qdoba', name: 'Qdoba', kind: 'fast', orders: { 'À la carte': null, Bowl: { slots: ['base', 'base', 'entree'], extras }, Burrito: { slots: ['base', 'base', 'base', 'entree'], extras } } }], items });
}
