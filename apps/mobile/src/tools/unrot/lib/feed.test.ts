import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DAY, dueReview, nextPart, pick, readMs, review, saveNew } from './feed.ts';
import { seed } from './model.ts';
import type { Card } from './types.ts';

const card = (id: string, topic: string, extra: Partial<Card> = {}): Card =>
  ({ id, type: 'fact', topic, tags: [topic], text: 'one two three', source: 's', more: 'm', ...extra });
const thread = (id: string, part: number) => card(id, 'math', { thread: { id: 't', title: 'T', part, of: 3 } });
const now = 1_000 * DAY;
const base = { model: seed([]), seen: {}, hidden: [], exclude: new Set<string>(), recent: [], now };
// Doesn't explore, then takes the best of the top few.
const noExplore = () => { let n = 0; return () => (n++ % 2 === 0 ? 0.99 : 0); };

test('prefers the liked topic', () => {
  const cards = [card('a', 'space'), card('b', 'stoicism')];
  assert.equal(pick({ ...base, cards, model: seed(['stoicism']), random: noExplore() })?.id, 'b');
});

test('skips hidden, already-queued and recently seen cards', () => {
  const cards = [card('a', 'x'), card('b', 'x'), card('c', 'x'), card('d', 'x')];
  const got = pick({ ...base, cards, hidden: ['a'], exclude: new Set(['b']), seen: { c: now - DAY }, random: noExplore() });
  assert.equal(got?.id, 'd');
});

test('brings back the oldest seen card once everything has been seen', () => {
  const cards = [card('a', 'x'), card('b', 'x')];
  const got = pick({ ...base, cards, seen: { a: now - 2 * DAY, b: now - 5 * DAY }, random: () => 0.5 });
  assert.ok(got);
  assert.equal(pick({ ...base, cards, hidden: ['a', 'b'] }), undefined);
});

test('never three of one topic in a row when something else is available', () => {
  const cards = [card('a', 'space'), card('b', 'math')];
  const got = pick({ ...base, cards, model: seed(['space']), recent: ['space', 'space'], random: noExplore() });
  assert.equal(got?.id, 'b');
});

test('no topic gets more than 2 of the last 5 cards', () => {
  const cards = [card('a', 'space'), card('b', 'math')];
  const got = pick({ ...base, cards, model: seed(['space']), recent: ['space', 'math', 'space', 'history'], random: noExplore() });
  assert.equal(got?.id, 'b');
});

test('exploring goes to the least-seen topic', () => {
  const cards = [card('a', 'space'), card('b', 'space'), card('c', 'math'), card('d', 'math')];
  const seen = { a: now - 30 * DAY, b: now - 30 * DAY, c: now - 30 * DAY };
  assert.equal(pick({ ...base, cards, model: seed(['space']), seen, random: () => 0 })?.topic, 'math');
  // …unless you've been swiping that topic away.
  const model = { w: {}, b: { math: -2 }, n: 5 };
  assert.equal(pick({ ...base, cards, model, seen, random: () => 0 })?.topic, 'space');
});

test('thread parts unlock in order, and nextPart follows the thread', () => {
  const cards = [thread('t2', 2), thread('t3', 3), thread('t1', 1)];
  assert.equal(pick({ ...base, cards, random: noExplore() })?.id, 't1');
  assert.equal(pick({ ...base, cards, seen: { t1: now - 30 * DAY }, exclude: new Set(['t1']), random: noExplore() })?.id, 't2');
  assert.equal(nextPart(cards, cards[2], [])?.id, 't2');
  assert.equal(nextPart(cards, cards[2], ['t2']), undefined);
  assert.equal(nextPart(cards, cards[1], []), undefined);
});

test('saved cards come back at growing intervals, and reset when forgotten', () => {
  let s = saveNew(now);
  assert.equal(s.due, now + DAY);
  s = review(s, true, now);
  assert.equal(s.due, now + 3 * DAY);
  s = review(review(review(review(s, true, now), true, now), true, now), true, now);
  assert.equal(s.due, now + 60 * DAY);
  assert.equal(review(s, false, now).due, now + DAY);
});

test('dueReview returns the most overdue saved card not already queued', () => {
  const saved = { a: { at: 0, due: now - DAY, stage: 0 }, b: { at: 0, due: now - 3 * DAY, stage: 0 }, c: { at: 0, due: now + DAY, stage: 0 } };
  assert.equal(dueReview(saved, now, new Set()), 'b');
  assert.equal(dueReview(saved, now, new Set(['b'])), 'a');
  assert.equal(dueReview(saved, now, new Set(['a', 'b'])), undefined);
});

test('readMs has a floor and grows with length', () => {
  assert.equal(readMs(card('a', 'x')), 3000);
  assert.equal(readMs(card('a', 'x', { text: Array(40).fill('w').join(' ') })), 10_000);
});
