// The twelve topics. Ids match packages/unrot-content; colors are the accent on dark cards.
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type Topic = { id: string; name: string; color: string; icon: ComponentProps<typeof Ionicons>['name'] };

export const TOPICS: Topic[] = [
  { id: 'stoicism', name: 'Stoicism', color: '#F2B33D', icon: 'shield-half' },
  { id: 'philosophy', name: 'Philosophy', color: '#B794F6', icon: 'bulb' },
  { id: 'eastern', name: 'Eastern Wisdom', color: '#F28B82', icon: 'flower' },
  { id: 'science', name: 'Science', color: '#4FD1C5', icon: 'flask' },
  { id: 'space', name: 'Space', color: '#8FA8FF', icon: 'planet' },
  { id: 'nature', name: 'Nature', color: '#7BD88F', icon: 'leaf' },
  { id: 'mind', name: 'Psychology', color: '#F687B3', icon: 'pulse' },
  { id: 'learning', name: 'Thinking Well', color: '#F6E05E', icon: 'school' },
  { id: 'math', name: 'Math', color: '#63B3ED', icon: 'infinite' },
  { id: 'history', name: 'History', color: '#F6A05A', icon: 'hourglass' },
  { id: 'words', name: 'Words & Books', color: '#FC8181', icon: 'book' },
  { id: 'money', name: 'Money', color: '#B5E655', icon: 'cash' },
];
const BY_ID = Object.fromEntries(TOPICS.map(t => [t.id, t]));
export const topic = (id: string): Topic => BY_ID[id] ?? { id, name: id, color: '#AAAAAA', icon: 'sparkles' };

// The card background: the topic color sunk almost to black.
export function cardBg(hex: string, amount = 0.16): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (v: number) => Math.round(v * amount + 10 * (1 - amount)).toString(16).padStart(2, '0');
  return `#${mix(n >> 16)}${mix((n >> 8) & 255)}${mix(n & 255)}`;
}
