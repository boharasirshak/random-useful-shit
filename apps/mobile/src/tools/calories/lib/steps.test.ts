/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editWeek, stepsOn, weekAvg } from './steps.ts';

const lazy = [4000, 4000, 4000, 4000, 4000, 2000, 2000];
const busy = [10000, 10000, 10000, 10000, 10000, 12000, 8000];

test('a week averages its days', () => assert.equal(weekAvg(busy), 10000));

test('edits apply from their day on; same-day edits replace', () => {
  let h = editWeek([], '2026-10-01', lazy);
  h = editWeek(h, '2026-10-20', busy);
  h = editWeek(h, '2026-10-20', busy.map(n => n / 2));
  assert.equal(h.length, 2);
  assert.equal(stepsOn(h, '2026-09-01'), weekAvg(lazy)); // before the first version: first version
  assert.equal(stepsOn(h, '2026-10-19'), weekAvg(lazy));
  assert.equal(stepsOn(h, '2026-10-20'), 5000);
});
