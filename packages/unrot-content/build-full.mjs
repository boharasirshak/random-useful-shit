// parts/*.json + bulk/*.json → cards-full.json, the catalog the app downloads. Validates the bulk cards with the
// rules in BULK.md (looser than parts/: verbatim text isn't slop-checked, `more` is optional). Run: node build-full.mjs
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';

const TOPICS = ['stoicism', 'philosophy', 'eastern', 'science', 'space', 'nature', 'mind', 'learning', 'math', 'history', 'words', 'money'];
const TYPES = ['quote', 'idea', 'fact', 'question'];
const words = s => s.trim().split(/\s+/).length;
const bundled = JSON.parse(readFileSync(new URL('./cards.json', import.meta.url), 'utf8'));
const dir = new URL('./bulk/', import.meta.url);
const ids = new Set(bundled.cards.map(c => c.id));
const bulk = [];
let images = 0, bytes = 0;
for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  for (const c of JSON.parse(readFileSync(new URL(f, dir), 'utf8'))) {
    const at = `${f} ${c.id}`;
    assert.match(c.id ?? '', /^[a-z]+-\d{3,6}$/, `${at}: id`);
    assert.ok(!ids.has(c.id), `${at}: duplicate id`);
    ids.add(c.id);
    assert.equal(c.tier, 2, `${at}: tier`);
    assert.ok(TYPES.includes(c.type), `${at}: type`);
    assert.ok(TOPICS.includes(c.topic), `${at}: topic`);
    assert.ok(Array.isArray(c.tags) && c.tags.length >= 1 && c.tags.length <= 5, `${at}: tags`);
    for (const k of ['text', 'source']) assert.ok(typeof c[k] === 'string' && c[k].trim(), `${at}: ${k}`);
    assert.ok(words(c.text) <= 32, `${at}: text is ${words(c.text)} words`);
    if (c.more) assert.ok(words(c.more) <= 120, `${at}: more is ${words(c.more)} words`);
    if (c.title) assert.ok(words(c.title) <= 8, `${at}: title`);
    if (c.type === 'quote') assert.ok(c.author, `${at}: quote needs an author`);
    assert.ok(typeof c.em === 'string' && c.text.includes(c.em) && words(c.em) <= 8, `${at}: em`);
    if (c.link) assert.match(c.link, /^https:\/\//, `${at}: link`);
    if (c.image) {
      assert.equal(c.image, `${c.id}.jpg`, `${at}: image must be <id>.jpg`);
      const p = new URL(`images/${c.image}`, dir);
      assert.ok(existsSync(p), `${at}: image file missing`);
      const size = statSync(p).size;
      assert.ok(size <= 70_000, `${at}: image is ${Math.round(size / 1024)} KB (keep under 60)`);
      assert.ok(c.credit, `${at}: a picture needs a credit`);
      images++;
      bytes += size;
    }
    bulk.push(c);
  }
}
const cards = [...bundled.cards, ...bulk];
const body = JSON.stringify(cards);
const version = createHash('sha256').update(body).digest('hex').slice(0, 12);
writeFileSync(new URL('./cards-full.json', import.meta.url), `{"version":"${version}","cards":${body}}\n`);
const count = Object.fromEntries(TOPICS.map(t => [t, cards.filter(c => c.topic === t).length]));
console.log(`${cards.length} cards (${bulk.length} bulk, ${images} pictures, ${(bytes / 1e6).toFixed(1)} MB), version ${version}`, count);
