/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ORDERS } from '../data/menu.ts';
import { buildKcal, fromParts, isDone, pick, setHalf, startBuild, toParts } from './builder.ts';

test('Panda plate fills base then entrées; half & half splits the base', () => {
  let b = setHalf(startBuild(ORDERS.panda!.Plate!), true);
  for (const id of ['panda-chow-mein', 'panda-fried-rice', 'panda-orange-chicken', 'panda-orange-chicken']) b = pick(b, id);
  assert.ok(isDone(b));
  assert.deepEqual(toParts(b), [
    { id: 'panda-chow-mein', qty: 0.5 }, { id: 'panda-fried-rice', qty: 0.5 }, { id: 'panda-orange-chicken', qty: 2 },
  ]);
  assert.equal(buildKcal(b, 0), 260 + 305 + 1120);
});

test('items that fit no slot are ignored, unless they are the add-on category', () => {
  const meal = ORDERS.cfa!.Meal!;
  let b = startBuild(meal);
  b = pick(b, 'cfa-waffle-fries-m', meal.extras); // side while the entrée slot is active
  assert.equal(b.slots[1].id, null);
  b = pick(b, 'cfa-chick-fil-a-sauce', meal.extras);
  assert.deepEqual(b.extras, ['cfa-chick-fil-a-sauce']);
  assert.ok(!isDone(b));
});

test('turning half & half off merges the base back', () => {
  let b = setHalf(startBuild(ORDERS.panda!.Bowl!), true);
  b = pick(b, 'panda-chow-mein');
  b = setHalf(b, false);
  assert.deepEqual(b.slots.map(s => [s.category, s.qty, s.id]), [['base', 1, 'panda-chow-mein'], ['entree', 1, null]]);
  assert.equal(b.active, 1);
});

test('a logged plate or meal rebuilds into the same build, so it can be edited', () => {
  let plate = setHalf(startBuild(ORDERS.panda!.Plate!), true);
  for (const id of ['panda-chow-mein', 'panda-fried-rice', 'panda-orange-chicken', 'panda-orange-chicken']) plate = pick(plate, id);
  assert.deepEqual(fromParts(ORDERS.panda!.Plate!, toParts(plate)), plate);

  const meal = ORDERS.cfa!.Meal!;
  let b = startBuild(meal);
  for (const id of ['cfa-chicken-sandwich', 'cfa-waffle-fries-m', 'cfa-sweet-tea-m', 'cfa-chick-fil-a-sauce', 'cfa-chick-fil-a-sauce']) b = pick(b, id, meal.extras);
  assert.deepEqual(fromParts(meal, toParts(b)), b);
});
