import { router } from 'expo-router';
import { View } from 'react-native';
import { TOOLS } from '@/tools/registry';
import { AppIcon } from '@/ui/AppIcon';
import { Row } from '@/ui/Row';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';
import { space } from '@/ui/theme';

// Home: every tool as an app icon, plus a list with what each one does.
export default function Launcher() {
  return (
    <Screen title="Random Useful Shit">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, paddingHorizontal: space.xl }}>
        {TOOLS.map(t => <AppIcon key={t.id} tool={t} onPress={() => router.push(t.href)} />)}
      </View>
      <Section header="Tools">
        {TOOLS.map(t => <Row key={t.id} title={t.title} subtitle={t.blurb} onPress={() => router.push(t.href)} />)}
      </Section>
    </Screen>
  );
}
