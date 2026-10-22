/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { awards } from './awards.ts';
import { currentStreak, longestRun } from './streak.ts';

const done = { '2026-10-18': true, '2026-10-19': true, '2026-10-20': true, '2026-10-21': true, '2026-10-15': true };

test('streak counts back from today, or from yesterday while today is still open', () => {
  assert.equal(currentStreak(done, '2026-10-21'), 4);
  assert.equal(currentStreak(done, '2026-10-22'), 4);
  assert.equal(currentStreak(done, '2026-10-23'), 0);
});

test('longest run, optionally only counting days that pass a check', () => {
  const days = Object.keys(done).sort();
  assert.equal(longestRun(days), 4);
  assert.equal(longestRun(days, d => d !== '2026-10-19'), 2);
});

test('awards come from data: streaks, days under target, weight lost', () => {
  const logs = { '2026-10-20': [{ meal: 'lunch' as const, qty: 1, parts: [{ id: 'panda-orange-chicken', qty: 1 }] }] };
  const a = awards({ logs, done, weights: { '2026-10-01': 212, '2026-10-21': 206.5 }, shake: 160, target: 2000, goal: 185, today: '2026-10-22' });
  const by = Object.fromEntries(a.map(x => [x.id, x]));
  assert.ok(by['first-day'].earned && by['streak-3'].earned && !by['streak-7'].earned);
  assert.equal(by['streak-7'].have, 4);
  assert.ok(by['lost-5'].earned && !by['lost-10'].earned && !by.goal.earned);
  assert.equal(by['under-10'].have, 5);
});
