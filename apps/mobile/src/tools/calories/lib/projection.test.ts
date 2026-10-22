/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromBackup, toBackup } from './backup.ts';
import { shift } from './dates.ts';
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
  const r = project(p, {}, day);
  assert.equal(r.past.length, 1);
  assert.equal(r.future[0].y, 210);
  assert.ok(r.goalDate! > r.future[0].x);
});

test('faster rate reaches the goal sooner', () => {
  const slow = project(p, {}, day), fast = project({ ...p, rate: 1.5 }, {}, day);
  assert.ok(fast.goalDate! < slow.goalDate!);
});

test('plan runs from the first weigh-in; actual trend is compared against it', () => {
  const r = project(p, { [shift(day, -14)]: 210, [day]: 207 }, day);
  assert.equal(r.past[0].y, 210);
  assert.deepEqual(r.past[r.past.length - 1], r.future[0]);
  assert.ok(r.lbPerWeek > 0.5);
  assert.ok(r.trendPerWeek! > 0);
  assert.equal(typeof r.vsPlan, 'number');
});

test('backups round-trip and reject junk', () => {
  const data = { profile: p, shake: 160, shakeProtein: 30, logs: {}, weights: { [day]: 210 }, done: {}, stepWeeks: [], favorites: [], seenAwards: [], reminder: { on: false, hour: 7, minute: 30 } };
  assert.deepEqual(fromBackup(JSON.parse(JSON.stringify(toBackup(data)))).data, data);
  assert.throws(() => fromBackup({ hello: 1 }));
});

test('changing steps today leaves the past plan alone; more steps = a higher target at the same rate', () => {
  const start = shift(day, -30);
  const before = [{ from: start, week: Array(7).fill(7000) }];
  const after = [...before, { from: day, week: Array(7).fill(12000) }];
  const a = project(p, { [start]: 210 }, day, before), b = project(p, { [start]: 210 }, day, after);
  assert.deepEqual(b.past, a.past);
  assert.ok(b.target > a.target + 150);
});

test('closed days use what you ate: over target pushes the goal later and shows the balance', () => {
  const start = shift(day, -10);
  const base = project(p, { [start]: 210 }, day);
  const over = project(p, { [start]: 210 }, day, [], { [shift(day, -3)]: 4000, [shift(day, -2)]: 4000 });
  assert.ok(over.balance > 3000);
  assert.ok(over.goalShift! > 0);
  assert.ok(over.future[0].y > base.future[0].y);
});

test('plateau: eating today\'s target forever levels off above the goal, and flattens out', () => {
  const r = project(p, {}, day);
  const s = r.steady;
  assert.ok(r.plateauLb < 210 && r.plateauLb > 150);
  const early = s[0].y - s[4].y, late = s[s.length - 5].y - s[s.length - 1].y;
  assert.ok(late < early / 5);
});
