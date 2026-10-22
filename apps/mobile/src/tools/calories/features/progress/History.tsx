import { router } from 'expo-router';
import { nice } from '@/tools/calories/lib/dates';
import { totalKcal } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useBudget } from '@/tools/calories/store/derived';
import { useUi } from '@/tools/calories/store/ui';
import { Row } from '@/ui/Row';
import { Section } from '@/ui/Section';
import { useColors } from '@/ui/theme';

const fmt = (n: number) => Math.round(n).toLocaleString();

// Each logged day: eaten and deficit. Tap to open that day in Food.
export function History() {
  const c = useColors();
  const logs = useApp(s => s.logs);
  const shake = useApp(s => s.shake);
  const budget = useBudget();
  const setDay = useUi(s => s.setDay);
  const days = Object.keys(logs).filter(d => logs[d].length).sort().reverse().slice(0, 60);
  if (!days.length) return null;

  return (
    <Section header="History" right="Eaten · Deficit">
      {days.map(d => {
        const eaten = totalKcal(logs[d], shake), deficit = budget == null ? null : budget - eaten;
        return (
          <Row key={d} title={nice(d)} subtitle={`${fmt(eaten)} kcal eaten`}
            value={deficit == null ? '–' : `${deficit >= 0 ? '−' : '+'}${fmt(Math.abs(deficit))}`}
            valueColor={deficit == null ? undefined : deficit >= 0 ? c.green : c.red}
            onPress={() => { setDay(d); router.navigate('/calories'); }} />
        );
      })}
    </Section>
  );
}
