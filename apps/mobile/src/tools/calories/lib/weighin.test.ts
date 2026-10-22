/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { milestone, weighInNews } from './weighin.ts';

test('weigh-in news: change since last time, new lows, streak of days in a row', () => {
  const w = { '2026-10-19': 208, '2026-10-20': 207.4, '2026-10-21': 207.9, '2026-10-22': 206.8 };
  const today = weighInNews(w, '2026-10-22');
  assert.equal(today.delta, -1.1);
  assert.ok(today.newLow);
  assert.equal(today.streak, 4);
  const up = weighInNews(w, '2026-10-21');
  assert.equal(up.delta, 0.5);
  assert.ok(!up.newLow && up.line.includes('0.5'));
  assert.equal(weighInNews({ '2026-10-22': 210 }, '2026-10-22').delta, null);
});

test('milestones every 5 lb, never past the goal', () => {
  assert.deepEqual(milestone(207, 185), { next: 205, toGo: 2, progress: 0.6 });
  assert.equal(milestone(205, 185)!.next, 200);
  assert.equal(milestone(187, 185)!.next, 185);
  assert.equal(milestone(184, 185), null);
});
