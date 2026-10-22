/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addEntry, countItem, entryKcal, stepEntry, totalKcal } from './log.ts';

const shake = 160;
const orange = { meal: 'lunch' as const, parts: [{ id: 'panda-orange-chicken', qty: 1 }] };

test('adding the same line bumps qty; a different meal is a new line', () => {
  let log = addEntry([], orange);
  log = addEntry(log, orange);
  log = addEntry(log, { ...orange, meal: 'dinner' });
  assert.deepEqual(log.map(e => [e.meal, e.qty]), [['lunch', 2], ['dinner', 1]]);
  assert.equal(totalKcal(log, shake), 560 * 3);
});

test('combos sum their parts, halves count half', () => {
  const plate = { meal: 'lunch' as const, name: 'Panda Plate', qty: 1, parts: [
    { id: 'panda-chow-mein', qty: 0.5 }, { id: 'panda-fried-rice', qty: 0.5 },
    { id: 'panda-orange-chicken', qty: 1 }, { id: 'panda-broccoli-beef', qty: 1 },
  ] };
  assert.equal(entryKcal(plate, shake), 260 + 305 + 560 + 190);
  assert.equal(countItem([plate], 'panda-chow-mein'), 0.5);
});

test('shake uses the user value, unknown ids count as 0', () => {
  assert.equal(entryKcal({ meal: 'breakfast', qty: 1, parts: [{ id: 'shake', qty: 1 }] }, 200), 200);
  assert.equal(entryKcal({ meal: 'snacks', qty: 1, parts: [{ id: 'gone', qty: 1 }] }, 200), 0);
});

test('stepping to zero removes the line', () => {
  assert.deepEqual(stepEntry(addEntry([], orange), 0, -1), []);
});
