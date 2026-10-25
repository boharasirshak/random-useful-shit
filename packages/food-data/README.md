# food-data

The food database for the Calorie Tracker in `apps/mobile`: what an average person buys and eats, ready to eat, with a photo and full macros. Convenience-store and grocery products (Open Food Facts), fast-food chains (their own sites), and a short list of unbranded staples (USDA). Not a nutrition encyclopedia: no raw ingredients by the gram, no regional one-offs.

## Requirements

Node.js 22+. `npm install` (Playwright, for the chain sites that block plain fetches), then `npx playwright install chromium` once. Python 3 with Pillow (`images.py` shrinks the photos) and pypdf (`pip3 install --user pillow pypdf`; the chains that publish a nutrition PDF are read with it). Farmer's Fridge uses macOS Vision OCR on the label images.

## Run

```sh
npm run scrape            # every source → raw/<source>.json (slow; honours cache/ so re-runs are cheap)
node scrape.mjs off mcd   # just those sources
npm run build             # raw/*.json → out/foods.json, out/places.json, out/popular.json, out/images/
```

`raw/` is committed, so `build` works offline. `out/` and `cache/` are not: `build` fetches each item's photo into `cache/img/` and writes a 240px JPEG to `out/images/<id>.jpg`. `node export.mjs` puts the popular subset and its photos into the app (`src/tools/calories/data/catalog.ts`, `assets/menu/catalog/`). `node upload.mjs` puts the full set on UploadThing (`UPLOADTHING_TOKEN` in `.env` here or at the repo root; `uploaded.json` remembers what's up so re-runs send only changes) and prints the `EXPO_PUBLIC_FOOD_DATA_URL` the app wants in its `.env`; the app downloads `foods.json` from there on demand, photos by URL.

## Shape

`raw/<source>.json`:

```
{ source, fetched: 'YYYY-MM-DD',
  places: [{ id, name, kind: 'fast' | 'store' | 'home', orders?: { [orderName]: { slots: category[], extras?: category } | null } }],
  items:  [{ id, place, name, category, kcal, p, c, f, na, serving?, grams?, image?, brand?, barcode? }] }
```

- `id` is `<place>-<slug(name)>` and never changes once shipped: logs store ids.
- `kcal`, `p`, `c`, `f` (g) and `na` (mg) are **per serving as sold**: one sandwich, one bottle, one bowl. `serving` says what that is ("1 bottle (12 fl oz)"), `grams` its weight when known.
- `category` is one of `lib.mjs` `CATEGORIES`. Chains use entree/side/drink/sauce/dessert/breakfast/appetizer/base; stores use snack/drink/dairy/meat/frozen/bakery/produce/pantry/meal/protein/dessert.
- `orders` is how a place sells a meal (Panda Bowl = base + entree; Chipotle Bowl = base + entree + toppings), the same shape as `ORDERS` in the app. `null` = à la carte.
- `image` is the source URL; `build` fetches it.

## Sources

| source | what | how |
|---|---|---|
| `off` | US packaged products (convenience store, grocery), most-scanned first | Open Food Facts API v2 (ODbL; photos CC BY-SA). US/Canada barcodes only; sliced per category because anonymous search stops at 1,000 results |
| `usda` | unbranded staples (chicken thigh, rice, eggs, milk, a slice of pizza) | USDA FoodData Central bulk JSON: SR Legacy + FNDDS, at the portion a person logs. No photos |
| `chains/<id>` | one fast-food chain | its own menu site, ordering API, nutrition calculator or nutrition PDF; Playwright where the site blocks plain fetches. `chains/_shared/` has the PDF reader and the Inspire/Nutritionix helpers |
| `ffn` | McDonald's, KFC, Dairy Queen, Subway | fastfoodnutrition.org, which republishes the chains' published tables, because those four sites block automated browsers outright (Akamai, DataDome, Cloudflare). `FFN_CHAINS=subway node scrape.mjs ffn` for one |

Not in: Wawa and 7-Eleven (nutrition only behind an Incapsula-blocked calculator) and Costco (publishes none). In-N-Out blocks everything, so it reads the Internet Archive's copy of the chain's own nutrition page. Panda Express stays on the hand-typed list in the app (`data/menu.ts`): pandaexpress.com serves a captcha and the aggregator's Panda numbers are older than the ones already in the app. Panera's photo CDN only answers a real browser, so its items have no photo in `out/`.

`BRIEF.md` is the brief the chain scrapers were written to; read it before adding one. Credits for photos live in `apps/mobile/assets/menu/CREDITS.md`.
