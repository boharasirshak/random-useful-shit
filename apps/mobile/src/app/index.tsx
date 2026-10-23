import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { TOOLS } from '@/tools/registry';
import { AppIcon } from '@/ui/AppIcon';
import { Screen } from '@/ui/Screen';
import { space, useColors } from '@/ui/theme';

// Home: every tool as an app icon.
export default function Launcher() {
  const c = useColors();
  const account = (
    <Pressable onPress={() => router.push('/account')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Account and sync">
      <Ionicons name="person-circle" size={32} color={c.tint} />
    </Pressable>
  );
  return (
    <Screen title="Random Useful Shit" accessory={account}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, paddingHorizontal: space.xl }}>
        {TOOLS.map(t => <AppIcon key={t.id} tool={t} onPress={() => router.push(t.href)} />)}
      </View>
    </Screen>
  );
}
