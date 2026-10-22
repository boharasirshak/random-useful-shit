/// <reference types="node" />
// Same checks as apps/web-prototype/calorie-calculator/check.js. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LB, maintenance, simulate, trend, type Profile } from './model.ts';

const p: Profile = { sex: 'm', age: 30, ft: 5, in: 10, weight: 200, goal: 180, steps: 8000, exercise: 0, bf: 0 };
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
