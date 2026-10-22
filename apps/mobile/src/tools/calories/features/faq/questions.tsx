// How It Works: the science behind the numbers, in plain words, with small example graphs.
import { Text } from 'react-native';
import { DAY_MS } from '@/tools/calories/lib/dates';
import { LB, maintenance, planIntake, simulate, trend, type Profile } from '@/tools/calories/lib/model';
import type { Fold } from '@/ui/Accordion';
import { Legend, LineChart, type Series } from '@/ui/LineChart';
import { type, useColors, type Colors } from '@/ui/theme';

// Example person for the graphs, so they read the same for everyone.
const EX: Profile = { sex: 'm', age: 30, ft: 5, in: 10, weight: 210, goal: 180, rate: 1, steps: 7000, exercise: 0, bf: 0 };
const START = Date.UTC(2026, 0, 1);
const daily = (lbs: number[]) => lbs.map((y, i) => ({ x: START + i * DAY_MS, y }));

function P({ children }: { children: string }) {
  const c = useColors();
  return <Text style={[type.subhead, { color: c.label, lineHeight: 21 }]}>{children}</Text>;
}

function Graph({ series }: { series: Series[] }) {
  return (<><LineChart series={series} height={170} unit=" lb" /><Legend series={series} /></>);
}

// The plan bends: water first, then a slow fade as you get lighter and your body saves energy.
function PlanCurve({ c }: { c: Colors }) {
  const plan = simulate(210, EX, 270, (_, lb) => planIntake(lb * LB, EX));
  const rule = plan.map((_, i) => 210 - i / 7);
  return <Graph series={[{ points: daily(plan), color: c.tint, label: 'Model' }, { points: daily(rule), color: c.secondary, dash: '5 5', label: 'Straight 1 lb/wk' }]} />;
}

// Week one: a 750 kcal deficit, split into water/glycogen vs tissue.
function WaterDrop({ c }: { c: Colors }) {
  const m = maintenance(210 * LB, EX);
  const total = simulate(210, EX, 28, () => m - 750);
  const tissueRate = (total[14] - total[28]) / 14;
  return <Graph series={[{ points: daily(total), color: c.tint, label: 'Scale' }, { points: daily(total.map((_, i) => 210 - i * tissueRate)), color: c.orange, dash: '5 5', label: 'Fat + lean only' }]} />;
}

// Noisy daily weigh-ins vs the smoothed trend.
function Smoothing({ c }: { c: Colors }) {
  const scale = Array.from({ length: 42 }, (_, i) => ({ x: START + i * DAY_MS, y: 210 - i * 0.14 + Math.sin(i * 2.3) * 1.2 + Math.cos(i * 0.9) * 0.6 }));
  return <Graph series={[{ points: scale, color: c.secondary, dots: true, label: 'Scale' }, { points: trend(scale), color: c.green, width: 3, label: 'Trend' }]} />;
}

export function useQuestions(): Fold[] {
  const c = useColors();
  return [
    {
      title: 'How is my daily burn worked out?',
      body: <>
        <P>Resting burn (BMR) comes from your age, height, weight and sex using the Mifflin–St Jeor equation, the one dietitians use most.</P>
        <P>On top of that: your steps (each step costs energy based on your weight and stride, from the ACSM walking formula), about 10% for everyday moving around, your workouts, and about 10% for digesting food. Together that’s your maintenance: what you’d eat to stay the same weight.</P>
      </>,
    },
    {
      title: 'How is my daily target set?',
      body: <>
        <P>You pick how fast to lose. The app runs the energy model forward and finds the deficit that loses exactly that much per week at your current weight, then subtracts it from maintenance.</P>
        <P>It never goes below 1,500 kcal for men or 1,200 for women, the usual floor for dieting without a doctor. As you lose weight your maintenance drops, so the target is recalculated every time you weigh in.</P>
      </>,
    },
    {
      title: 'Why isn’t it just 3,500 calories per pound?',
      body: <>
        <P>That rule assumes every pound lost is pure fat. Early on, some of what you lose is lean tissue and water, which hold far fewer calories, so the rule gets the speed wrong. This app uses Kevin Hall’s model (NIH, published in The Lancet in 2011) instead.</P>
      </>,
    },
    {
      title: 'Why does the plan line bend instead of going straight?',
      body: <>
        <P>Two things slow it down over time. A lighter body burns less, and your metabolism adapts: it drops by about 14% of how much you cut. The model includes both, so the line flattens. That’s also why the target keeps updating.</P>
        <PlanCurve c={c} />
      </>,
    },
    {
      title: 'Why do I drop so fast in the first week?',
      body: <>
        <P>Your muscles store sugar (glycogen) with about 3 g of water per gram. A deficit uses it up in the first few days, so the scale drops 2–4 lb of water on top of fat. It’s real, but it doesn’t keep going. The model expects it, so it won’t make you think you’re ahead of plan.</P>
        <WaterDrop c={c} />
      </>,
    },
    {
      title: 'Why does the trend line ignore my daily weigh-ins?',
      body: <>
        <P>Daily weight swings 1–3 lb from water, salt and food in your gut. The trend is a moving average (each day counts 10%), so one salty dinner barely moves it. Weigh in daily if you can; more points make the trend steadier.</P>
        <Smoothing c={c} />
      </>,
    },
    {
      title: 'How do steps change my numbers?',
      body: <>
        <P>Set your usual steps per day on the Body tab. Walking cost depends on your weight and stride (from your height), so the same steps burn more when you’re heavier. Update it if your routine changes.</P>
      </>,
    },
    {
      title: 'What does “Done for the Day” do?',
      body: <>
        <P>It marks the day as fully logged, shows how you did against your target, and counts your streak. You can reopen a day anytime to fix something.</P>
      </>,
    },
    {
      title: 'Where do the calorie numbers come from?',
      body: <>
        <P>The official nutrition pages of Chick-fil-A and Panda Express (October 2026). Panda bases are 12 oz servings.</P>
      </>,
    },
    {
      title: 'Where is my data kept?',
      body: <>
        <P>Only on this device. If you turn on backup in the Body tab, a copy goes to a hidden app folder in your own Google Drive. There’s no server.</P>
      </>,
    },
    {
      title: 'Sources',
      body: <>
        <P>Hall KD et al. Quantification of the effect of energy imbalance on bodyweight. Lancet, 2011.</P>
        <P>Mifflin MD, St Jeor ST et al. A new predictive equation for resting energy expenditure. Am J Clin Nutr, 1990.</P>
        <P>ACSM’s Guidelines for Exercise Testing and Prescription: walking equation.</P>
        <P>Deurenberg P et al. Body mass index as a measure of body fatness. Br J Nutr, 1991 (body fat estimate).</P>
        <P>Forbes GB. Body fat content influences the body composition response to nutrition and exercise. Ann NY Acad Sci, 2000.</P>
      </>,
    },
  ];
}
