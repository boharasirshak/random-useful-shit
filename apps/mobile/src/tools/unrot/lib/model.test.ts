import assert from 'node:assert/strict';
import { test } from 'node:test';
import { favorites, learn, score, seed, topicLike } from './model.ts';
import type { Card } from './types.ts';

const card = (id: string, topic: string, tags: string[], author?: string): Card =>
  ({ id, type: 'quote', topic, tags, author, text: 'x', source: 's', more: 'm' });
const stoic = card('a', 'stoicism', ['death', 'virtue'], 'Seneca');
const space = card('b', 'space', ['scale'], undefined);

test('picked topics start ahead', () => {
  const m = seed(['stoicism']);
  assert.ok(score(m, stoic) > score(m, space));
});

test('likes pull a card up, hides push it down', () => {
  let m = seed([]);
  const before = score(m, space);
  m = learn(m, space, 'like');
  assert.ok(score(m, space) > before);
  m = learn(learn(m, space, 'hide'), space, 'hide');
  assert.ok(score(m, space) < before);
  assert.equal(m.n, 3);
});

test('learning generalises through shared tags and authors', () => {
  const other = card('c', 'philosophy', ['death'], 'Seneca');
  const m = learn(seed([]), stoic, 'save');
  assert.ok(score(m, other) > 0);
  assert.deepEqual(favorites(m, 'author:'), ['Seneca']);
});

test('weights stay bounded however much you like something', () => {
  let m = seed([]);
  for (let i = 0; i < 500; i++) m = learn(m, stoic, 'save');
  assert.ok(Object.values(m.w).every(v => Math.abs(v) <= 4) && m.b.stoicism <= 4);
  assert.ok(topicLike(m, 'stoicism') > 0.9);
});

test('learn does not mutate the old model (undo relies on it)', () => {
  const m = seed(['space']);
  learn(m, space, 'hide');
  assert.deepEqual(m, { w: {}, b: { space: 1 }, n: 0 });
});
