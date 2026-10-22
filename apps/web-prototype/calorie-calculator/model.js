// Energy-balance model. Mass in kg internally; callers pass/get lb.
// Sources: Mifflin-St Jeor BMR; ACSM walking equation (steps); Hall et al., Lancet 2011
// (fat/lean energy densities, Forbes partition, adaptive thermogenesis); Deurenberg 1991 (body-fat estimate).
const LB = 0.453592;
const RHO_FAT = 9440, RHO_LEAN = 1816; // kcal per kg of fat / lean tissue
const FORBES_C = 10.4;                 // kg; lean share of change = C / (C + fat mass)
const BETA_AT = 0.14;                  // adaptive thermogenesis: expenditure drops 14% of the intake cut
const TEF = 0.1;                       // thermic effect of food
const NEAT_BASE = 0.1;                 // non-walking daily living, as a fraction of BMR
// ponytail: glycogen+water driven by deficit size, not carbs (no carb data). Upgrade if macros get logged.
const GLY_MAX = 2, GLY_TAU = 4, GLY_KCAL = 1000; // up to 2 kg (~4.4 lb), 4-day time constant, ~1000 kcal/kg incl. water

const heightCm = p => (p.ft * 12 + +p.in) * 2.54;
const bmr = (kg, p) => 10 * kg + 6.25 * heightCm(p) - 5 * p.age + (p.sex === 'm' ? 5 : -161);
// ACSM: net walking cost 0.1 ml O2/kg/m ≈ 0.0005 kcal/kg/m. Stride ≈ 0.415 × height (men), 0.413 (women).
const stepKcal = (kg, p) => 0.0005 * kg * heightCm(p) / 100 * (p.sex === 'm' ? 0.415 : 0.413) * (+p.steps || 0);
// Everything you burn except digesting food.
const baseBurn = (kg, p) => bmr(kg, p) * (1 + NEAT_BASE) + stepKcal(kg, p) + (+p.exercise || 0);
// Intake at which you'd hold weight (expenditure = intake, TEF included).
const maintenance = (kg, p) => baseBurn(kg, p) / (1 - TEF);
const bodyFatPct = (kg, p) => +p.bf || 1.2 * kg / (heightCm(p) / 100) ** 2 + 0.23 * p.age - (p.sex === 'm' ? 10.8 : 0) - 5.4;

// Day-by-day simulation. intakeFor(i) = kcal eaten on day i. Returns lb for days 0..days.
function simulate(startLb, p, days, intakeFor) {
  const W0 = startLb * LB, I0 = maintenance(W0, p);
  let F = W0 * bodyFatPct(W0, p) / 100, L = W0 - F, G = 0;
  const out = [startLb];
  for (let i = 0; i < days; i++) {
    const I = intakeFor(i), W = F + L + G;
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
// points: [{x: ms, y: lb}] sorted by x. Returns one point per day.
function trend(points) {
  const out = [];
  let ema;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[i + 1] || a;
    const n = Math.max(1, Math.round((b.x - a.x) / 864e5));
    for (let d = 0; d < (b === a ? 1 : n); d++) {
      const y = a.y + (b.y - a.y) * d / n;
      ema = ema === undefined ? y : ema + 0.1 * (y - ema);
      out.push({ x: a.x + d * 864e5, y: ema });
    }
  }
  return out;
}

if (typeof module !== 'undefined') module.exports = { LB, bmr, stepKcal, baseBurn, maintenance, bodyFatPct, simulate, trend, TEF, NEAT_BASE };
