import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useCards } from '@/tools/unrot/data/catalog';
import { TasteSection } from '@/tools/unrot/features/TasteSection';
import { todayCount, useUnrot } from '@/tools/unrot/store/app';
import { confirm } from '@/ui/confirm';
import { Row } from '@/ui/Row';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';
import { Segmented } from '@/ui/Segmented';
import { space, useColors } from '@/ui/theme';

const LIMITS: ['15' | '25' | '40' | '0', string][] = [['15', '15'], ['25', '25'], ['40', '40'], ['0', 'No limit']];

// Your taste, your limits, your data.
export default function YouScreen() {
  const c = useColors();
  const cards = useCards().length;
  const limit = useUnrot(s => s.limit);
  const seen = useUnrot(s => Object.keys(s.seen).length);
  const today = todayCount(useUnrot(s => s.today));
  const st = useUnrot.getState;
  const chevron = <Ionicons name="chevron-forward" size={18} color={c.tertiary} />;
  return (
    <Screen title="You" back="Apps">
      <Section>
        <Row title="Today" value={`${today.count} card${today.count === 1 ? '' : 's'}`} />
        <Row title="Read so far" value={`${seen} of ${cards}`} />
      </Section>
      <TasteSection />
      <Section>
        <Row title="Change topics" onPress={() => router.push('/unrot/welcome')} right={chevron} />
        <Row title="Show the gesture guide" onPress={() => { st().setCoached(false); router.navigate('/unrot'); }} right={chevron} />
      </Section>
      <Section header="Daily limit" footer="Reels never end. Unrot stops you after this many cards a day, with an option for ten more.">
        <View style={{ padding: space.md }}>
          <Segmented inline options={LIMITS} value={String(limit) as (typeof LIMITS)[number][0]} onChange={v => st().setLimit(Number(v))} />
        </View>
      </Section>
      <Section header="Sync" footer="Likes, saves and your taste sync with your account, like the rest of the app.">
        <Row title="Account and sync" onPress={() => router.push('/account')} right={chevron} />
      </Section>
      <Section header="Start over">
        <Row title="Reset my taste" tint onPress={async () => {
          if (await confirm('Reset your taste?', 'The feed forgets what you like and starts again from your topics.', 'Reset')) st().resetTaste();
        }} />
        <Row title="Forget what I’ve read" tint onPress={async () => {
          if (await confirm('Forget what you’ve read?', 'Cards you’ve seen or swiped away can show up again. Saved and liked cards stay.', 'Forget')) st().clearHistory();
        }} />
      </Section>
    </Screen>
  );
}
