// Text rows out of a nutrition PDF, via pdf.js inside the headless Chromium we already have (no pdftotext on a stock Mac).
// Each row is one visual line of the PDF: { y, cells } with the text cells left to right (y grows upwards, so rows come top-down);
// the PDF and pdf.js are cached so re-runs are offline.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, UA, browser, get } from '../../../lib.mjs';

const CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/';

export async function pdfRows(url) {
  const dir = join(ROOT, 'cache', 'pdf');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, createHash('sha1').update(url).digest('hex') + '.pdf');
  if (!existsSync(file)) {
    const r = await fetch(url, { headers: { 'user-agent': UA } });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  }
  const lib = await get(CDN + 'pdf.min.mjs', { ttlDays: 365 });
  const worker = await get(CDN + 'pdf.worker.min.mjs', { ttlDays: 365 });
  const { page, close } = await browser();
  // Serve the page and pdf.js from one fake origin so the worker is same-origin and nothing hits the network.
  await page.route('https://pdf.local/**', r => {
    const u = r.request().url();
    const body = u.endsWith('pdf.min.mjs') ? lib : u.endsWith('pdf.worker.min.mjs') ? worker : '<!doctype html><html><body></body></html>';
    r.fulfill({ body, contentType: u.endsWith('.mjs') ? 'text/javascript' : 'text/html' });
  });
  await page.goto('https://pdf.local/');
  try {
    return await page.evaluate(async b64 => {
      const pdfjs = await import('https://pdf.local/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://pdf.local/pdf.worker.min.mjs';
      const doc = await pdfjs.getDocument({ data: Uint8Array.from(atob(b64), c => c.charCodeAt(0)) }).promise;
      const rows = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const { items } = await (await doc.getPage(i)).getTextContent();
        const lines = []; // group by y (±2px), then order cells by x
        for (const it of items) {
          if (!it.str.trim()) continue;
          const [x, y] = [it.transform[4], it.transform[5]];
          let line = lines.find(l => Math.abs(l.y - y) <= 2);
          if (!line) lines.push((line = { y, cells: [] }));
          line.cells.push([x, it.str.trim()]);
        }
        for (const l of lines.sort((a, b) => b.y - a.y)) rows.push({ y: Math.round(l.y) + i * 1e4, cells: l.cells.sort((a, b) => a[0] - b[0]).map(c => c[1]) });
      }
      return rows;
    }, readFileSync(file).toString('base64'));
  } finally {
    await close();
  }
}
