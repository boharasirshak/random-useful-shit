// CAVA: the Nutrition & Allergen Guide PDF (linked from cava.com/nutrition) for numbers; the menu page's Next.js data
// (menu.json, captured in the browser because cava.com returns 403 to plain fetches) for photos.
import { item, save } from '../../lib.mjs';
import { pdfText, split, clean } from './lib/pdf.mjs';
import { captureJson, norm } from './lib/browse.mjs';

const CAT = { 'CURATED BOWLS': 'entree', 'CURATED PITAS': 'entree', BASES: 'base', MAINS: 'entree', TOPPINGS: 'side', 'DIPS + SPREADS': 'sauce', DRESSINGS: 'sauce', SIDES: 'side', 'DRINKS*': 'drink' };

export async function scrape() {
  const hits = await captureJson('https://cava.com/nutrition', /\.json/, { ms: 10000 });
  const page = hits.find(h => /\/nutrition\.json/.test(h.url))?.body?.pageProps;
  const pdf = JSON.stringify(page ?? '').match(/https?:\/\/assets\.ctfassets\.net\/[^"\\]+\.pdf/g)?.find(u => !/CPG|GROCERY/i.test(u)) ?? 'https://assets.ctfassets.net/kugm9fp9ib18/Ki4gri5pvT2rtPcjBQPjR/c78bed9be8448e2ab700f440f6faa83e/KT6_26_AN_ANGUIDE_RETAIL_T_MKTAN11724.pdf';
  const text = (await pdfText(pdf)).split(/\n\s*Allergen Guide\s*\n/)[0];
  const items = []; let cat, carry = '';
  for (const line of text.split('\n')) {
    const { head, nums } = split(line);
    if (!head.length) continue;
    if (!nums.length) { if (head[0] in CAT) { cat = CAT[head[0]]; carry = ''; } else if (/^KIDS MEAL$/.test(head[0])) cat = undefined; else if (cat && !/Cal\./.test(head[0])) carry = head[0]; continue; }
    if (!cat || nums.length < 11) continue;
    let name = clean((carry + ' ' + head.join(' ')).trim()); carry = '';
    if (/\(CA\)|Kids|Gallon|CANADA/.test(name)) continue;
    if (cat === 'drink') { if (/Large|Kids/.test(name)) continue; name = name.replace(/ - Small \((\d+) oz\)/, ' ($1 oz)').replace(/ \(Fountain\)/, ''); }
    const [kcal, , f, , , , na, c, , , p] = nums.slice(-11);
    const category = cat === 'side' && /Blondie|Brownie|Cookie|Whisked/.test(name) ? 'dessert' : cat;
    items.push(item({ place: 'cava', name, category, kcal, p, c, f, na }));
  }
  // photos
  const menu = hits.find(h => /\/menu\.json/.test(h.url))?.body?.pageProps?.menu?.productMap ?? [];
  const img = {};
  for (const { product } of menu) {
    const name = product?.display_text?.digital_short_name?.en;
    const res = (product?.image_urls?.contentful_resources ?? []).filter(r => r.url && !/menu-default-image/.test(r.url));
    const u = (res.find(r => r.platform === 'web') ?? res[0])?.url;
    if (name && u) img[norm(name)] ??= (u.startsWith('//') ? 'https:' + u : u);
  }
  let n = 0;
  for (const it of items) { const u = img[norm(it.name)] ?? img[norm(it.name.replace(/ \(\d+ oz\)$/, ''))]; if (u) { it.image = u; n++; } }
  console.log(`cava: ${Object.keys(img).length} photos in menu.json, ${n} matched`);
  return save('cava', { places: [{ id: 'cava', name: 'CAVA', kind: 'fast', orders: { 'À la carte': null, Bowl: { slots: ['base', 'entree'], extras: ['side', 'sauce'] } } }], items });
}
