// Picks what comes next in the feed. Pure: the screen passes in everything it needs.
import { score, type Model } from './model.ts';
import type { Card } from './types.ts';

export const DAY = 86_400_000;
const REST = 21 * DAY; // a seen card can come back after three weeks
const EXPLORE = 0.2; // share of picks that go to your least-seen topic, so the feed doesn't collapse into one
const REJECTED = -0.5; // topic bias below this: exploring leaves it alone
const WINDOW = 5; // no topic gets more than 2 of the last 5 cards
const TOP = 4; // pick among the best few, not always the single best

export type PickInput = {
  cards: Card[];
  model: Model;
  seen: Record<string, number>; // id → when it was last shown
  hidden: string[]; // swiped left
  exclude: Set<string>; // already in the feed
  recent: string[]; // topics of the last few cards (up to 5), oldest first
  recentTypes?: string[]; // their types (quote, idea, fact, question), oldest first
  now: number;
  random?: () => number;
};

const threadKey = (id: string, part: number) => `${id}#${part}`;

export function pick({ cards, model, seen, hidden, exclude, recent, recentTypes = [], now, random = Math.random }: PickInput): Card | undefined {
  const byPart = new Map(cards.filter(c => c.thread).map(c => [threadKey(c.thread!.id, c.thread!.part), c]));
  const shown = (id: string) => seen[id] != null || exclude.has(id);
  const no = new Set(hidden);
  // Thread parts only appear once the part before them has been shown.
  const open = (c: Card) => {
    if (!c.thread || c.thread.part === 1) return true;
    const prev = byPart.get(threadKey(c.thread.id, c.thread.part - 1));
    return !prev || shown(prev.id);
  };
  const ok = (c: Card) => !no.has(c.id) && !exclude.has(c.id) && open(c);
  let pool = cards.filter(c => ok(c) && !(seen[c.id] > now - REST));
  // Everything's been seen recently: bring back the oldest.
  if (!pool.length) pool = cards.filter(ok).sort((a, b) => (seen[a.id] ?? 0) - (seen[b.id] ?? 0)).slice(0, 20);
  if (!pool.length) return undefined;
  // Variety: a topic that had 2 of the last 5 cards sits this one out.
  const last = recent.slice(-WINDOW);
  const full = new Set(last.filter(t => last.filter(x => x === t).length >= 2));
  const varied = pool.filter(c => !full.has(c.topic));
  if (varied.length) pool = varied;
  // And never three of one kind in a row: six quotes running is a wall of text.
  const [t1, t2] = recentTypes.slice(-2);
  if (t1 && t1 === t2) {
    const mixed = pool.filter(c => c.type !== t1);
    if (mixed.length) pool = mixed;
  }
  // Explore: the topic you've seen least (and haven't clearly rejected), so new interests get found early.
  if (random() < EXPLORE) {
    const shownIn: Record<string, number> = {};
    for (const c of cards) if (seen[c.id] != null) shownIn[c.topic] = (shownIn[c.topic] ?? 0) + 1;
    const wanted = pool.filter(c => (model.b[c.topic] ?? 0) > REJECTED);
    const from = wanted.length ? wanted : pool;
    const least = Math.min(...from.map(c => shownIn[c.topic] ?? 0));
    const fresh = from.filter(c => (shownIn[c.topic] ?? 0) === least);
    return fresh[Math.floor(random() * fresh.length)];
  }
  // ponytail: scores every eligible card per pick; fine for a few thousand cards, cache scores if the catalog grows past that.
  const top = pool.map(c => [score(model, c), c] as const).sort((x, y) => y[0] - x[0]).slice(0, TOP);
  return top[Math.floor(random() * top.length)][1];
}

// The next part of a thread, if there is one and it hasn't been hidden.
export function nextPart(cards: Card[], c: Card, hidden: string[]): Card | undefined {
  const t = c.thread;
  if (!t || t.part >= t.of) return undefined;
  return cards.find(x => x.thread?.id === t.id && x.thread.part === t.part + 1 && !hidden.includes(x.id));
}

// Spaced repetition for saved cards: they come back to check you still remember them.
export type Saved = { at: number; due: number; stage: number };
export const REVIEW_DAYS = [1, 3, 7, 21, 60];
export const saveNew = (now: number): Saved => ({ at: now, due: now + REVIEW_DAYS[0] * DAY, stage: 0 });
export function review(s: Saved, remembered: boolean, now: number): Saved {
  const stage = remembered ? Math.min(s.stage + 1, REVIEW_DAYS.length - 1) : 0;
  return { ...s, stage, due: now + REVIEW_DAYS[stage] * DAY };
}
// The most overdue saved card that isn't already in the feed.
export function dueReview(saved: Record<string, Saved>, now: number, exclude: Set<string>): string | undefined {
  return Object.entries(saved)
    .filter(([id, s]) => s.due <= now && !exclude.has(id))
    .sort((a, b) => a[1].due - b[1].due)[0]?.[0];
}

// About how long a card takes to read: ~240 words a minute, at least three seconds.
export const readMs = (c: Card) => Math.max(3000, (c.text.split(/\s+/).length + (c.title?.split(/\s+/).length ?? 0)) * 250);
