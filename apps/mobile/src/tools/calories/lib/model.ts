// Energy-balance model, ported 1:1 from apps/web-prototype/calorie-calculator/model.js.
// Mass in kg internally; callers pass/get lb.
// Sources: Mifflin-St Jeor BMR; ACSM walking equation (steps); Hall et al., Lancet 2011
// (fat/lean energy densities, Forbes partition, adaptive thermogenesis); Deurenberg 1991 (body-fat estimate).

export type Profile = {
  sex: 'm' | 'f';
  age: number;
  ft: number;
  in: number;
  weight: number; // starting weight, lb
  goal: number; // lb
  rate: number; // planned loss, lb/week
  steps: number; // average per day
  exercise: number; // workout kcal per day
  bf: number; // body fat %, 0 = estimate
};

export type Point = { x: number; y: number }; // x = ms timestamp, y = lb

export const LB = 0.453592;
const RHO_FAT = 9440, RHO_LEAN = 1816; // kcal per kg of fat / lean tissue
const FORBES_C = 10.4; // kg; lean share of change = C / (C + fat mass)
const BETA_AT = 0.14; // adaptive thermogenesis: expenditure drops 14% of the intake cut
export const TEF = 0.1; // thermic effect of food
export const NEAT_BASE = 0.1; // non-walking daily living, as a fraction of BMR
// ponytail: glycogen+water driven by deficit size, not carbs (no carb data). Upgrade if macros get logged.
const GLY_MAX = 2, GLY_TAU = 4, GLY_KCAL = 1000; // up to 2 kg (~4.4 lb), 4-day time constant, ~1000 kcal/kg incl. water
const DAY = 864e5;

const heightCm = (p: Profile) => (p.ft * 12 + p.in) * 2.54;
export const bmr = (kg: number, p: Profile) => 10 * kg + 6.25 * heightCm(p) - 5 * p.age + (p.sex === 'm' ? 5 : -161);
// ACSM: net walking cost 0.1 ml O2/kg/m ≈ 0.0005 kcal/kg/m. Stride ≈ 0.415 × height (men), 0.413 (women).
export const stepKcal = (kg: number, p: Profile) => 0.0005 * kg * heightCm(p) / 100 * (p.sex === 'm' ? 0.415 : 0.413) * (p.steps || 0);
// Everything you burn except digesting food.
export const baseBurn = (kg: number, p: Profile) => bmr(kg, p) * (1 + NEAT_BASE) + stepKcal(kg, p) + (p.exercise || 0);
// Intake at which you'd hold weight (expenditure = intake, TEF included).
export const maintenance = (kg: number, p: Profile) => baseBurn(kg, p) / (1 - TEF);
// Common floor for dieting without a doctor.
export const MIN_KCAL = { m: 1500, f: 1200 };
export const bodyFatPct = (kg: number, p: Profile) =>
  p.bf || 1.2 * kg / (heightCm(p) / 100) ** 2 + 0.23 * p.age - (p.sex === 'm' ? 10.8 : 0) - 5.4;

// Day-by-day simulation. intakeFor(i, lb) = kcal eaten on day i at that day's weight. Returns lb for days 0..days.
export function simulate(startLb: number, p: Profile, days: number, intakeFor: (day: number, lb: number) => number): number[] {
  const W0 = startLb * LB, I0 = maintenance(W0, p);
  let F = W0 * bodyFatPct(W0, p) / 100, L = W0 - F, G = 0;
  const out = [startLb];
  for (let i = 0; i < days; i++) {
    const W = F + L + G, I = intakeFor(i, W / LB);
    const E = baseBurn(W, p) + TEF * I + BETA_AT * (I - I0);
    const dG = (-GLY_MAX * Math.min(1, Math.max(0, (I0 - I) / 1000)) - G) / GLY_TAU;
    const tissue = I - E - dG * GLY_KCAL; // burning glycogen covers part of the gap
    const pLean = FORBES_C / (FORBES_C + F);
    L += pLean * tissue / RHO_LEAN;
    F += (1 - pLean) * tissue / RHO_FAT;
    G += dG;
    out.push((F + L + G) / LB);
  }
  return out;
}

// Smoothed trend (Hacker's Diet style): fill daily gaps linearly, then EMA with α = 0.1.
// points sorted by x. Returns one point per day.
export function trend(points: Point[]): Point[] {
  const out: Point[] = [];
  let ema: number | undefined;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[i + 1] ?? a;
    const n = Math.max(1, Math.round((b.x - a.x) / DAY));
    for (let d = 0; d < (b === a ? 1 : n); d++) {
      const y = a.y + (b.y - a.y) * d / n;
      ema = ema === undefined ? y : ema + 0.1 * (y - ema);
      out.push({ x: a.x + d * DAY, y: ema });
    }
  }
  return out;
}

// Daily deficit that loses p.rate lb/week by this model. Not the 3,500 kcal/lb rule: early loss is partly lean
// tissue, which holds fewer calories, so the rule overshoots. Loss is ~linear in the deficit, so probe 500 kcal
// once and scale; days 14–28 skip the early water drop.
export function planDeficit(kg: number, p: Profile): number {
  const m = maintenance(kg, p);
  const lbs = simulate(kg / LB, p, 28, () => m - 500);
  return (500 * p.rate) / ((lbs[14] - lbs[28]) / 2);
}

// What to eat for the planned rate, never under the floor.
export const planIntake = (kg: number, p: Profile) => Math.max(MIN_KCAL[p.sex], maintenance(kg, p) - planDeficit(kg, p));
