/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reminderText, reminderTimes } from './reminder.ts';

const r = { on: true, hour: 7, minute: 30 };

test('reminders: skip today once weighed in or once the time has passed', () => {
  const early = new Date(2026, 9, 22, 6, 0);
  assert.equal(reminderTimes(early, r, false)[0].getDate(), 22);
  assert.equal(reminderTimes(early, r, true)[0].getDate(), 23);
  assert.equal(reminderTimes(new Date(2026, 9, 22, 9, 0), r, false)[0].getDate(), 23);
  const all = reminderTimes(early, r, false, 14);
  assert.equal(all.length, 14);
  assert.ok(all.every(d => d.getHours() === 7 && d.getMinutes() === 30));
});

test('reminder text varies and mentions the streak', () => {
  assert.ok(reminderText(1, 4).title.includes('5-day'));
  assert.notEqual(reminderText(0, 4).title, reminderText(2, 4).title);
});
