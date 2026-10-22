import { router } from 'expo-router';
import { View } from 'react-native';
import { TOOLS } from '@/tools/registry';
import { AppIcon } from '@/ui/AppIcon';
import { Screen } from '@/ui/Screen';
import { space } from '@/ui/theme';

// Home: every tool as an app icon.
export default function Launcher() {
  return (
    <Screen title="Random Useful Shit">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, paddingHorizontal: space.xl }}>
        {TOOLS.map(t => <AppIcon key={t.id} tool={t} onPress={() => router.push(t.href)} />)}
      </View>
    </Screen>
  );
}
