// The taste model: logistic regression over card features. These weights and biases are the only thing
// that ever leaves the phone (see store/sync.ts). Topic → bias; type, author and tags → weights.
import type { Card } from './types.ts';

export type Model = { w: Record<string, number>; b: Record<string, number>; n: number };

const LR = 0.3;
const CLIP = 4; // keeps one strong reaction from drowning out everything else

// What the user did with a card → [label, strength]. Strength scales the learning step.
export const SIGNALS = {
  like: [1, 1],
  save: [1, 1.2],
  share: [1, 1],
  more: [1, 0.6],
  read: [1, 0.3], // stayed long enough to read it
  skip: [0, 0.3], // flicked past in under a second and a half
  hide: [0, 2], // swiped left: fewer like this
} as const;
export type Signal = keyof typeof SIGNALS;

export const features = (c: Card) => [`type:${c.type}`, ...(c.author ? [`author:${c.author}`] : []), ...c.tags.map(t => `tag:${t}`)];

const clip = (x: number) => Math.max(-CLIP, Math.min(CLIP, x));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export function score(m: Model, c: Card): number {
  const f = features(c);
  const k = 1 / Math.sqrt(f.length);
  return (m.b[c.topic] ?? 0) + f.reduce((s, x) => s + (m.w[x] ?? 0) * k, 0);
}

// One SGD step on the log loss: nudge every feature of the card toward (y = 1) or away from (y = 0) it.
export function learn(m: Model, c: Card, signal: Signal): Model {
  const [y, strength] = SIGNALS[signal];
  const g = LR * strength * (y - sigmoid(score(m, c)));
  const f = features(c);
  const k = 1 / Math.sqrt(f.length);
  const w = { ...m.w };
  for (const x of f) w[x] = clip((w[x] ?? 0) + g * k);
  return { w, b: { ...m.b, [c.topic]: clip((m.b[c.topic] ?? 0) + g) }, n: m.n + 1 };
}

// Starting point: topics picked on the welcome screen get a head start.
export const seed = (topics: string[]): Model => ({ w: {}, b: Object.fromEntries(topics.map(t => [t, 1])), n: 0 });

// For the "Your taste" screen: how much each topic is liked, 0…1.
export const topicLike = (m: Model, topic: string) => sigmoid(m.b[topic] ?? 0);

// Strongest liked tags/authors, for "You're into …".
export function favorites(m: Model, prefix: 'tag:' | 'author:', n = 6): string[] {
  return Object.entries(m.w)
    .filter(([k, v]) => k.startsWith(prefix) && v > 0.05)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k.slice(prefix.length));
}
