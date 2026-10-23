# Architecture

## Components

| Project | Role | Status |
|---|---|---|
| `apps/web-prototype` | Original prototype. Frozen as a backup; not kept in sync. | Working, frozen |
| `apps/mobile` | The real product, **Random Useful Shit**: a launcher of small tools ([ADR 0005](decisions/0005-launcher-of-tools.md)): Calorie Tracker and Unrot. Expo + TypeScript for iOS, Android and a web PWA, fully offline. | Working |
| `apps/server` | Shared API, Python + FastAPI on Postgres (pgvector) and Redis ([ADR 0006](decisions/0006-shared-fastapi-server.md), [0007](decisions/0007-accounts-sync-postgres.md)): accounts, offline-first sync of every tool's data, RAG, Unrot's catalog and related cards. Optional: the app works fully without it. | Working, not hosted |
| `packages/unrot-content` | Unrot's cards. The app bundles `cards.json`; the server serves it so new cards arrive without a release. | Working |

## Principles

1. **Offline-first.** The app must work with no network, forever. Every feature works on-device. The device is the source of truth; sync copies it to the server when online (`apps/mobile/src/shared/sync/`).
2. **Least data.** The server keeps the tools' own data when sync is on (for Unrot that includes which cards you've seen), and who it belongs to. Nothing else, and no analytics. Drive backup still works without it ([ADR 0002](decisions/0002-no-server-cloud-backup.md)). Accounts start anonymous; Google sign-in only links devices ([ADR 0007](decisions/0007-accounts-sync-postgres.md)).
3. **Menu data and photos ship with the app.** Calorie changes go out in an app release, since there's nothing to fetch them from.

## Source of truth

Two things are product logic rather than UI. Both now live in `apps/mobile` ([ADR 0003](decisions/0003-expo-react-native.md)):

- **Menu data**: `apps/mobile/src/tools/calories/data/menu.ts`. Items have stable ids (`cfa-chicken-sandwich`), calories, category and image, plus `ORDERS`, how each restaurant builds a meal (Panda bowl/plate/bigger plate, Chick-fil-A meal).
- **Weight model**: `apps/mobile/src/tools/calories/lib/model.ts`, tested by `model.test.ts`. That test pins the same numbers as the prototype's `check.js`.

The prototype keeps its own frozen copies. If a future project (e.g. an API) needs either, extract it to `packages/` then.

## Data model

Stored on-device as one JSON document (Zustand persist → AsyncStorage); the backup file wraps the same shape (`src/tools/calories/lib/backup.ts`).

```
profile   { sex, dob, age, ft, in, weight, goal, rate, steps, exercise, bf }
            age: worked out from dob on every load
            rate: planned lb/week; steps: average of the current step week
shake     kcal per protein shake
shakeProtein  grams of protein per shake (menu items carry their own protein/carbs/fat)
logs      { "YYYY-MM-DD": [ { meal, name?, parts: [ { id, qty } ], qty } ] }
            meal: breakfast | lunch | dinner | snacks
            id:   prototype "<Restaurant>|<Item name>"; mobile uses stable ids from menu.ts
            parts with qty 0.5 = half portion (Panda half & half base)
weights   { "YYYY-MM-DD": lb }
done      { "YYYY-MM-DD": true }   days marked "Done for the Day"
favorites [ { name?, parts } ]       pinned orders
seenAwards [ id ]                    awards already celebrated (awards themselves are computed)
stepWeeks [ { from: "YYYY-MM-DD", week: [Mon … Sun] } ]   one version per edit day;
            the plan uses the version in effect on each day, so edits don't rewrite the past
```

Why not SQLite: the whole thing is a few hundred KB even after years, it's always read in full, and nothing queries it. AsyncStorage works the same on iPhone and in the PWA. SQLite on the web needs a WASM build plus cross-origin isolation headers, which GitHub Pages can't send. Revisit if the data outgrows a single document or needs queries.

The prototype's item ids are names, so renaming an item orphans old log entries. Mobile uses stable ids instead, so backups restore cleanly across menu updates.

## Unrot data

On the device (Zustand persist → AsyncStorage, key `unrot`; downloaded catalogs under `unrot-catalog`):

```
model     { w: { "tag:death": 0.4, "author:Seneca": 1.1, "type:quote": … }, b: { stoicism: 1.3, … }, n }
            logistic regression; score = b[topic] + Σ w[feature] / √features
topics    picked on the welcome screen (seed the biases)
seen      { cardId: lastShownMs }   a card can come back after 21 days
hidden    [ cardId ]                swiped left
liked     { cardId: ms }    saved { cardId: { at, due, stage } }   (review after 1, 3, 7, 21, 60 days)
limit, today { day, count, extra }, sync, code, syncedAt, welcomed, coached
```

On the server: the same fields as sync records (`unrot / f:model`, `unrot / m:liked:<card>`, …). The day's card count and the downloaded catalog stay on the device.

## Sync

Each tool lists its synced fields in `apps/mobile/src/tools/sync.ts`; plain fields become one record each (`f:profile`), map fields one record per entry (`m:logs:2026-10-23`). See `apps/server/README.md` → How sync works.

## Open decisions

- Automatic backups (today: manual Back Up / Restore)
