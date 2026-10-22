import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import type { Tool } from '@/tools/registry';
import { tap } from './haptics';
import { type, useColors } from './theme';

const SIZE = 64;

// iOS home-screen style icon: rounded square + label.
export function AppIcon({ tool, onPress }: { tool: Tool; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="button" accessibilityLabel={`Open ${tool.title}`}
      style={({ pressed }) => ({ width: 80, alignItems: 'center', gap: 6, transform: [{ scale: pressed ? 0.92 : 1 }] })}>
      <View style={{
        width: SIZE, height: SIZE, borderRadius: SIZE * 0.225, backgroundColor: tool.color, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
      }}>
        <Ionicons name={tool.icon} size={34} color="#fff" />
      </View>
      <Text style={[type.caption, { color: c.label, fontWeight: '500' }]} numberOfLines={1}>{tool.name}</Text>
    </Pressable>
  );
}
