import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyChanges, changed, records, same, type Spec } from './records.ts';

const spec: Spec = { fields: ['profile', 'shake'], maps: ['logs'] };
const day1 = [{ meal: 'lunch' }];
const s0 = { profile: { weight: 180 }, shake: 160, logs: { '2026-10-22': day1 }, other: 'not synced' };

test('records: one per field and one per map entry', () => {
  assert.deepEqual([...records(s0, spec).keys()], ['f:profile', 'f:shake', 'm:logs:2026-10-22']);
});

test('changed: only what moved, by reference', () => {
  const s1 = { ...s0, logs: { ...s0.logs, '2026-10-23': [{ meal: 'dinner' }] }, other: 'x' };
  assert.deepEqual(changed(s0, s1, spec), [{ key: 'm:logs:2026-10-23', deleted: false }]);
  const s2 = { ...s1, shake: 170, logs: { '2026-10-23': s1.logs['2026-10-23'] } };
  assert.deepEqual(changed(s1, s2, spec), [{ key: 'f:shake', deleted: false }, { key: 'm:logs:2026-10-22', deleted: true }]);
  assert.deepEqual(changed(s2, { ...s2 }, spec), []);
});

test('applyChanges: sets fields, adds and removes map entries, ignores unknown keys', () => {
  const patch = applyChanges(s0, spec, [
    { key: 'f:shake', value: 200, deleted: false, at: 1 },
    { key: 'm:logs:2026-10-23', value: [{ meal: 'snacks' }], deleted: false, at: 1 },
    { key: 'm:logs:2026-10-22', value: null, deleted: true, at: 1 },
    { key: 'f:other', value: 'nope', deleted: false, at: 1 },
    { key: 'm:weights:2026-10-23', value: 1, deleted: false, at: 1 },
  ]);
  assert.deepEqual(patch, { shake: 200, logs: { '2026-10-23': [{ meal: 'snacks' }] } });
  assert.deepEqual(s0.logs, { '2026-10-22': day1 }); // untouched
});

test('a round trip through records and applyChanges rebuilds the state', () => {
  const changes = [...records(s0, spec)].map(([key, value]) => ({ key, value, deleted: false, at: 0 }));
  assert.deepEqual(applyChanges({}, spec, changes), { profile: s0.profile, shake: 160, logs: s0.logs });
});

test('same: deep, and blind to key order', () => {
  assert.ok(same({ a: 1, b: [1, { c: 2, d: 3 }] }, { b: [1, { d: 3, c: 2 }], a: 1 }));
  assert.ok(!same({ a: 1 }, { a: 1, b: undefined }));
  assert.ok(!same([1, 2], [2, 1]));
  assert.ok(!same({ 0: 1 }, [1]));
  assert.ok(same(null, null) && !same(null, {}));
});
