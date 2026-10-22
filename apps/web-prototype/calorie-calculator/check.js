// Sanity checks for model.js. Run: node check.js
const assert = require('assert');
const m = require('./model.js');
const p = { sex: 'm', age: 30, ft: 5, in: 10, steps: 8000, exercise: 0 };
const maint = m.maintenance(200 * m.LB, p);

// Eating at maintenance holds weight.
const flat = m.simulate(200, p, 180, () => maint);
assert(Math.abs(flat.at(-1) - 200) < 0.3, `maintenance drifted to ${flat.at(-1)}`);

// 750 kcal/day cut: fast water drop in week 1, slowing later (plateau), less than the naive 3500 rule.
const cut = m.simulate(200, p, 365, () => maint - 750);
const week1 = cut[0] - cut[7], week30 = cut[203] - cut[210];
assert(week1 > 2 * week30, `no early water drop / plateau: week1 ${week1}, week30 ${week30}`);
assert(cut[365] > 200 - 750 * 365 / 3500, 'should lose less than the 3500-kcal rule');
assert(cut.every((w, i) => !i || w <= cut[i - 1] + 1e-9), 'steady cut should never gain');

// Trend smooths and fills gaps.
const t = m.trend([{ x: 0, y: 200 }, { x: 10 * 864e5, y: 190 }]);
assert(t.length === 11 && t[10].y > 190 && t[10].y < 200);

console.log('ok', { maint: Math.round(maint), week1: week1.toFixed(2), week30: week30.toFixed(2), year: cut[365].toFixed(1) });
