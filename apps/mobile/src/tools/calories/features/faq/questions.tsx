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

// The plateau: the same calories every day curve flat; a target that drops as you lose keeps going.
function PlanCurve({ c }: { c: Colors }) {
  const plan = simulate(210, EX, 365, (_, lb) => planIntake(lb * LB, EX));
  const fixed = planIntake(210 * LB, EX);
  const same = simulate(210, EX, 365, () => fixed);
  return <Graph series={[{ points: daily(plan), color: c.tint, label: 'Target drops as you lose' }, { points: daily(same), color: c.orange, dash: '2 4', label: `Always ${Math.round(fixed).toLocaleString()} kcal` }]} />;
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
      title: 'How does the app know how much I burn?',
      body: <>
        <P>Your body burns energy all day, even when you rest. The app guesses that from your age, height, weight and sex. That part is called BMR.</P>
        <P>Then it adds your steps, everyday moving around, your workouts, and the energy it takes to digest food. All together, that’s your maintenance: how much you can eat and stay the same weight.</P>
      </>,
    },
    {
      title: 'How is my daily target picked?',
      body: <>
        <P>You choose how many pounds to lose each week. The app works out how much less than maintenance you need to eat to lose exactly that. That number is your target.</P>
        <P>It never goes below 1,500 calories for men or 1,200 for women. Eating less than that without a doctor isn’t safe.</P>
      </>,
    },
    {
      title: 'How fast should I lose weight?',
      body: <>
        <P>Slow and steady keeps your muscle and is easier to stick with. A good pace is about half a percent to three quarters of a percent of your body weight each week. For someone who weighs 200 lb, that’s 1 to 1.5 lb a week.</P>
        <P>The slider marks this as Gentle, Recommended or Fast, and it won’t go past 1% a week. If you pick Fast, eat plenty of protein and keep lifting weights.</P>
      </>,
    },
    {
      title: 'What do the rings on the Food tab mean?',
      body: <>
        <P>Like Apple’s activity rings, each ring fills up as you eat. The outside ring is calories. The middle one is protein. The inside one is carbs. Fat is listed next to them.</P>
        <P>Protein matters most when you’re losing weight because it keeps your muscles. Your protein goal is about 0.8 grams for every pound of your goal weight. Fat gets 30% of your calories, and carbs get the rest.</P>
        <P>Try to close the protein ring and stay inside the calorie ring.</P>
      </>,
    },
    {
      title: 'Why isn’t it just “3,500 calories = 1 pound”?',
      body: <>
        <P>That old rule pretends every pound you lose is fat. But at first, some of it is water and a little is muscle, and those weigh more for fewer calories. So the rule gets your speed wrong. This app uses a better science model from the National Institutes of Health.</P>
      </>,
    },
    {
      title: 'What’s a plateau, and how does the app handle it?',
      body: <>
        <P>A plateau is when your weight stops going down even though you’re doing the same thing.</P>
        <P>Here’s why it happens. A smaller body burns fewer calories, about 7 less per day for every pound you lose. Your body also slows down a bit to save energy. So if you keep eating the same amount, the gap between what you eat and what you burn shrinks until it’s gone.</P>
        <P>The app fixes this by lowering your target as you lose weight, so you keep going. On Goals, tap “Same kcal” to see what would happen if you didn’t lower it. The orange line flattens out.</P>
        <PlanCurve c={c} />
        <P>A flat week or two is usually just water, not a real plateau. If your green trend line stays flat for 3 weeks while you’re under your target, check your portions.</P>
      </>,
    },
    {
      title: 'Why do I lose so much the first week?',
      body: <>
        <P>Your muscles store a kind of sugar along with water. When you start eating less, your body uses up that sugar, and the water goes with it. That can be 2 to 4 pounds in the first few days. It’s real, but it doesn’t keep happening, so don’t expect that speed every week.</P>
        <WaterDrop c={c} />
      </>,
    },
    {
      title: 'Why doesn’t the trend line follow every weigh-in?',
      body: <>
        <P>Your weight goes up and down 1 to 3 pounds a day from water, salt and food in your stomach. The green “Yours” line smooths that out so you can see where you’re really heading.</P>
        <Smoothing c={c} />
      </>,
    },
    {
      title: 'What’s the salt water number?',
      body: <>
        <P>Salty food makes your body hold on to extra water. A big Panda Express day can add about a pound on the scale the next morning. That’s water, not fat, and it leaves over the next few days.</P>
        <P>The app adds up the sodium you logged. When you’ve had more than 2,300 mg a day lately, it shows about how much of your weigh-in is salt water, and what you’d weigh without it.</P>
      </>,
    },
    {
      title: 'Why weigh in every day?',
      body: <>
        <P>One weigh-in tells you very little because of all the daily ups and downs. Lots of weigh-ins make the trend line smooth and honest. Weigh in at the same time each morning, after the bathroom and before breakfast.</P>
      </>,
    },
    {
      title: 'How do steps count?',
      body: <>
        <P>On the Body tab you set a normal week of steps. The app uses the average. If you change it, the change counts from that day on, so your past doesn’t get rewritten.</P>
        <P>More steps means you burn more, so your daily target goes up.</P>
      </>,
    },
    {
      title: 'What does “Done for the Day” do?',
      body: <>
        <P>It closes the day early: you see how you did and the streak ticks up right away. You don’t have to press it. Any day you logged food closes on its own at midnight and counts the same.</P>
        <P>Your streak counts closed days in a row. Today doesn’t break it until the day is over. To fix an old day, tap it in the week strip and edit it there.</P>
      </>,
    },
    {
      title: 'Why did my goal date move?',
      body: <>
        <P>The app uses what you really ate instead of your target, and today counts as you log. Days under your target move your goal date closer. Days over push it back. Days with nothing logged count as on target.</P>
      </>,
    },
    {
      title: 'How do awards work?',
      body: <>
        <P>You earn medals for streaks, days on target, weigh-ins and pounds lost, just like in Apple Fitness. Tap the flame on the Food tab to see them all, including the ones you’re close to.</P>
      </>,
    },
    {
      title: 'Where do the food numbers come from?',
      body: <>
        <P>From the official nutrition pages of Chick-fil-A and Panda Express. A few sizes, like 12-count nuggets and large fries, are worked out from the official size. Panda’s sodium comes from a copy of its chart, since its site can’t be read directly.</P>
      </>,
    },
    {
      title: 'Where is my data kept?',
      body: <>
        <P>Only on your phone. If you turn on backup, a copy goes to a hidden folder in your own Google Drive. Nobody else can see it.</P>
      </>,
    },
    {
      title: 'Sources',
      body: <>
        <P>Hall KD et al. Quantification of the effect of energy imbalance on bodyweight. Lancet, 2011.</P>
        <P>Mifflin MD, St Jeor ST et al. A new predictive equation for resting energy expenditure. Am J Clin Nutr, 1990.</P>
        <P>ACSM’s Guidelines for Exercise Testing and Prescription: walking equation.</P>
        <P>Deurenberg P et al. Body mass index as a measure of body fatness. Br J Nutr, 1991.</P>
        <P>Forbes GB. Body fat content influences the body composition response to nutrition and exercise. Ann NY Acad Sci, 2000.</P>
      </>,
    },
  ];
}
