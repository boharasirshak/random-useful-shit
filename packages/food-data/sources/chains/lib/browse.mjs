// Open a page in headless Chromium and keep the JSON responses whose URL matches `rx`. `act(page)` can click around before the wait.
import { browser } from '../../../lib.mjs';

export async function captureJson(url, rx, { ms = 8000, act } = {}) {
  const { page, close } = await browser();
  const hits = [];
  page.on('response', async r => {
    if (!rx.test(r.url())) return;
    try { hits.push({ url: r.url(), body: await r.json() }); } catch {}
  });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (act) await act(page);
    await page.waitForTimeout(ms);
  } finally { await close(); }
  return hits;
}

export const norm = s => String(s).toLowerCase().replace(/[®™*†'’]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
