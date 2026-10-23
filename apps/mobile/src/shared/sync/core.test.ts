// Two devices, one fake server with the same rules as apps/server (last write wins by edit time, a cursor per change).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { firstMeta, resend, stamp, syncSide, type Meta, type Side, type SyncIn, type SyncOut } from './core.ts';
import type { Change, Spec } from './records.ts';

const spec: Spec = { fields: ['profile'], maps: ['logs'] };
type S = { profile: { weight: number }; logs: Record<string, string[]> };
const fresh = (): S => ({ profile: { weight: 0 }, logs: {} });

function server(pageSize = 500) {
  const rows = new Map<string, Change & { seq: number }>();
  let seq = 0;
  return async ({ since, changes }: SyncIn): Promise<SyncOut> => {
    for (const c of changes) {
      const old = rows.get(c.key);
      if (!old || old.at < c.at) rows.set(c.key, { ...structuredClone(c), seq: ++seq });
    }
    const out = [...rows.values()].filter(r => r.seq > since).sort((a, b) => a.seq - b.seq);
    const page = out.slice(0, pageSize);
    return { changes: structuredClone(page), cursor: page.at(-1)?.seq ?? since, more: out.length > pageSize };
  };
}

function device(call: (b: SyncIn) => Promise<SyncOut>, initial = fresh()) {
  let state: S = initial;
  const meta: Meta = firstMeta(state, spec);
  let clock = 1000;
  const side: Side = { spec, meta, get: () => state, set: p => { state = { ...state, ...p } as S; } };
  return {
    get state() { return state; },
    meta,
    edit(fn: (s: S) => S) { const prev = state; state = fn(state); stamp(meta, prev, state, spec, (clock += 1000)); },
    at(t: number) { clock = t; },
    sync: () => syncSide(side, call, p => side.set(p), () => {}),
    switched: () => resend(meta, state, spec),
  };
}

test('a fresh device takes the real data and its empty defaults never overwrite it', async () => {
  const call = server();
  const a = device(call);
  a.edit(s => ({ ...s, profile: { weight: 180 }, logs: { '2026-10-22': ['shake'] } }));
  await a.sync();
  const b = device(call);
  await b.sync();
  assert.deepEqual(b.state, a.state);
  await a.sync();
  assert.equal(a.state.profile.weight, 180);
});

test('offline edits on different days merge', async () => {
  const call = server();
  const a = device(call), b = device(call);
  a.edit(s => ({ ...s, logs: { ...s.logs, mon: ['nuggets'] } }));
  b.edit(s => ({ ...s, logs: { ...s.logs, tue: ['bowl'] } }));
  await a.sync(); await b.sync(); await a.sync();
  assert.deepEqual(a.state.logs, { mon: ['nuggets'], tue: ['bowl'] });
  assert.deepEqual(b.state.logs, a.state.logs);
});

test('the later edit wins, whichever device syncs first', async () => {
  const call = server();
  const a = device(call), b = device(call);
  a.at(5000); a.edit(s => ({ ...s, profile: { weight: 181 } })); // edited later…
  b.at(2000); b.edit(s => ({ ...s, profile: { weight: 179 } }));
  await a.sync(); await b.sync(); await a.sync(); // …but synced first
  assert.equal(a.state.profile.weight, 181);
  assert.equal(b.state.profile.weight, 181);
});

test('an edit beats the version it was made on, even from a device whose clock is behind', async () => {
  const call = server();
  const a = device(call), b = device(call);
  a.at(90_000); a.edit(s => ({ ...s, profile: { weight: 180 } }));
  await a.sync(); await b.sync();
  b.at(1_000); b.edit(s => ({ ...s, profile: { weight: 178 } })); // b's clock is way behind
  await b.sync(); await a.sync();
  assert.equal(a.state.profile.weight, 178);
});

test('deletes travel', async () => {
  const call = server();
  const a = device(call), b = device(call);
  a.edit(s => ({ ...s, logs: { mon: ['x'], tue: ['y'] } }));
  await a.sync(); await b.sync();
  b.edit(s => ({ ...s, logs: { tue: s.logs.tue } }));
  await b.sync(); await a.sync();
  assert.deepEqual(a.state.logs, { tue: ['y'] });
});

test('an edit made while a sync is in flight stays queued', async () => {
  const inner = server();
  let a!: ReturnType<typeof device>;
  const call = async (body: SyncIn) => {
    const out = await inner(body);
    if (body.changes.length) a.edit(s => ({ ...s, profile: { weight: 175 } })); // lands mid-request
    return out;
  };
  a = device(call);
  a.edit(s => ({ ...s, profile: { weight: 176 } }));
  await a.sync();
  assert.equal(a.state.profile.weight, 175);
  assert.ok(a.meta.dirty.includes('f:profile') || (await inner({ since: 0, changes: [] })).changes.some(c => c.key === 'f:profile' && (c.value as { weight: number }).weight === 175));
});

test('big first syncs go in pages', async () => {
  const call = server(100);
  const logs = Object.fromEntries(Array.from({ length: 1234 }, (_, i) => [`d${i}`, [String(i)]]));
  const a = device(call, { profile: { weight: 1 }, logs });
  await a.sync();
  assert.equal(a.meta.dirty.length, 0);
  const b = device(call);
  await b.sync();
  assert.equal(Object.keys(b.state.logs).length, 1234);
});

test('switching accounts sends everything again, keeping edit times', async () => {
  const a = device(server());
  a.edit(s => ({ ...s, logs: { mon: ['x'] } }));
  await a.sync();
  a.switched();
  assert.deepEqual(new Set(a.meta.dirty), new Set(['f:profile', 'm:logs:mon']));
  assert.equal(a.meta.cursor, 0);
  assert.ok(a.meta.stamps['m:logs:mon'] > 0);
});
