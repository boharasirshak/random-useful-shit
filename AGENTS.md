# AGENTS

Monorepo for Random Useful Shit. The app is `apps/mobile` (Expo + TypeScript); its README has the run, test and build commands. New tools go inside it (`src/tools/<id>` + `src/app/<id>`), not as new apps. The shared backend is `apps/server` (Python + FastAPI, one router per tool); Unrot's cards are in `packages/unrot-content`; the Calorie Tracker's food database is built by `packages/food-data` (scrapers → `raw/` → `out/`; `export.mjs` puts the popular set into the app, `upload.mjs` puts the rest on UploadThing). Never hand-edit the generated `data/catalog.ts` / `data/catalogImages.ts`. Unrot's bulk cards follow `packages/unrot-content/BULK.md`; the free ambient tracks are `packages/ambient`. Everything published goes to UploadThing under one base URL (`EXPO_PUBLIC_DATA_URL`), each file by a stable name.

The app's Rive animations are a Rive CLI project in `apps/mobile/rive/` — read `apps/mobile/rive/AGENTS.md` before touching an `.rml` there.
