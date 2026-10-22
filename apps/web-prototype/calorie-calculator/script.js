// name: [kcal, image in img/, category]. kcal null = the shake, set under Food.
// Chick-fil-A: chick-fil-a.com (official) where readable, else MyFoodDiary.
// Panda: pandaexpress.com/nutritioninformation (official, Oct 2026). Base = 12 oz.
// ponytail: checked Oct 2026; edit here if the menu changes
const FOODS = {
  'Chick-fil-A': {
    'Chicken Sandwich': [420, 'cfa-sandwich.png', 'entree'],
    'Spicy Chicken Sandwich': [450, 'cfa-spicy-sandwich.png', 'entree'],
    'Deluxe Sandwich': [490, 'cfa-deluxe.png', 'entree'],
    'Spicy Deluxe Sandwich': [540, 'cfa-spicy-deluxe.png', 'entree'],
    'Grilled Chicken Sandwich': [390, 'cfa-grilled-sandwich.png', 'entree'],
    'Grilled Chicken Club': [520, 'cfa-grilled-club.png', 'entree'],
    'Nuggets (8 ct)': [250, 'cfa-nuggets.png', 'entree'],
    'Nuggets (12 ct)': [380, 'cfa-nuggets.png', 'entree'],
    'Grilled Nuggets (8 ct)': [130, 'cfa-grilled-nuggets.png', 'entree'],
    'Grilled Nuggets (12 ct)': [200, 'cfa-grilled-nuggets.png', 'entree'],
    'Chick-n-Strips (3 ct)': [310, 'cfa-strips.png', 'entree'],
    'Chick-n-Strips (4 ct)': [410, 'cfa-strips.png', 'entree'],
    'Grilled Cool Wrap (no dressing)': [350, 'cfa-cool-wrap.png', 'entree'],
    'Waffle Fries (S)': [320, 'cfa-waffle-fries.png', 'side'],
    'Waffle Fries (M)': [420, 'cfa-waffle-fries.png', 'side'],
    'Waffle Fries (L)': [600, 'cfa-waffle-fries.png', 'side'],
    'Mac & Cheese (M)': [450, 'cfa-mac-cheese.png', 'side'],
    'Kale Crunch Side': [120, 'cfa-kale-crunch.png', 'side'],
    'Fruit Cup (M)': [70, 'cfa-fruit-cup.png', 'side'],
    'Chick-fil-A Sauce': [140, 'cfa-cfa-sauce.png', 'sauce'],
    'Polynesian Sauce': [110, 'cfa-polynesian.png', 'sauce'],
    'Garden Herb Ranch Sauce': [140, 'cfa-garden-herb-ranch.png', 'sauce'],
    'Sweet Tea (M)': [120, 'cfa-sweet-tea.png', 'drink'],
    'Unsweet Tea (M)': [0, 'cfa-sweet-tea.png', 'drink'],
    'Lemonade (M)': [220, 'cfa-lemonade.png', 'drink'],
    'Diet Lemonade (M)': [50, 'cfa-lemonade.png', 'drink'],
    'Bottled Water': [0, 'cfa-water.png', 'drink'],
  },
  // Missing panda-*.jpg files show a placeholder; save official photos under these names.
  'Panda Express': {
    'Orange Chicken': [560, 'panda-orange-chicken.jpg', 'entree'],
    'Black Pepper Chicken': [200, 'panda-black-pepper-chicken.jpg', 'entree'],
    'Kung Pao Chicken': [270, 'panda-kung-pao-chicken.jpg', 'entree'],
    'Grilled Teriyaki Chicken': [280, 'panda-teriyaki-chicken.jpg', 'entree'],
    'Mushroom Chicken': [180, 'panda-mushroom-chicken.jpg', 'entree'],
    'Honey Sesame Chicken Breast': [420, 'panda-honey-sesame-chicken.jpg', 'entree'],
    'String Bean Chicken Breast': [210, 'panda-string-bean-chicken.jpg', 'entree'],
    'SweetFire Chicken Breast': [360, 'panda-sweetfire-chicken.jpg', 'entree'],
    'Beijing Beef': [480, 'panda-beijing-beef.jpg', 'entree'],
    'Broccoli Beef': [190, 'panda-broccoli-beef.jpg', 'entree'],
    'Black Pepper Sirloin Steak': [200, 'panda-black-pepper-steak.jpg', 'entree'],
    'Honey Walnut Shrimp': [340, 'panda-honey-walnut-shrimp.jpg', 'entree'],
    'Eggplant Tofu': [310, 'panda-eggplant-tofu.jpg', 'entree'],
    'Super Greens (entree)': [45, 'panda-super-greens.jpg', 'entree'],
    'Chow Mein': [520, 'panda-chow-mein.jpg', 'base'],
    'Chow Fun': [580, 'panda-chow-fun.jpg', 'base'],
    'Fried Rice': [610, 'panda-fried-rice.jpg', 'base'],
    'White Steamed Rice': [570, 'panda-white-rice.jpg', 'base'],
    'Quinoa Fried Rice': [600, 'panda-quinoa-fried-rice.jpg', 'base'],
    'Super Greens': [180, 'panda-super-greens.jpg', 'base'],
    'Chicken Egg Roll': [200, 'panda-egg-roll.jpg', 'appetizer'],
    'Chicken Potstickers (3)': [160, 'panda-potstickers.jpg', 'appetizer'],
    'Cream Cheese Rangoon (3)': [190, 'panda-rangoon.jpg', 'appetizer'],
    'Veggie Spring Roll (2)': [240, 'panda-spring-roll.jpg', 'appetizer'],
    'Hot & Sour Soup (cup)': [140, 'panda-hot-sour-soup.jpg', 'appetizer'],
    'Hot & Sour Soup (bowl)': [170, 'panda-hot-sour-soup.jpg', 'appetizer'],
  },
  'Morning': { 'Protein Shake': [null, null, 'shake'] },
};
// How each place sells a meal: slots to fill in order, plus optional add-ons.
const ORDERS = {
  'Chick-fil-A': { 'À la carte': null, 'Meal': { slots: ['entree', 'side', 'drink'], extras: 'sauce' } },
  'Panda Express': { 'À la carte': null, 'Bowl': { slots: ['base', 'entree'] }, 'Plate': { slots: ['base', 'entree', 'entree'] }, 'Bigger Plate': { slots: ['base', 'entree', 'entree', 'entree'] } },
};
const ORDER_NAME = { 'Chick-fil-A': 'Chick-fil-A', 'Panda Express': 'Panda' };
const CATS = { entree: 'Entrées', base: 'Bases', side: 'Sides', appetizer: 'Appetizers & soup', drink: 'Drinks', sauce: 'Sauces' };
const SLOT = { entree: 'entrée', base: 'base', side: 'side', drink: 'drink' };
const MEALS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' };

const KEY = 'calorie-calc';
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
const byId = id => document.getElementById(id);

let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch {}
S = { profile: null, logs: {}, weights: {}, view: 'food', brand: 'Chick-fil-A', ...S };
S.shake ??= S.profile?.shake || 160;
// Old entries were {id, qty}; now {meal, name?, parts: [{id, qty}], qty}.
for (const log of Object.values(S.logs)) log.forEach((e, i) => {
  if (e.id) log[i] = { meal: e.id.startsWith('Morning') ? 'breakfast' : 'lunch', parts: [{ id: e.id.replace(' (base)', ''), qty: 1 }], qty: e.qty };
});
const save = () => localStorage.setItem(KEY, JSON.stringify(S));

const food = id => { const [b, n] = id.split('|'); return FOODS[b]?.[n]; };
const kcal = id => {
  const f = food(id);
  if (!f) return 0; // ponytail: renamed/removed items count as 0
  return f[0] ?? S.shake;
};
const entryKcal = e => e.parts.reduce((t, p) => t + kcal(p.id) * p.qty, 0);
const eatenOn = day => (S.logs[day] || []).reduce((t, e) => t + entryKcal(e) * e.qty, 0);

// Energy math lives in model.js (works in kg).
const tdee = (lb, p) => maintenance(lb * LB, p);

function latestWeight() {
  const days = Object.keys(S.weights).sort();
  return days.length ? { day: days.at(-1), lb: S.weights[days.at(-1)] } : { day: today(), lb: +S.profile.weight };
}

// ---- UI ----
const ts = day => new Date(day + 'T00:00').getTime();
const shift = (day, n) => { const d = new Date(day + 'T00:00'); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
const nice = day => day === today() ? 'Today' : new Date(day + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const fmt = n => Math.round(n).toLocaleString();
const icons = () => lucide.createIcons();

// Image well: placeholder icon appears only when there's no image or the file is missing.
function thumb(id, size) {
  const src = food(id)?.[1];
  const photo = src?.endsWith('.jpg');
  return `<div class="relative ${size} bg-white grid place-items-center overflow-hidden shrink-0">
    <span class="ph ${src ? 'hidden' : ''} size-1/3 text-neutral-400"><i data-lucide="${src ? 'utensils' : 'cup-soda'}" class="size-full"></i></span>
    ${src ? `<img src="img/${src}" alt="" loading="lazy" onerror="this.parentElement.querySelector('.ph').classList.remove('hidden');this.remove()" class="absolute inset-0 size-full ${photo ? 'object-cover' : 'object-contain p-[6%]'}">` : ''}
  </div>`;
}

let day = today(), chart, build = null, order = 'À la carte';
let meal = (h => h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snacks')(new Date().getHours());
byId('day').value = byId('w-date').value = day;
if (S.profile) for (const [k, v] of Object.entries(S.profile)) { const f = byId('profile').elements[k]; if (f) f.value = !v && (k === 'bf' || k === 'exercise') ? '' : v; }

function setDay(d) { day = d || today(); byId('day').value = day; render(); }
byId('day').onchange = e => setDay(e.target.value);
byId('prev-day').onclick = () => setDay(shift(day, -1));
byId('next-day').onclick = () => setDay(shift(day, 1));
byId('today-btn').onclick = () => setDay(today());

document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { S.view = b.dataset.view; save(); render(); byId('main').scrollTop = 0; });

// ---- logging ----
function addEntry(e) {
  const log = S.logs[day] ||= [];
  const same = JSON.stringify(e.parts);
  const hit = log.find(x => x.meal === meal && x.name === e.name && JSON.stringify(x.parts) === same);
  if (hit) hit.qty++; else log.push({ meal, qty: 1, ...e });
  save(); render();
}
function stepEntry(i, n) {
  const log = S.logs[day];
  log[i].qty += n;
  if (log[i].qty <= 0) log.splice(i, 1);
  if (!log.length) delete S.logs[day];
  save(); render();
}

// ---- meal builder (Panda bowls/plates, Chick-fil-A meals) ----
const nextEmpty = () => { const i = build.slots.findIndex(s => !s.id); return i < 0 ? null : i; };
function startBuild() {
  const o = ORDERS[S.brand]?.[order];
  build = o && { slots: o.slots.map(cat => ({ cat, qty: 1, id: null })), extras: [], active: 0, half: false };
}
function setHalf(on) {
  const i = build.slots.findIndex(s => s.cat === 'base');
  if (on) build.slots.splice(i, 1, { cat: 'base', qty: .5, id: build.slots[i].id }, { cat: 'base', qty: .5, id: null });
  else build.slots.splice(i, 2, { cat: 'base', qty: 1, id: build.slots[i].id });
  build.half = on; build.active = nextEmpty();
}
function addBuild() {
  const parts = [];
  for (const { id, qty } of [...build.slots, ...build.extras.map(id => ({ id, qty: 1 }))]) {
    const p = parts.find(x => x.id === id);
    if (p) p.qty += qty; else parts.push({ id, qty });
  }
  addEntry({ name: `${ORDER_NAME[S.brand]} ${order}`, parts });
  startBuild(); renderMenu();
}
function tapItem(id) {
  if (!build) return addEntry({ parts: [{ id, qty: 1 }] });
  const cat = food(id)[2];
  if (build.active != null && build.slots[build.active].cat === cat) build.slots[build.active].id = id;
  else if (cat === ORDERS[S.brand][order].extras) build.extras.push(id);
  else return;
  build.active = nextEmpty();
  renderMenu();
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-meal],[data-brand],[data-order],[data-id],[data-slot],[data-extra],[data-step],#build-add,#build-reset');
  if (!t) return;
  const d = t.dataset;
  if (d.meal) { meal = d.meal; render(); }
  else if (d.brand) { S.brand = d.brand; order = 'À la carte'; build = null; save(); renderMenu(); }
  else if (d.order) { order = d.order; startBuild(); renderMenu(); }
  else if (d.id) tapItem(d.id);
  else if (d.slot) { build.active = +d.slot; renderMenu(); }
  else if (d.extra) { build.extras.splice(+d.extra, 1); renderMenu(); }
  else if (d.step) stepEntry(+d.idx, +d.step);
  else if (t.id === 'build-add') addBuild();
  else if (t.id === 'build-reset') { startBuild(); renderMenu(); }
});
document.addEventListener('change', e => {
  if (e.target.id === 'half') { setHalf(e.target.checked); renderMenu(); }
  if (e.target.id === 'shake-kcal') { S.shake = +e.target.value || 0; save(); render(); }
});
byId('search').oninput = renderMenu;

byId('profile').onsubmit = e => {
  e.preventDefault();
  S.profile = Object.fromEntries(new FormData(e.target));
  for (const k of ['age', 'ft', 'in', 'weight', 'goal', 'steps', 'exercise', 'bf']) S.profile[k] = +S.profile[k] || 0;
  save(); render();
  const b = byId('save-profile'); b.textContent = 'Saved'; setTimeout(() => b.textContent = 'Save', 1500);
};

byId('weigh').onsubmit = e => {
  e.preventDefault();
  S.weights[byId('w-date').value] = +byId('w-lb').value;
  byId('w-lb').value = '';
  save(); render();
};
byId('weights').onclick = e => { const d = e.target.closest('[data-del]')?.dataset.del; if (d) { delete S.weights[d]; save(); render(); } };
byId('history').onclick = e => { const d = e.target.closest('[data-day]')?.dataset.day; if (d) { S.view = 'food'; save(); setDay(d); } };

function tile(id, { badge, picked } = {}) {
  const n = id.split('|')[1];
  return `<button data-id="${id}" class="group text-left rounded-box bg-base-100 border ${picked || badge ? 'border-primary' : 'border-base-300'} overflow-hidden hover:border-primary focus-visible:outline-2 active:scale-[.97] transition">
    <div class="relative">${thumb(id, 'aspect-[4/3] w-full')}
      ${badge ? `<span class="badge badge-primary absolute top-2 right-2 num">×${badge}</span>` : ''}
      <span class="absolute bottom-2 right-2 btn btn-circle btn-sm btn-primary opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none" aria-hidden="true"><i data-lucide="plus" class="size-4"></i></span>
    </div>
    <div class="px-3 py-2.5">
      <div class="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5em]">${n}</div>
      <div class="text-xs opacity-60 num mt-0.5">${fmt(kcal(id))} kcal</div>
    </div>
  </button>`;
}
const grid = (title, ids, opts) => ids.length ? `<div><h2 class="text-sm font-semibold opacity-70 mb-3">${title}</h2>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3">${ids.map(id => tile(id, opts?.(id))).join('')}</div></div>` : '';

function renderMenu() {
  const brand = S.brand, orders = ORDERS[brand], q = byId('search').value.trim().toLowerCase();
  document.querySelectorAll('[data-brand]').forEach(b => b.classList.toggle('tab-active', b.dataset.brand === brand));
  byId('meal-picker').innerHTML = Object.entries(MEALS).map(([k, l]) =>
    `<button class="btn btn-sm join-item ${k === meal ? 'btn-primary' : ''}" data-meal="${k}">${l}</button>`).join('');
  byId('order-row').hidden = !orders;
  byId('order-types').innerHTML = orders ? Object.keys(orders).map(o =>
    `<button class="btn btn-sm join-item ${o === order ? 'btn-neutral' : ''}" data-order="${o}">${o}</button>`).join('') : '';
  byId('search').placeholder = `Search ${brand}`;

  const items = cat => Object.keys(FOODS[brand]).filter(n => FOODS[brand][n][2] === cat && n.toLowerCase().includes(q)).map(n => `${brand}|${n}`);
  const count = {};
  for (const e of S.logs[day] || []) for (const p of e.parts) count[p.id] = (count[p.id] || 0) + p.qty * e.qty;

  // Shake: one card with its own calorie setting.
  if (brand === 'Morning') {
    byId('builder').innerHTML = '';
    byId('menu').innerHTML = `<div class="card bg-base-100 border border-base-300 max-w-sm overflow-hidden">
      ${thumb('Morning|Protein Shake', 'aspect-[4/3] w-full')}
      <div class="card-body gap-3">
        <h3 class="card-title text-base">Morning protein shake</h3>
        <label class="floating-label"><span>Calories per shake</span><input id="shake-kcal" type="number" min="0" class="input w-full num" value="${S.shake}" placeholder="Calories per shake"></label>
        <button class="btn btn-primary" data-id="Morning|Protein Shake">Add to ${MEALS[meal]}</button>
      </div></div>`;
    icons(); return;
  }

  if (!build) {
    byId('builder').innerHTML = '';
    byId('menu').innerHTML = Object.keys(CATS).map(c => grid(CATS[c], items(c), id => ({ badge: count[id] }))).join('')
      || `<p class="opacity-60 py-10 text-center">Nothing matches “${q.replace(/[<&"]/g, '')}”.</p>`;
    icons(); return;
  }

  // Builder: slots on top, then the choices for whichever slot is active.
  const o = orders[order], picked = new Set([...build.slots.map(s => s.id), ...build.extras]);
  const total = build.slots.reduce((t, s) => t + (s.id ? kcal(s.id) * s.qty : 0), 0) + build.extras.reduce((t, id) => t + kcal(id), 0);
  const done = build.slots.every(s => s.id);
  const nth = i => { const same = build.slots.filter(s => s.cat === build.slots[i].cat); return same.length > 1 ? ` ${same.indexOf(build.slots[i]) + 1}` : ''; };
  byId('builder').innerHTML = `<div class="card bg-base-100 border border-primary shadow-lg">
    <div class="card-body p-4 gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="font-semibold">${ORDER_NAME[brand]} ${order}</h3>
        ${o.slots.includes('base') ? `<label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" id="half" class="toggle toggle-sm toggle-primary" ${build.half ? 'checked' : ''}>Half &amp; half base</label>` : ''}
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
        ${build.slots.map((s, i) => `<button data-slot="${i}" class="flex items-center gap-2 p-2 rounded-box border text-left ${i === build.active ? 'border-primary bg-white/5' : 'border-base-300'} hover:border-primary">
          ${s.id ? thumb(s.id, 'size-10 rounded-lg') : `<span class="size-10 rounded-lg border border-dashed border-base-content grid place-items-center opacity-40 shrink-0"><i data-lucide="plus" class="size-4"></i></span>`}
          <span class="min-w-0"><span class="block text-xs opacity-60 capitalize">${SLOT[s.cat]}${nth(i)}${s.qty < 1 ? ' (½)' : ''}</span>
          <span class="block text-sm truncate">${s.id ? s.id.split('|')[1] : 'Choose…'}</span></span></button>`).join('')}
      </div>
      ${build.extras.length ? `<div class="flex flex-wrap gap-2">${build.extras.map((id, i) => `<span class="badge badge-outline gap-1">${id.split('|')[1]}<button data-extra="${i}" aria-label="Remove"><i data-lucide="x" class="size-3"></i></button></span>`).join('')}</div>` : ''}
      <div class="flex items-center justify-between gap-3">
        <span class="num text-sm"><b>${fmt(total)}</b> <span class="opacity-60">kcal</span></span>
        <div class="flex gap-2">
          <button id="build-reset" class="btn btn-ghost btn-sm">Clear</button>
          <button id="build-add" class="btn btn-primary btn-sm" ${done ? '' : 'disabled'}>Add to ${MEALS[meal]}</button>
        </div>
      </div>
    </div></div>`;
  const a = build.active;
  byId('menu').innerHTML = (a != null
      ? grid(`Choose ${SLOT[build.slots[a].cat]}${nth(a)}`, items(build.slots[a].cat), id => ({ picked: picked.has(id) }))
      : `<p class="text-sm opacity-60">All set. Tap a slot above to swap something${o.extras ? ', or add sauces below' : ''}.</p>`)
    + (o.extras ? grid(`Add ${CATS[o.extras].toLowerCase()} (optional)`, items(o.extras), id => ({ badge: build.extras.filter(x => x === id).length })) : '');
  icons();
}

function render() {
  const p = S.profile, log = S.logs[day] || [], eaten = eatenOn(day);

  // view switching
  document.querySelectorAll('[data-panel]').forEach(s => s.hidden = s.dataset.panel !== S.view);
  document.querySelectorAll('.nav-btn').forEach(b => {
    const on = b.dataset.view === S.view;
    b.classList.toggle('bg-white/5', on); b.classList.toggle('text-primary', on);
    b.classList.toggle('opacity-70', !on); b.classList.toggle('hover:bg-white/5', !on);
    b.toggleAttribute('aria-current', on);
  });
  document.querySelectorAll('.dock [data-view]').forEach(b => b.classList.toggle('dock-active', b.dataset.view === S.view));

  // header
  const cur = p && latestWeight(), T = p ? tdee(cur.lb, p) : 0, left = T - eaten;
  byId('h-eaten').textContent = fmt(eaten);
  byId('h-budget').textContent = p ? fmt(T) : '–';
  byId('h-left').textContent = p ? fmt(Math.abs(left)) : '–';
  byId('h-left-label').textContent = p && left < 0 ? 'Over' : 'Left';
  byId('h-left').className = `num text-2xl font-semibold ${p ? (left >= 0 ? 'text-success' : 'text-error') : ''}`;
  byId('h-progress').value = p ? Math.min(100, eaten / T * 100) : 0;
  byId('h-progress').classList.toggle('progress-error', !!p && left < 0);

  // food
  renderMenu();
  byId('today-title').textContent = nice(day);
  byId('today-count').textContent = log.length ? `${log.reduce((t, e) => t + e.qty, 0)} items` : '';
  const row = (e, i) => {
    const main = e.parts.find(p => food(p.id)?.[2] !== 'base') || e.parts[0];
    const sub = e.name
      ? e.parts.map(p => `${p.qty === .5 ? '½ ' : p.qty > 1 ? p.qty + '× ' : ''}${p.id.split('|')[1]}`).join(' · ')
      : `${fmt(entryKcal(e))} kcal each`;
    return `<li class="flex items-center gap-3 py-2.5">
      ${thumb(main.id, 'size-11 rounded-lg')}
      <div class="flex-1 min-w-0"><div class="text-sm font-medium truncate">${e.name || e.parts[0].id.split('|')[1]}</div><div class="text-xs opacity-60 num line-clamp-2">${sub}</div></div>
      <div class="flex items-center gap-1">
        <button class="btn btn-ghost btn-xs btn-square" data-step="-1" data-idx="${i}" aria-label="One less"><i data-lucide="minus" class="size-3.5"></i></button>
        <span class="num w-4 text-center text-sm">${e.qty}</span>
        <button class="btn btn-ghost btn-xs btn-square" data-step="1" data-idx="${i}" aria-label="One more"><i data-lucide="plus" class="size-3.5"></i></button>
      </div>
      <span class="num w-11 text-right text-sm font-medium">${fmt(entryKcal(e) * e.qty)}</span>
    </li>`;
  };
  byId('log').innerHTML = Object.entries(MEALS).map(([k, label]) => {
    const rows = log.map((e, i) => [e, i]).filter(([e]) => e.meal === k);
    const sub = rows.reduce((t, [e]) => t + entryKcal(e) * e.qty, 0), on = k === meal;
    return `<section>
      <button data-meal="${k}" class="w-full flex items-baseline justify-between py-1 ${on ? 'text-primary' : ''}">
        <h3 class="font-semibold flex items-center gap-1.5">${label}${on ? '<span class="badge badge-primary badge-xs">adding</span>' : ''}</h3>
        <span class="num text-sm ${on ? '' : 'opacity-60'}">${rows.length ? fmt(sub) : ''}</span></button>
      <ul class="divide-y divide-white/10">${rows.map(([e, i]) => row(e, i)).join('')
        || `<li class="py-2 text-xs opacity-50">${on ? 'Adding here. Pick something from the menu.' : 'Tap to add here.'}</li>`}</ul>
    </section>`;
  }).join('');
  byId('log-total').textContent = `${fmt(eaten)} kcal`;
  byId('deficit-label').textContent = p && left < 0 ? 'Surplus' : 'Deficit';
  byId('log-deficit').textContent = p ? `${fmt(Math.abs(left))} kcal` : 'Set up Body first';
  byId('log-deficit').className = `num font-semibold ${p ? (left >= 0 ? 'text-success' : 'text-error') : 'opacity-60 font-normal'}`;

  // body
  const kg = p && cur.lb * LB, B = p ? bmr(kg, p) : 0;
  byId('b-bmr').textContent = p ? fmt(B) : '–';
  byId('b-tdee').textContent = p ? fmt(T) : '–';
  byId('b-factor').textContent = p ? `kcal/day to hold weight · activity factor ${(T / B).toFixed(2)}` : 'kcal/day to hold weight';
  byId('b-breakdown').innerHTML = p ? [
    ['Resting (BMR)', B], ['Daily living', NEAT_BASE * B], [`Walking (${(+p.steps || 0).toLocaleString()} steps)`, stepKcal(kg, p)],
    ['Workouts', +p.exercise || 0], ['Digesting food', TEF * T],
  ].map(([k, v]) => `<div class="flex justify-between gap-4"><dt class="opacity-70">${k}</dt><dd>${fmt(v)}</dd></div>`).join('') : '';
  byId('b-note').textContent = p
    ? `At ${cur.lb} lb (${!S.weights[cur.day] ? 'starting weight' : cur.day === today() ? "today's weigh-in" : 'weigh-in from ' + nice(cur.day)}), body fat ${bodyFatPct(kg, p).toFixed(0)}%${p.bf ? '' : ' (estimated from BMI)'}. Mifflin–St Jeor for BMR, ACSM walking cost for steps.`
    : 'Fill this in and save to get your BMR and daily budget.';

  // progress
  const wdays = Object.keys(S.weights).sort().reverse();
  byId('weights').innerHTML = wdays.map(d => `<li class="flex items-center justify-between py-2 text-sm">
      <span>${nice(d)}</span><span class="flex items-center gap-2"><span class="num font-medium">${S.weights[d]} lb</span>
      <button class="btn btn-ghost btn-xs btn-square" data-del="${d}" aria-label="Delete weigh-in"><i data-lucide="x" class="size-3.5"></i></button></span></li>`).join('')
    || '<li class="py-6 text-center text-sm opacity-60">No weigh-ins yet.</li>';

  const days = Object.keys(S.logs).sort().reverse();
  byId('history').innerHTML = days.map(d => {
    const x = T - eatenOn(d);
    return `<tr class="hover:bg-base-200 cursor-pointer" data-day="${d}"><td><button class="link link-hover">${nice(d)}</button></td><td class="text-right">${fmt(eatenOn(d))}</td>
      <td class="text-right ${p ? (x >= 0 ? 'text-success' : 'text-error') : ''}">${p ? fmt(x) : '–'}</td></tr>`;
  }).join('') || '<tr><td colspan="3" class="opacity-60 text-center py-6">No days logged yet.</td></tr>';

  icons();
  if (!p) { byId('projection').textContent = 'Fill in Body first, then log food to see your projection.'; return; }
  if (S.view === 'progress') drawProgress(cur, T, days);
}

function drawProgress(cur, T, days) {
  const p = S.profile, now = ts(today());
  // Average intake over finished logged days (today is still in progress unless it's all you have).
  const full = days.filter(d => d !== today());
  const sample = full.length ? full : days;
  const avg = sample.length ? sample.reduce((t, d) => t + eatenOn(d), 0) / sample.length : null;

  const wEntries = Object.entries(S.weights).sort();
  const actual = wEntries.map(([d, lb]) => ({ x: ts(d), y: lb }));
  const trendPts = trend(actual);

  let model = [];
  if (avg === null) {
    byId('projection').textContent = 'Log some food to see the predicted curve.';
  } else {
    // Predicted: start at the first weigh-in or first logged day, feed in what you actually logged,
    // then your average intake for unlogged days, today, and the future.
    const start = [wEntries[0]?.[0], days.at(-1)].filter(Boolean).sort()[0];
    const past = Math.max(0, Math.round((now - ts(start)) / 864e5));
    const pts = simulate(S.weights[start] ?? +p.weight, p, past + 365, i => {
      const d = shift(start, i);
      return d < today() && S.logs[d] ? eatenOn(d) : avg;
    });
    let end = pts.findIndex((y, i) => i > past && y <= p.goal);
    if (end < 0) end = pts.length - 1;
    model = pts.slice(0, end + 1).map((y, i) => ({ x: ts(start) + i * 864e5, y }));

    const ahead = pts[past] - pts[Math.min(past + 14, pts.length - 1)];
    let text = `Eating about <b class="num">${fmt(avg)}</b> kcal/day, the model expects <b class="num">${(ahead / 2).toFixed(1)} lb/week</b> from here. ` +
      (pts[end] <= p.goal
        ? `Goal ${p.goal} lb around <b>${new Date(model.at(-1).x).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</b>.`
        : `You won't reach ${p.goal} lb within a year at this rate (${pts.at(-1).toFixed(1)} lb).`);
    if (trendPts.length > 1) {
      const last = trendPts.at(-1), back = trendPts[Math.max(0, trendPts.length - 15)];
      const spanWk = (last.x - back.x) / 864e5 / 7;
      const diff = last.y - pts[Math.round((last.x - ts(start)) / 864e5)];
      text += ` Your actual trend is ${spanWk ? `<b class="num">${((back.y - last.y) / spanWk).toFixed(1)} lb/week</b> and ` : ''}` +
        (Math.abs(diff) < 0.5 ? 'right on the prediction.'
          : `<b class="num">${Math.abs(diff).toFixed(1)} lb</b> ${diff < 0 ? 'below the prediction (ahead of plan).' : 'above the prediction (behind plan; check portions or activity).'}`);
    }
    byId('projection').innerHTML = text;
  }

  // Theme vars are oklch(); a canvas fillStyle round-trip turns them into hex Chart.js can parse.
  const cx = document.createElement('canvas').getContext('2d');
  const css = v => (cx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(v).trim(), cx.fillStyle);
  const ends = [...actual, ...model].map(pt => pt.x);
  const goalLine = ends.length ? [{ x: Math.min(...ends), y: p.goal }, { x: Math.max(...ends), y: p.goal }] : [];
  const data = { datasets: [
    { label: 'Weigh-ins', data: actual, showLine: false, pointRadius: 3, borderColor: css('--color-base-content'), backgroundColor: css('--color-base-content') },
    { label: 'Actual trend', data: trendPts, borderColor: css('--color-success'), borderWidth: 2.5, pointRadius: 0, tension: .3 },
    { label: 'Predicted', data: model, borderColor: css('--color-info'), borderWidth: 2, pointRadius: 0, tension: .3,
      segment: { borderDash: c => c.p0.parsed.x >= now ? [6, 4] : undefined } },
    { label: 'Goal', data: goalLine, borderColor: css('--color-error'), borderDash: [2, 4], pointRadius: 0 },
  ] };
  if (chart) { chart.data = data; chart.update(); return; }
  Chart.defaults.color = css('--color-base-content');
  Chart.defaults.borderColor = 'rgba(127,127,127,.15)';
  chart = new Chart(byId('chart'), {
    type: 'line', data,
    options: {
      interaction: { mode: 'nearest', intersect: false },
      scales: {
        x: { type: 'linear', ticks: { callback: v => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) } },
        y: { title: { display: true, text: 'lb' } },
      },
      plugins: { tooltip: { callbacks: {
        title: c => new Date(c[0].parsed.x).toLocaleDateString(),
        label: c => `${c.dataset.label}: ${c.parsed.y.toFixed(1)} lb`,
      } } },
    },
  });
}

render();
