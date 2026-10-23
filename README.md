# random-useful-shit

A monorepo for **Random Useful Shit**: one offline-first app that launches small personal tools (a calorie tracker, and Unrot, a feed that makes you smarter), a shared server that syncs their data across devices, and the original web prototype.

The app is Expo (React Native) + TypeScript ([ADR 0003](docs/decisions/0003-expo-react-native.md)): one codebase for iPhone, Android and a web PWA, with an iPhone-style UI everywhere ([ADR 0004](docs/decisions/0004-iphone-ui-and-pwa.md)).

## Layout

```
apps/
  mobile/          The app (Random Useful Shit). Expo + TypeScript → iOS, Android, web PWA. Offline.
  server/          Shared API (Python + FastAPI, Postgres + pgvector, Redis): accounts, sync, RAG, per-tool routers.
  web-prototype/   Original prototype. Static HTML + JS, localStorage. Frozen as a backup.
packages/
  unrot-content/   Unrot's cards, one JSON file per topic, merged into cards.json
docs/
  architecture.md  How the pieces fit and what's shared
  conventions.md   Rules for adding and working on projects
  decisions/       Architecture decision records (ADRs)
PRODUCT.md         Product brief: who it's for, what it does, constraints
```

## Quick start

Mobile app:

```sh
cd apps/mobile && npm install
npx expo start     # w = web; i/a need a dev build (see apps/mobile/README.md)
npm test           # logic tests
```

Server (optional; see apps/server/README.md):

```sh
cd apps/server && docker compose up db redis -d && uv sync && uv run alembic upgrade head
uv run fastapi dev app/main.py   # docs at http://127.0.0.1:8000/docs
uv run pytest
```

Prototype (no build step, no installs):

```sh
open apps/web-prototype/index.html               # or open the file in any browser
node apps/web-prototype/calorie-calculator/check.js   # weight-model sanity checks
```

Each project's own README has its run, test and build commands.

## Docs

- [Architecture](docs/architecture.md): components, data ownership, what gets shared
- [Conventions](docs/conventions.md): folder rules, per-project README requirements, adding a project
- [Decisions](docs/decisions/): why the repo is shaped this way
- [Product brief](PRODUCT.md)
