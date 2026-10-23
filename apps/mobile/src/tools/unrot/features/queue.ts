// Builds the feed a few cards ahead: taste-ranked picks, a due review every so often, and the end card at the daily limit.
import { getCards } from '@/tools/unrot/data/catalog';
import { dueReview, pick } from '@/tools/unrot/lib/feed';
import { todayCount, useUnrot } from '@/tools/unrot/store/app';

export type Item = { key: string; kind: 'card' | 'review' | 'end'; id?: string };

const REVIEW_EVERY = 6;

// list: the feed so far; at: the index on screen now.
export function extend(list: Item[], at: number, n: number): Item[] {
  const s = useUnrot.getState();
  const cards = getCards();
  const byId = new Map(cards.map(c => [c.id, c]));
  const now = Date.now();
  const t = todayCount(s.today);
  const out = [...list];
  for (let i = 0; i < n && out.at(-1)?.kind !== 'end'; i++) {
    const ahead = out.length - 1 - at; // queued but not seen yet
    if (s.limit && t.count + ahead >= s.limit + t.extra) {
      out.push({ key: `end-${out.length}`, kind: 'end' });
      break;
    }
    const exclude = new Set(out.flatMap(x => (x.id ? [x.id] : [])));
    let last = -1;
    out.forEach((x, k) => { if (x.kind === 'review') last = k; });
    const due = out.length - 1 - last >= REVIEW_EVERY ? dueReview(s.saved, now, exclude) : undefined;
    if (due && byId.has(due)) {
      out.push({ key: `review-${due}`, kind: 'review', id: due });
      continue;
    }
    const recent = out.slice(-5).flatMap(x => (x.id && byId.has(x.id) ? [byId.get(x.id)!.topic] : []));
    const c = pick({ cards, model: s.model, seen: s.seen, hidden: s.hidden, exclude, recent, now });
    if (!c) break;
    out.push({ key: `card-${c.id}`, kind: 'card', id: c.id });
  }
  return out;
}

// Puts `id` right after `after` (thread continuation), unless it's already queued.
export function insertAfter(list: Item[], after: string, id: string): Item[] {
  if (list.some(x => x.id === id)) return list;
  const k = list.findIndex(x => x.id === after);
  return [...list.slice(0, k + 1), { key: `card-${id}`, kind: 'card', id }, ...list.slice(k + 1)];
}
