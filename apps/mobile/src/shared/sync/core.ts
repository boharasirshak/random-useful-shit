// The sync algorithm, free of React Native so two simulated devices can be tested against a fake server.
// engine.ts wires it to real stores, storage and the network.
import { applyChanges, changed, records, same, type Change, type Spec } from './records.ts';

type State = Record<string, unknown>;
// Per tool, saved beside its data: where we are in the server's stream, when each record was last edited, what's unsent.
export type Meta = { cursor: number; stamps: Record<string, number>; dirty: string[] };
export type SyncIn = { since: number; changes: Change[] };
export type SyncOut = { changes: (Change & { seq: number })[]; cursor: number; more: boolean };
export type Side = { spec: Spec; get: () => State; set: (patch: State) => void; meta: Meta };

const PAGE = 500;

// First run: everything already on the device goes up stamped 0, so it never beats a real edit from another device.
export function firstMeta(s: State, spec: Spec): Meta {
  const keys = [...records(s, spec).keys()];
  return { cursor: 0, stamps: Object.fromEntries(keys.map(k => [k, 0])), dirty: keys };
}

// A local edit: stamp what changed with the edit time and queue it. Returns whether anything changed.
// An edit always stamps later than the version it was made on, even if this device's clock runs behind.
export function stamp(meta: Meta, prev: State, next: State, spec: Spec, now: number): boolean {
  const c = changed(prev, next, spec);
  for (const { key } of c) meta.stamps[key] = Math.max(now, (meta.stamps[key] ?? 0) + 1);
  if (c.length) meta.dirty = [...new Set([...meta.dirty, ...c.map(x => x.key)])];
  return c.length > 0;
}

// Everything on the device marked unsent again (after switching accounts). Edit times are kept, so newer still wins.
export function resend(meta: Meta, s: State, spec: Spec) {
  meta.cursor = 0;
  meta.dirty = [...new Set([...meta.dirty, ...records(s, spec).keys()])];
}

// Changes from the server: take each unless ours is newer and still unsent. Returns the patch to apply, if any.
export function take(side: Side, incoming: Change[]): State | null {
  const { meta, spec } = side;
  const mine = records(side.get(), spec);
  const accepted = incoming.filter(c => {
    if (meta.dirty.includes(c.key) && (meta.stamps[c.key] ?? 0) > c.at) return false;
    meta.stamps[c.key] = c.at;
    meta.dirty = meta.dirty.filter(k => k !== c.key);
    return !same(mine.get(c.key) ?? null, c.deleted ? null : c.value); // our own echo changes nothing
  });
  return accepted.length ? applyChanges(side.get(), spec, accepted) : null;
}

// One full sync of one tool: send what's dirty (in pages), take what's new, until both sides are caught up.
// `apply` sets the patch without it counting as a local edit.
export async function syncSide(side: Side, call: (body: SyncIn) => Promise<SyncOut>, apply: (patch: State) => void, saveMeta: () => Promise<void> | void) {
  const { meta } = side;
  let more = true;
  while (more) {
    const batch = meta.dirty.slice(0, PAGE);
    const sent = Object.fromEntries(batch.map(k => [k, meta.stamps[k] ?? 0]));
    const mine = records(side.get(), side.spec);
    const out = await call({
      since: meta.cursor,
      changes: batch.map(key => (mine.has(key) ? { key, value: mine.get(key), at: sent[key], deleted: false } : { key, value: null, at: sent[key], deleted: true })),
    });
    // Sent: no longer dirty, unless it was edited again while we were waiting.
    meta.dirty = meta.dirty.filter(k => !(k in sent) || meta.stamps[k] !== sent[k]);
    const patch = take(side, out.changes);
    if (patch) apply(patch);
    meta.cursor = out.cursor;
    await saveMeta();
    more = out.more || meta.dirty.some(k => !(k in sent));
  }
}
