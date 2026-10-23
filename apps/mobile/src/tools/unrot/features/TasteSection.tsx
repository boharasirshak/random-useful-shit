import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { TOPICS } from '@/tools/unrot/data/topics';
import { favorites, topicLike } from '@/tools/unrot/lib/model';
import { useUnrot } from '@/tools/unrot/store/app';
import { Row } from '@/ui/Row';
import { Section } from '@/ui/Section';
import { space, type, useColors } from '@/ui/theme';

// What the model has learned, in plain sight: one bar per topic, plus the tags and authors it leans toward.
export function TasteSection() {
  const c = useColors();
  const model = useUnrot(s => s.model);
  const rows = TOPICS.map(t => ({ t, v: topicLike(model, t.id) })).sort((a, b) => b.v - a.v);
  const tags = favorites(model, 'tag:');
  const authors = favorites(model, 'author:', 4);
  return (
    <>
      <Section header="Your taste" footer={model.n < 15 ? 'Still learning. These start from the topics you picked and sharpen as you read, like and save.' : `Learned from ${model.n} reactions: likes, saves, reading time, and cards you said weren’t for you.`}>
        {rows.map(({ t, v }) => (
          <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, minHeight: 44 }}
            accessible accessibilityLabel={`${t.name}: ${Math.round(v * 100)} percent`}>
            <Ionicons name={t.icon} size={18} color={c.secondary} />
            <Text style={[type.subhead, { color: c.label, width: 112 }]} numberOfLines={1}>{t.name}</Text>
            <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: c.fill, overflow: 'hidden' }}>
              <View style={{ width: `${Math.round(v * 100)}%`, height: '100%', borderRadius: 4, backgroundColor: c.label, opacity: 0.85 }} />
            </View>
          </View>
        ))}
      </Section>
      {(tags.length > 0 || authors.length > 0) && (
        <Section header="You're into">
          {tags.length > 0 && <Row title="Themes" subtitle={tags.join(', ')} />}
          {authors.length > 0 && <Row title="Thinkers" subtitle={authors.join(', ')} />}
        </Section>
      )}
    </>
  );
}
