/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromBackup, toBackup } from './backup.ts';
import { shift } from './dates.ts';
import type { Logs } from './log.ts';
import type { Profile } from './model.ts';
import { project } from './projection.ts';

const p: Profile = { sex: 'm', age: 30, ft: 5, in: 10, weight: 210, goal: 200, steps: 7000, exercise: 0, bf: 0 };
const day = '2026-10-22';

test('no food logged: no prediction', () => {
  const r = project(p, {}, { [day]: 210 }, 160, day);
  assert.equal(r.avg, null);
  assert.equal(r.future.length, 0);
});

test('a steady deficit predicts loss and a goal date; past and future meet at today', () => {
  const logs: Logs = {};
  for (let i = 1; i <= 14; i++) logs[shift(day, -i)] = [{ meal: 'lunch', qty: 1, parts: [{ id: 'panda-orange-chicken', qty: 3 }] }];
  const r = project(p, logs, { [shift(day, -14)]: 210, [day]: 207 }, 160, day);
  assert.equal(r.avg, 1680);
  assert.ok(r.lbPerWeek! > 0.5);
  assert.ok(r.goalDate! > r.future[0].x);
  assert.deepEqual(r.past[r.past.length - 1], r.future[0]);
  assert.ok(r.trendPerWeek! > 0);
});

test('backups round-trip and reject junk', () => {
  const data = { profile: p, shake: 160, logs: {}, weights: { [day]: 210 } };
  assert.deepEqual(fromBackup(JSON.parse(JSON.stringify(toBackup(data)))).data, data);
  assert.throws(() => fromBackup({ hello: 1 }));
});
