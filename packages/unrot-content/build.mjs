// Merges parts/*.json into cards.json and checks every card. Run: node build.mjs
// The app bundles cards.json; the server serves it so the app can pick up new cards without a release.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const TOPICS = ['stoicism', 'philosophy', 'eastern', 'science', 'space', 'nature', 'mind', 'learning', 'math', 'history', 'words', 'money'];
const TYPES = ['quote', 'idea', 'fact', 'question'];
const words = s => s.trim().split(/\s+/).length;
const dir = new URL('./parts/', import.meta.url);

const cards = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
  .flatMap(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')));
const ids = new Set();
const threads = {};
for (const c of cards) {
  const at = `card ${c.id}`;
  assert.match(c.id ?? '', /^[a-z]+-\d{3}$/, `${at}: id`);
  assert.ok(!ids.has(c.id), `${at}: duplicate id`);
  ids.add(c.id);
  assert.ok(TYPES.includes(c.type), `${at}: type`);
  assert.ok(TOPICS.includes(c.topic), `${at}: topic`);
  assert.ok(Array.isArray(c.tags) && c.tags.length >= 1 && c.tags.length <= 5, `${at}: tags`);
  for (const k of ['text', 'source', 'more']) assert.ok(typeof c[k] === 'string' && c[k].trim(), `${at}: ${k}`);
  assert.ok(words(c.text) <= 70, `${at}: text is ${words(c.text)} words`);
  assert.ok(words(c.more) >= 50 && words(c.more) <= 200, `${at}: more is ${words(c.more)} words`);
  if (c.type === 'quote') assert.ok(c.author, `${at}: quote needs an author`);
  if (c.link) assert.match(c.link, /^https:\/\//, `${at}: link`);
  if (c.thread) (threads[c.thread.id] ??= []).push(c.thread);
}
for (const [id, parts] of Object.entries(threads)) {
  const of = parts[0].of;
  assert.deepEqual(parts.map(p => p.part).sort((a, b) => a - b), Array.from({ length: of }, (_, i) => i + 1), `thread ${id}: parts 1…${of}`);
  assert.ok(parts.every(p => p.of === of && p.title === parts[0].title), `thread ${id}: same title and length`);
}

const body = JSON.stringify(cards);
const version = createHash('sha256').update(body).digest('hex').slice(0, 12);
writeFileSync(new URL('./cards.json', import.meta.url), `{"version":"${version}","cards":${body}}\n`);
const count = Object.fromEntries(TOPICS.map(t => [t, cards.filter(c => c.topic === t).length]));
console.log(`${cards.length} cards, ${Object.keys(threads).length} threads, version ${version}`, count);
