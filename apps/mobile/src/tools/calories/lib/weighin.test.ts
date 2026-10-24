/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { milestone, saltWater, weighInNews } from './weighin.ts';

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

test('salt bloat: a salty day shows up the next morning and fades, low-salt days drain it', () => {
  const panda = [{ meal: 'dinner' as const, name: 'Plate', parts: [{ id: 'panda-chow-mein', qty: 1 }, { id: 'panda-orange-chicken', qty: 1 }, { id: 'panda-black-pepper-chicken', qty: 1 }], qty: 2 }];
  const logs = { '2026-10-20': panda };
  const next = saltWater(logs, '2026-10-21');
  assert.ok(next > 0.5 && next < 2, `${next}`); // ~2,800 mg over → about a pound
  assert.ok(saltWater(logs, '2026-10-22') < next / 1.9);
  assert.equal(saltWater({}, '2026-10-21'), 0);
  const fruit = [{ meal: 'lunch' as const, parts: [{ id: 'cfa-fruit-cup-m', qty: 1 }], qty: 1 }];
  assert.equal(saltWater({ ...logs, '2026-10-21': fruit }, '2026-10-22'), 0);
});
