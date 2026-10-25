# Brief for chain scrapers (shared by every agent)

Working dir: `packages/food-data` (Node 22, ESM). Read `README.md`, `lib.mjs` and `sources/off.mjs` first; they define the output shape and helpers. Do not touch `lib.mjs`, `build.mjs`, `scrape.mjs`, `raw/off.json` or anything outside `sources/chains/` and `raw/<your chain>.json`. Playwright + Chromium are installed (`import { browser } from '../../lib.mjs'`). Never git commit.

For each chain assigned to you, write `sources/chains/<id>.mjs` exporting `async function scrape()` that returns `save('<id>', { places: [place], items })` (from `lib.mjs`), then run `node scrape.mjs <id>` and sanity-check `raw/<id>.json`.

## Where the data comes from

The chain's own site, its nutrition calculator, its ordering site (`order.<chain>.com`, often an easier JSON API), or an official nutrition PDF, in that order of preference. Probe with `curl -s -A "<Chrome UA>" <url>` first; if it is 403 or a JS shell, use `browser()` from lib.mjs: open the page, and either read the rendered DOM (`page.$$eval`) or capture the JSON XHRs (`page.on('response', ...)` then filter by URL / content-type) and parse those. A JSON API found that way may then work with plain `get()` plus the headers the browser sent. Cache raw responses through `get()` where possible so re-runs are cheap. Be polite: ≤ 2 requests/second, reuse one browser.

Macros come from the chain. Do not invent numbers. If an item has calories but no macros, skip it. If the chain has no reachable nutrition data at all, say so in your report and move on.

## What to keep

A simple person's menu: the real items people order, in the size they order. Entrees, sandwiches, burgers, bowls, wraps, sides, desserts, breakfast items, drinks (one or two common sizes: Medium, or Small + Large), sauces/dressings. Skip: kids' meals, catering, limited-time test items, every size of every drink, "Build your own" permutations, allergen-only rows, items with no calories.

Sizes go in the name in parentheses the way the app already does: `Waffle Fries (M)`, `Nuggets (8 ct)`, `Sweet Tea (L)`. For a build-your-own chain (Chipotle, Subway, Cava, Sweetgreen) the items are the components (proteins, bases, toppings, sauces) with their own macros, plus the popular fixed items if the chain publishes them.

- `category`: `entree`, `side`, `drink`, `sauce`, `dessert`, `breakfast`, `appetizer`, `base` (rice, tortilla, bread, lettuce base). Build-your-own toppings are `side`.
- `kcal`, `p`, `c`, `f` in grams, `na` sodium mg, all per the item as sold. `serving` is the chain's serving text if any, `grams` its weight if any.
- `image`: the chain's product photo URL (full size, not a 50px thumb). Most items should have one. Items without a photo are fine, the app shows an icon.
- `id` defaults to `<place>-<slug(name)>`; let `item()` make it. Ids must be stable, so prefer the chain's canonical item name.
- `place`: `{ id, name, kind: 'fast', orders }`. `orders` is how the chain sells a meal, keys are what the menu board calls them, slots filled in order with items of that category, `extras` one category or an array of categories that can be added on top (sauces, toppings), `null` = à la carte. Examples:
  - McDonald's: `{ 'À la carte': null, Meal: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } }`
  - Chipotle: `{ 'À la carte': null, Bowl: { slots: ['base', 'base', 'entree'], extras: ['side', 'sauce'] }, Burrito: { slots: ['base', 'base', 'base', 'entree'], extras: ['side', 'sauce'] } }` (tortilla is a `base` item)
  - Subway: `{ 'À la carte': null, '6" Sub': { slots: ['base', 'entree'], extras: ['side', 'sauce'] }, Footlong: { ... } }` (bread is `base`)
  Only define orders the chain really sells; a sandwich shop with no combos just has `'À la carte': null`. Keep it to the one or two ways most people order.

## Chain ids

Use exactly these place ids: mcd, panda, starbucks, kfc, panera, dq, chipotle, tacobell, wendys, subway, bk, popeyes, dunkin, sonic, arbys, culvers, wingstop, jerseymikes, jimmyjohns, canes, fiveguys, shakeshack, innout, whataburger, jackinbox, sweetgreen, cava, qdoba, wawa, sheetz, 7eleven, farmersfridge, dominos, costco.

## Check before you report

`node -e "const d=require('./raw/<id>.json'); ..."`: count per category, min/max kcal, no NaN, a Big-Mac-sized sanity check against a number you know, and `curl -sI` two image URLs return 200 with an image content-type. Then report, per chain: source used (URL), item count, images count, anything skipped or doubtful, in a few lines. No essays.
