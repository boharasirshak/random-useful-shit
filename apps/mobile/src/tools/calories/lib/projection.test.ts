/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromBackup, toBackup } from './backup.ts';
import { shift } from './dates.ts';
import type { Logs } from './log.ts';
import { LB, maintenance, planIntake, simulate, type Profile } from './model.ts';
import { project } from './projection.ts';

const p: Profile = { sex: 'm', age: 30, ft: 5, in: 10, weight: 210, goal: 200, rate: 1, steps: 7000, exercise: 0, bf: 0 };
const day = '2026-10-22';

test('eating the target loses the planned lb/week (after the water drop), never under the floor', () => {
  for (const rate of [0.5, 1]) {
    const eat = planIntake(210 * LB, { ...p, rate });
    assert.ok(eat < maintenance(210 * LB, p));
    const lbs = simulate(210, p, 28, () => eat);
    assert.equal(((lbs[14] - lbs[28]) / 2).toFixed(1), rate.toFixed(1));
  }
  const small: Profile = { ...p, sex: 'f', age: 60, ft: 5, in: 0, weight: 130, rate: 2, steps: 0 };
  assert.equal(planIntake(130 * LB, small), 1200);
});

test('no weigh-ins: plan starts today at the starting weight', () => {
  const r = project(p, {}, {}, 160, day);
  assert.equal(r.avg, null);
  assert.equal(r.past.length, 1);
  assert.equal(r.future[0].y, 210);
  assert.ok(r.goalDate! > r.future[0].x);
});

test('faster rate reaches the goal sooner', () => {
  const slow = project(p, {}, {}, 160, day), fast = project({ ...p, rate: 1.5 }, {}, {}, 160, day);
  assert.ok(fast.goalDate! < slow.goalDate!);
});

test('plan runs from the first weigh-in; actual trend is compared against it', () => {
  const logs: Logs = {};
  for (let i = 1; i <= 14; i++) logs[shift(day, -i)] = [{ meal: 'lunch', qty: 1, parts: [{ id: 'panda-orange-chicken', qty: 3 }] }];
  const r = project(p, logs, { [shift(day, -14)]: 210, [day]: 207 }, 160, day);
  assert.equal(r.avg, 1680);
  assert.equal(r.past[0].y, 210);
  assert.deepEqual(r.past[r.past.length - 1], r.future[0]);
  assert.ok(r.lbPerWeek > 0.5);
  assert.ok(r.trendPerWeek! > 0);
  assert.equal(typeof r.vsPlan, 'number');
});

test('backups round-trip and reject junk', () => {
  const data = { profile: p, shake: 160, logs: {}, weights: { [day]: 210 } };
  assert.deepEqual(fromBackup(JSON.parse(JSON.stringify(toBackup(data)))).data, data);
  assert.throws(() => fromBackup({ hello: 1 }));
});
