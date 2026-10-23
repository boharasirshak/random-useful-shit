import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { topic } from '@/tools/unrot/data/topics';
import { type } from '@/ui/theme';

export function TopicChip({ id, label }: { id: string; label?: string }) {
  const t = topic(id);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: `${t.color}26`, alignSelf: 'flex-start' }}>
      <Ionicons name={t.icon} size={13} color={t.color} />
      <Text style={[type.footnote, { color: t.color, fontWeight: '600' }]}>{label ?? t.name}</Text>
    </View>
  );
}
