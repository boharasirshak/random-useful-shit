// Nutrition PDFs → text. pypdf does the extraction (`pip3 install --user pypdf`); the PDF and its text are cached in cache/pdf/.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, UA } from '../../../lib.mjs';

const PY = {
  // Layout mode keeps table columns aligned, so a row splits on runs of spaces.
  layout: "import sys,pypdf\nr=pypdf.PdfReader(sys.argv[1])\nprint('\\n'.join(p.extract_text(extraction_mode='layout') for p in r.pages))",
  // Raw text chunks with their position, for PDFs whose layout mode comes out empty (posters with rotated text).
  chunks: "import sys,json,pypdf\nr=pypdf.PdfReader(sys.argv[1])\nout=[]\nfor i,p in enumerate(r.pages):\n  def v(t,cm,tm,fd,fs):\n    t=t.strip()\n    if t: out.append([i,round(tm[5],1),round(tm[4],1),t])\n  p.extract_text(visitor_text=v)\nprint(json.dumps(out))",
};

export async function pdfText(url, mode = 'layout') {
  const dir = join(ROOT, 'cache', 'pdf');
  const key = join(dir, createHash('sha1').update(url).digest('hex'));
  mkdirSync(dir, { recursive: true });
  if (existsSync(`${key}.${mode}.txt`)) return readFileSync(`${key}.${mode}.txt`, 'utf8');
  if (!existsSync(`${key}.pdf`)) {
    const r = await fetch(url, { headers: { 'user-agent': UA } });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    writeFileSync(`${key}.pdf`, Buffer.from(await r.arrayBuffer()));
  }
  const text = execFileSync('python3', ['-c', PY[mode], `${key}.pdf`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64e6, stdio: ['ignore', 'pipe', 'ignore'] });
  writeFileSync(`${key}.${mode}.txt`, text);
  return text;
}

// One layout-mode line → cells (split on 3+ spaces).
export const cells = line => line.trim().split(/ {3,}/).map(s => s.trim()).filter(Boolean);
// "<1", "< 1", "-", "--" count as 0; "1,250" is a number; ranges ("610-640") are not.
export const isNum = s => /^(<\s?1|--?|\d[\d,]*(\.\d+)?)$/.test(s);
export const num = s => (/^[<-]/.test(s) ? 0 : Number(s.replace(/,/g, '')));
// Trailing run of numeric cells, and whatever precedes it.
export function split(line) {
  const c = cells(line);
  let i = c.length;
  while (i > 0 && isNum(c[i - 1])) i--;
  return { head: c.slice(0, i), nums: c.slice(i).map(num) };
}
// Calories should roughly match 4p + 4c + 9f; a misread row (shifted column) usually fails this.
export const plausible = (kcal, p, c, f) => Math.abs(4 * p + 4 * c + 9 * f - kcal) <= Math.max(30, 0.25 * kcal);
export const clean = s => s.replace(/[’‘]/g, "'").replace(/[®™*†^#]/g, '').replace(/\s+/g, ' ').replace(/\s,/g, ',').trim();
