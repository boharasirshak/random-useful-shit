/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addEntry, countItem, entryKcal, recentOrders, removeEntry, stepEntry, totalKcal } from './log.ts';

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

test('undo lowers the matching line, then removes it', () => {
  let log = addEntry(addEntry([], orange), orange);
  log = removeEntry(log, orange);
  assert.equal(log[0].qty, 1);
  assert.deepEqual(removeEntry(log, orange), []);
});

test('recent orders: newest first, distinct, one restaurant', () => {
  const plate = { meal: 'lunch' as const, name: 'Panda Plate', qty: 1, parts: [{ id: 'panda-chow-mein', qty: 1 }, { id: 'panda-orange-chicken', qty: 2 }] };
  const logs = {
    '2026-10-20': [{ ...orange, qty: 1 }, plate],
    '2026-10-21': [{ meal: 'dinner' as const, qty: 1, parts: [{ id: 'cfa-chicken-sandwich', qty: 1 }] }, { ...orange, meal: 'dinner' as const, qty: 1 }],
  };
  assert.deepEqual(recentOrders(logs, 'panda').map(o => o.name ?? o.parts[0].id), ['panda-orange-chicken', 'Panda Plate']);
  assert.equal(recentOrders(logs, 'cfa').length, 1);
});
