import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useCards } from '@/tools/unrot/data/catalog';
import { SavedRow } from '@/tools/unrot/features/SavedRow';
import type { Card } from '@/tools/unrot/lib/types';
import { useUnrot } from '@/tools/unrot/store/app';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';
import { Segmented } from '@/ui/Segmented';
import { space, type, useColors } from '@/ui/theme';

// Saved and liked cards, newest first. Tap one to see it again, with "Go deeper".
export default function SavedScreen() {
  const c = useColors();
  const [tab, setTab] = useState<'saved' | 'liked'>('saved');
  const [now] = useState(Date.now);
  const cards = useCards();
  const byId = useMemo(() => new Map(cards.map(x => [x.id, x])), [cards]);
  const saved = useUnrot(s => s.saved);
  const liked = useUnrot(s => s.liked);
  const when: Record<string, number> = tab === 'saved' ? Object.fromEntries(Object.entries(saved).map(([id, s]) => [id, s.at])) : liked;
  const list = Object.keys(when).sort((a, b) => when[b] - when[a]).map(id => byId.get(id)).filter((x): x is Card => !!x);
  return (
    <Screen title="Saved" back="Apps">
      <Segmented options={[['saved', `Saved · ${Object.keys(saved).length}`], ['liked', `Liked · ${Object.keys(liked).length}`]]} value={tab} onChange={setTab} />
      {list.length ? (
        <Section footer={tab === 'saved' ? 'Saved cards come back in your feed to check you still remember them: after 1 day, then 3, 7, 21 and 60 days.' : undefined}>
          {list.map(card => (
            <SavedRow key={card.id} card={card} now={now} due={tab === 'saved' ? saved[card.id]?.due : undefined}
              onPress={() => router.push({ pathname: '/unrot/card/[id]', params: { id: card.id } })} />
          ))}
        </Section>
      ) : (
        <View style={{ alignItems: 'center', gap: space.sm, paddingTop: space.xxl, paddingHorizontal: space.xxl }}>
          <Ionicons name={tab === 'saved' ? 'bookmark-outline' : 'heart-outline'} size={40} color={c.tertiary} />
          <Text style={[type.headline, { color: c.label }]}>{tab === 'saved' ? 'Nothing saved yet' : 'Nothing liked yet'}</Text>
          <Text style={[type.subhead, { color: c.secondary, textAlign: 'center' }]}>
            {tab === 'saved' ? 'Tap Save on a card you want to keep. It comes back later so it sticks.' : 'Double tap a card to like it.'}
          </Text>
        </View>
      )}
    </Screen>
  );
}
