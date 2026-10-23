import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type } from '@/ui/theme';
import { INK } from './fonts';

type Icon = ComponentProps<typeof Ionicons>['name'];
const HINTS: [Icon, string, string][] = [
  ['swap-vertical', 'Swipe up', 'Next card'],
  ['arrow-forward', 'Swipe right', 'Go deeper: context and the source'],
  ['arrow-back', 'Swipe left', 'Not for me: fewer like this'],
  ['heart', 'Double tap', 'Like it'],
];

// First-run gesture hints over the first card.
export function Coach({ onDone }: { onDone: () => void }) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View style={{ gap: 22, maxWidth: 360, width: '100%' }}>
        <Text style={[type.title2, { color: INK, textAlign: 'center' }]}>How Unrot works</Text>
        {HINTS.map(([icon, what, does]) => (
          <View key={what} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon} size={24} color={INK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.headline, { color: INK }]}>{what}</Text>
              <Text style={[type.subhead, { color: 'rgba(245,241,232,0.7)' }]}>{does}</Text>
            </View>
          </View>
        ))}
        <Pressable onPress={onDone} accessibilityRole="button"
          style={({ pressed }) => ({ backgroundColor: INK, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, opacity: pressed ? 0.8 : 1 })}>
          <Text style={[type.headline, { color: '#111' }]}>Start scrolling</Text>
        </Pressable>
      </View>
    </View>
  );
}
