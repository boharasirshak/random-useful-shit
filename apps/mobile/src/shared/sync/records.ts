// A tool's saved state, split into sync records: one per field ("f:profile"), and one per entry of a map field
// ("m:logs:2026-10-23"). Small records mean two devices editing different days never overwrite each other.
// Pure, so it's tested without a store.

export type Spec = { fields: string[]; maps: string[] };
export type Change = { key: string; value: unknown; deleted: boolean; at: number };
type State = Record<string, unknown>;
type Map_ = Record<string, unknown>;

export const fieldKey = (f: string) => `f:${f}`;
export const mapKey = (m: string, k: string) => `m:${m}:${k}`;

// Every record a state holds right now, keyed by record key.
export function records(s: State, spec: Spec): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const f of spec.fields) if (s[f] !== undefined) out.set(fieldKey(f), s[f]);
  for (const m of spec.maps) for (const [k, v] of Object.entries((s[m] as Map_) ?? {})) out.set(mapKey(m, k), v);
  return out;
}

// What changed between two states. Stores update immutably, so comparing references is enough (and cheap).
export function changed(prev: State, next: State, spec: Spec): { key: string; deleted: boolean }[] {
  const out: { key: string; deleted: boolean }[] = [];
  for (const f of spec.fields) if (prev[f] !== next[f]) out.push({ key: fieldKey(f), deleted: false });
  for (const m of spec.maps) {
    const a = (prev[m] as Map_) ?? {}, b = (next[m] as Map_) ?? {};
    if (a === b) continue;
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)]))
      if (a[k] !== b[k]) out.push({ key: mapKey(m, k), deleted: !(k in b) });
  }
  return out;
}

// The part of the state to set after taking these changes from the server.
export function applyChanges(s: State, spec: Spec, changes: Change[]): State {
  const patch: State = {};
  for (const c of changes) {
    if (c.key.startsWith('f:')) {
      const f = c.key.slice(2);
      if (spec.fields.includes(f) && !c.deleted) patch[f] = c.value;
    } else if (c.key.startsWith('m:')) {
      const rest = c.key.slice(2), i = rest.indexOf(':');
      const m = rest.slice(0, i), k = rest.slice(i + 1);
      if (i < 0 || !spec.maps.includes(m)) continue;
      const map = { ...((patch[m] ?? s[m] ?? {}) as Map_) };
      if (c.deleted) delete map[k];
      else map[k] = c.value;
      patch[m] = map;
    }
  }
  return patch;
}

// Deep equality that ignores object key order (the server's JSON storage reorders keys).
export function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null || Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => same((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}
