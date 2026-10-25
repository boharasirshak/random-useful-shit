// node scrape.mjs [source ...]   (no args = all). A source is sources/<name>.mjs or sources/chains/<name>.mjs exporting scrape().
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib.mjs';

const chains = readdirSync(join(ROOT, 'sources', 'chains')).filter(f => f.endsWith('.mjs')).map(f => f.slice(0, -4));
const all = [...readdirSync(join(ROOT, 'sources')).filter(f => f.endsWith('.mjs')).map(f => f.slice(0, -4)), ...chains];
const wanted = process.argv.length > 2 ? process.argv.slice(2) : all;
let failed = 0;
for (const name of wanted) {
  const file = chains.includes(name) ? `./sources/chains/${name}.mjs` : `./sources/${name}.mjs`;
  try {
    const { scrape } = await import(file);
    await scrape();
  } catch (e) {
    failed++;
    console.error(`${name}: FAILED ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
