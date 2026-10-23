// The twelve topics. Ids match packages/unrot-content.
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type Topic = { id: string; name: string; hint: string; icon: ComponentProps<typeof Ionicons>['name'] };

export const TOPICS: Topic[] = [
  { id: 'stoicism', hint: 'Stay calm when life isn’t', name: 'Stoicism', icon: 'shield-half' },
  { id: 'philosophy', hint: 'Big questions, sharp answers', name: 'Philosophy', icon: 'bulb' },
  { id: 'eastern', hint: 'Buddha, Lao Tzu, Confucius', name: 'Eastern Wisdom', icon: 'flower' },
  { id: 'science', hint: 'How the world really works', name: 'Science', icon: 'flask' },
  { id: 'space', hint: 'How big, how old, how far', name: 'Space', icon: 'planet' },
  { id: 'nature', hint: 'Life, evolution, your body', name: 'Nature', icon: 'leaf' },
  { id: 'mind', hint: 'Why we do what we do', name: 'Psychology', icon: 'pulse' },
  { id: 'learning', hint: 'Learn faster, decide better', name: 'Thinking Well', icon: 'school' },
  { id: 'math', hint: 'Puzzles that break your brain', name: 'Math', icon: 'infinite' },
  { id: 'history', hint: 'Wild true stories', name: 'History', icon: 'hourglass' },
  { id: 'words', hint: 'Great writers, odd words', name: 'Words & Books', icon: 'book' },
  { id: 'money', hint: 'How money really works', name: 'Money', icon: 'cash' },
];
const BY_ID = Object.fromEntries(TOPICS.map(t => [t.id, t]));
export const topic = (id: string): Topic => BY_ID[id] ?? { id, name: id, hint: '', icon: 'sparkles' };

