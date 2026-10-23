import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TOPICS } from '@/tools/unrot/data/topics';
import { INK, INK_DIM, serif } from '@/tools/unrot/features/fonts';
import { useUnrot } from '@/tools/unrot/store/app';
import { select } from '@/ui/haptics';
import { type } from '@/ui/theme';

// First run (and "Change topics"): pick what pulls you in. Picks seed the taste model; it learns the rest.
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const welcomed = useUnrot(s => s.welcomed);
  const [picked, setPicked] = useState<string[]>(useUnrot.getState().topics);
  const toggle = (id: string) => { select(); setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id])); };
  const go = () => {
    if (welcomed) { useUnrot.getState().setTopics(picked); router.back(); }
    else { useUnrot.getState().welcome(picked); router.replace('/unrot'); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0C' }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: 140, paddingHorizontal: 24, gap: 28, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        {welcomed && (
          <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8} style={{ position: 'absolute', top: insets.top + 8, right: 20 }}>
            <Text style={[type.body, { color: INK_DIM }]}>Cancel</Text>
          </Pressable>
        )}
        <View style={{ alignItems: 'center', gap: 14 }}>
          <Image source={require('@/assets/tools/unrot.png')} style={{ width: 96, height: 96, borderRadius: 22 }} accessibilityIgnoresInvertColors />
          <Text style={{ fontFamily: serif, fontSize: 46, color: INK, fontStyle: 'italic' }}>unrot</Text>
          <Text style={[type.title3, { color: INK, textAlign: 'center' }]}>Scroll that leaves you sharper.</Text>
          <Text style={[type.subhead, { color: INK_DIM, textAlign: 'center', lineHeight: 21, maxWidth: 420 }]}>
            Real quotes, big ideas and true facts, one card at a time, each with its source. Pick what pulls you in. It learns the rest from what you do, on your phone.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {TOPICS.map(t => {
            const on = picked.includes(t.id);
            return (
              <Pressable key={t.id} onPress={() => toggle(t.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                style={({ pressed }) => ({ flexGrow: 1, flexBasis: '45%', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 14,
                  borderRadius: 14, backgroundColor: on ? t.color : 'rgba(255,255,255,0.07)', opacity: pressed ? 0.8 : 1 })}>
                <Ionicons name={t.icon} size={20} color={on ? '#111' : t.color} />
                <Text style={[type.headline, { color: on ? '#111' : INK, flex: 1 }]} numberOfLines={1}>{t.name}</Text>
                {on && <Ionicons name="checkmark-circle" size={20} color="#111" />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 16, backgroundColor: 'rgba(10,10,12,0.94)' }}>
        <Pressable onPress={go} disabled={!picked.length} accessibilityRole="button"
          style={({ pressed }) => ({ backgroundColor: picked.length ? '#9BE15D' : 'rgba(255,255,255,0.1)', borderRadius: 14, paddingVertical: 16, alignItems: 'center', opacity: pressed ? 0.8 : 1, maxWidth: 592, width: '100%', alignSelf: 'center' })}>
          <Text style={[type.headline, { color: picked.length ? '#0B1410' : INK_DIM }]}>
            {!picked.length ? 'Pick at least one' : welcomed ? 'Save topics' : `Start scrolling · ${picked.length} picked`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
