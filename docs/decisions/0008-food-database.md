# 0008. A scraped food database, popular items bundled, the rest downloaded
Date: 2026-10-24
Status: accepted

## Context

The Calorie Tracker shipped with two hand-typed menus (Chick-fil-A, Panda Express). Logging anything else meant Custom calories. The goal is what an average person actually eats and can buy, ready to eat: convenience-store snacks, fast food, grocery products, rotisserie chicken, protein shakes. Full macros and a photo for each, at scale, without a paid API (Nutritionix) or a 4 GB dump in the app.

## Decision

- **`packages/food-data` builds the database.** Node scripts, one per source, write `raw/<source>.json` in one shape (id, place, name, category, kcal, protein, carbs, fat, sodium, serving, photo URL). `build.mjs` merges them, fetches and shrinks the photos (240 px JPEG), and writes `out/`. The raw files are committed, so a build needs the network only for new photos.
- **Sources.** Packaged products: Open Food Facts (ODbL, photos CC BY-SA), US barcodes only, most-scanned first, sliced by category because anonymous search stops at 1,000 results. Chains: each chain's own site or ordering API, with Playwright where the site blocks plain fetches; the chain is the authority on its own numbers. Unbranded staples: USDA FoodData Central (SR Legacy, FNDDS) at the portion a person logs. Nothing is typed by hand or guessed.
- **Two tiers.** `popular.json` (every chain and home item, plus the most-scanned store products, with photos) is exported into the app as `data/catalog.ts` + `assets/menu/catalog/`. `foods.json` (everything) and all photos live on UploadThing, each under its own id as a stable public URL (`upload.mjs`); the app downloads the JSON on request and loads photos by URL. A hosted blob store, free at this size, no server of ours.
- **Ids never change.** `<place>-<slug(name)>` for chains and home, `store-<barcode>` for products. Logs store ids; the hand-typed list stays in `data/menu.ts` as the bottom layer so every id ever logged still resolves.
- **Plating is per place.** Each place carries `orders` (Panda Bowl = base + entrée; McDonald's Meal = entrée + side + drink + sauces; Chipotle Bowl = bases + protein + toppings and salsas), the same shape the meal builder already used, now with several add-on categories.

## Consequences

- Scrapers break when sites change. Each is small and independent; `raw/` keeps the last good result, and the app keeps working on the bundled copy.
- Chain photos belong to the chains and product photos to Open Food Facts contributors; `assets/menu/CREDITS.md` says so. Open Food Facts data is ODbL: if this database is ever redistributed on its own, that licence applies.
- The app grows by the bundled photos (tens of MB). Trim `POPULAR_STORE` in `build.mjs` if that hurts.
- Nutrition for sized or customised items is whatever the chain publishes; half-and-half, "no cheese" and the like are not modelled, as before.
