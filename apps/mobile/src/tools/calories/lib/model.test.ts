/// <reference types="node" />
// Same checks as apps/web-prototype/calorie-calculator/check.js. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageOn, LB, macroTargets, maintenance, maxRate, pace, simulate, trend, type Profile } from './model.ts';

const p: Profile = { sex: 'm', age: 30, ft: 5, in: 10, weight: 200, goal: 180, rate: 1, steps: 8000, exercise: 0, bf: 0 };
const maint = maintenance(200 * LB, p);

test('matches the web prototype', () => {
  assert.equal(Math.round(maint), 2587);
  assert.equal(simulate(200, p, 365, () => maint - 750)[365].toFixed(1), '132.1');
});

test('eating at maintenance holds weight', () => {
  const flat = simulate(200, p, 180, () => maint);
  assert.ok(Math.abs(flat.at(-1)! - 200) < 0.3, `drifted to ${flat.at(-1)}`);
});

test('a cut shows an early water drop, then a plateau, and beats the 3500-kcal rule', () => {
  const cut = simulate(200, p, 365, () => maint - 750);
  const week1 = cut[0] - cut[7], week30 = cut[203] - cut[210];
  assert.ok(week1 > 2 * week30, `week1 ${week1}, week30 ${week30}`);
  assert.ok(cut[365] > 200 - 750 * 365 / 3500);
  assert.ok(cut.every((w, i) => !i || w <= cut[i - 1] + 1e-9), 'steady cut should never gain');
});

test('trend smooths and fills gaps', () => {
  const t = trend([{ x: 0, y: 200 }, { x: 10 * 864e5, y: 190 }]);
  assert.equal(t.length, 11);
  assert.ok(t[10].y > 190 && t[10].y < 200);
});

test('age from date of birth turns over on the birthday', () => {
  assert.equal(ageOn('1998-10-23', '2026-10-22'), 27);
  assert.equal(ageOn('1998-10-22', '2026-10-22'), 28);
});

test('pace: capped at 1% of body weight (0.5–2 lb), zoned by % per week', () => {
  assert.equal(maxRate(212), 2);
  assert.equal(maxRate(150), 1.5);
  assert.equal(maxRate(40), 0.5);
  assert.equal(pace(0.6, 200).zone, 'gentle');
  assert.equal(pace(1.2, 200).zone, 'steady');
  assert.equal(pace(2, 200).zone, 'fast');
});

test('macro targets: protein from goal weight, 30% fat, the rest carbs', () => {
  const t = macroTargets(2200, 185);
  assert.equal(t.p, 148);
  assert.equal(t.f, 73);
  assert.equal(t.p * 4 + t.c * 4 + t.f * 9 <= 2205, true);
});
