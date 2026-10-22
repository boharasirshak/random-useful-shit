/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { niceRange } from './scale.ts';

test('axis snaps to round numbers, tight around the data, 2–5 ticks', () => {
  assert.deepEqual(niceRange(159.3, 212.4), [150, 225, 25]);
  assert.deepEqual(niceRange(203.1, 212.9), [200, 215, 5]);
  assert.deepEqual(niceRange(0, 8.4), [0, 10, 2]);
  const [lo, hi] = niceRange(206, 206);
  assert.ok(lo < 206 && hi > 206);
});
