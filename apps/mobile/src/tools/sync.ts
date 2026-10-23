// Which tools sync to the server, and which of their saved fields. Device-only state (today's card count,
// when the last Drive backup ran, the Unrot catalog cache) stays out. A tool must also be listed in apps/server/app/sync.py.
import type { Synced } from '@/shared/sync/engine';
import { useApp } from '@/tools/calories/store/app';
import { useUnrot } from '@/tools/unrot/store/app';

export const SYNCED: Synced[] = [
  {
    tool: 'calories',
    store: useApp,
    spec: { fields: ['profile', 'shake', 'shakeProtein', 'stepWeeks', 'favorites', 'seenAwards', 'reminder'], maps: ['logs', 'weights', 'done'] },
  },
  {
    tool: 'unrot',
    store: useUnrot,
    spec: { fields: ['model', 'topics', 'welcomed', 'lessons', 'limit', 'hidden'], maps: ['liked', 'saved', 'seen'] },
  },
];
