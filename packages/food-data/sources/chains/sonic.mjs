// Sonic: macros from the Nutritional Information brochure PDF its /nutrition-allergen page links to (the ordering API only has
// calories); photos and proper-case names from that ordering API. One size per drink/side/shake: Medium (20 oz).
import { item, save } from '../../lib.mjs';
import { pdfRows } from './_shared/pdf.mjs';
import { inspireMenu, norm, splitRow, titleCase } from './_shared/util.mjs';

const PLACE = { id: 'sonic', name: 'Sonic', kind: 'fast', orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } } };
const PDF = 'https://assets.ctfassets.net/whnlxz6bna9d/665Hn9SdgyT53pJgF9cmkK/090ae5fe05d8cd9643fb98fcde32ef1a/61667-1_FEE_0926_NUTBRO_SEPTEMBER_FA_rg_WCAG.pdf';
// PDF section (spaces removed) → app category. Limited time, kids, toppings, add-ins and water are left out.
const SECTIONS = { BURGERS: 'entree', TOASTERSANDWICHES: 'entree', CHICKEN: 'entree', SANDWICHES: 'entree', HOTDOGS: 'entree', BREAKFAST: 'breakfast', COFFEE: 'drink', 'SNACKS&SIDES': 'side', SONICBLAST: 'dessert', 'HAND-MIXEDCLASSICSHAKES': 'dessert', 'HAND-MIXEDMASTERSHAKES': 'dessert', SUNDAES: 'dessert', FLOATS: 'dessert', 'ALL-NATURALLEMONADE': 'drink', SOFTDRINKS: 'drink', SLUSHES: 'drink', REFRESHERS: 'drink', ICEDTEAS: 'drink', JUICES: 'drink', SIGNATURELIMEADES: 'drink', SPECIALTYSODAS: 'drink', 'CONDIMENTS&DIPPINGSAUCES': 'sauce' };
const SIZE = /[,\s]+(MINI|SMALL|MEDIUM|LARGE|RT ?44|\d+ OZ)$/;

export async function scrape() {
  const menu = await inspireMenu('api-idp.sonicdrivein.com');
  const api = {}; // norm(name without size) → { name, image }
  for (const p of Object.values(menu.products)) {
    if (!p.imageUrl || p.isVirtual) continue;
    const name = p.displayName.replace(/^(Med|Lg|Sm|Mini|Rt 44) /i, '').replace(/ (Combo|Wacky Pack®?)$/i, '');
    api[norm(name)] ??= { name, image: p.imageUrl };
    api[norm(name.replace(/ (Classic|Master) Shake/, ' Shake'))] ??= { name, image: p.imageUrl }; // the PDF says "Banana Shake", the menu "Banana Classic Shake"
  }
  const items = [];
  let category;
  for (const { cells } of await pdfRows(PDF)) {
    const clean = cells.map(c => c.replace(/[∆®™]/g, '').trim()).filter(Boolean);
    const { head, nums } = splitRow(clean);
    const title = head.join(' ').replace(/Super SONIC/g, 'SuperSONIC').replace(/B R EA K FAST/g, 'BREAKFAST').replace(/TOASTE R/g, 'TOASTER').replace(/\s+/g, ' ').trim();
    if (/WACKY PACK/.test(title)) continue; // kids size
    if (!nums.length && head.length && /^[A-Z0-9 &!'-]+$/.test(title) && title.length < 32) { category = SECTIONS[title.replace(/ /g, '')]; if (title in { 'LIMITED TIME ONLY': 1, 'MAKE IT YOURS': 1, 'WACKY PACK! KIDS MEALS': 1, 'DRINK ADD-INS & TOPPINGS': 1, WATER: 1 }) category = undefined; continue; }
    if (!category || nums.length !== 10 || !title) continue;
    const [kcal, f, , , , na, c, , , p] = nums;
    const s = title.match(SIZE);
    let base = s ? title.slice(0, s.index) : title, size;
    if (s) { if (!/^(MEDIUM|20 OZ)$/.test(s[1])) continue; size = 'M'; }
    base = base.replace(/,$/, '').trim();
    const hit = api[norm(base)] ?? api[norm(base.replace(/ WITH .*$| \(.*\)$/, ''))];
    const name = hit && norm(hit.name) === norm(base) ? hit.name : titleCase(base).replace(/\bSonic\b/g, 'SONIC').replace(/\bBlt\b/, 'BLT').replace(/\bOreo\b/g, 'OREO');
    if (kcal > 0) items.push(item({ place: 'sonic', name: size ? `${name} (${size})` : name, category, kcal, p, c, f, na, image: hit?.image }));
  }
  return save('sonic', { places: [PLACE], items });
}
