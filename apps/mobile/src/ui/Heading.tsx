import { Text, View } from 'react-native';
import { space, type, useColors } from './theme';

// Section heading outside a Section card (menu grids, Favorites, Recent): bold, sentence case, optional note on the right.
export function Heading({ title, note }: { title: string; note?: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: space.lg + space.xs }}>
      <Text style={[type.title3, { color: c.label }]}>{title}</Text>
      {note ? <Text style={[type.footnote, { color: c.secondary }]}>{note}</Text> : null}
    </View>
  );
}
