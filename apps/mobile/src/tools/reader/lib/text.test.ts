/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paragraphs, sentences, splitParagraph, wordAt } from './text.ts';

test('paragraphs: blank lines split, wrapped lines join, page numbers and hyphenation go', () => {
  const raw = 'The quick brown fox jumped over the\nlazy dog. It was a remark-\nable day.\n\n12\n\nSecond para-\ngraph here.\n\niv\n';
  assert.deepEqual(paragraphs(raw), ['The quick brown fox jumped over the lazy dog. It was a remarkable day.', 'Second paragraph here.']);
});

test('sentences split on . ! ? but not on abbreviations or decimals', () => {
  assert.deepEqual(splitParagraph('Hello there! How are you? Fine. "Really?" Yes.'), ['Hello there!', 'How are you?', 'Fine.', '"Really?"', 'Yes.']);
  assert.deepEqual(splitParagraph('Mr. Smith paid 3.14 dollars, e.g. in cash. Then he left.'), ['Mr. Smith paid 3.14 dollars, e.g. in cash.', 'Then he left.']);
  assert.deepEqual(splitParagraph('No punctuation at all'), ['No punctuation at all']);
});

test('over-long sentences are cut at a space', () => {
  const long = Array(80).fill('word').join(' ');
  const parts = splitParagraph(long);
  assert.ok(parts.length > 1 && parts.every(p => p.length <= 300));
  assert.equal(parts.join(' '), long);
});

test('sentences carry their paragraph index', () => {
  assert.deepEqual(sentences('A b. C d.\n\nE f.'), [{ t: 'A b.', p: 0 }, { t: 'C d.', p: 0 }, { t: 'E f.', p: 1 }]);
});

test('wordAt uses markers when present, otherwise estimates from time', () => {
  const text = 'one two three four';
  assert.equal(wordAt(text, 1.1, 2, [{ at: 0, time: 0 }, { at: 4, time: 0.5 }, { at: 8, time: 1 }, { at: 14, time: 1.5 }]), 8);
  assert.equal(wordAt(text, 0, 2, []), 0);
  assert.equal(wordAt(text, 1, 2, []), 8); // halfway → start of "three"
  assert.equal(wordAt(text, 5, 2, []), 14);
});
