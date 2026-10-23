import assert from 'node:assert/strict';
import { test } from 'node:test';
import { phraseCount, phrases } from './phrases.ts';

test('breaks at punctuation and after six words', () => {
  const w = phrases('Men are disturbed not by things, but by the opinions which they form about things.');
  assert.deepEqual(w.map(x => x.phrase), [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2]);
  assert.equal(phraseCount(w), 3);
});

test('marks the key phrase, word by word', () => {
  const w = phrases('You always have a choice. Even here.', 'have a choice');
  assert.deepEqual(w.filter(x => x.em).map(x => x.text), ['have', 'a', 'choice']);
  assert.equal(phrases('No match here', 'missing').some(x => x.em), false);
  assert.deepEqual(phrases(''), []);
});

test('the highlight stops exactly at the key phrase, even inside a word', () => {
  const w = phrases('not only truth, but supreme beauty—a beauty cold', 'supreme beauty');
  assert.deepEqual(w.filter(x => x.em).map(x => x.text), ['supreme', 'beauty']);
  assert.deepEqual(w.map(x => x.text).join('|'), 'not|only|truth,|but|supreme|beauty|—a|beauty|cold');
  assert.equal(w.find(x => x.text === 'beauty')!.space, false); // glued to "—a"
  assert.equal(w.map(x => x.text + (x.space ? ' ' : '')).join(''), 'not only truth, but supreme beauty—a beauty cold ');
});

test('closing quotes after punctuation still end a phrase', () => {
  assert.equal(phraseCount(phrases('He said “stop.” Then left.')), 2);
});
