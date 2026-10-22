# random-useful-shit

A monorepo for **Random Useful Shit**: one app that launches small personal tools (first up: a calorie tracker), plus the original web prototype. No server: backups go to your Google Drive.

The app is Expo (React Native) + TypeScript ([ADR 0003](docs/decisions/0003-expo-react-native.md)): one codebase for iPhone, Android and a web PWA, with an iPhone-style UI everywhere ([ADR 0004](docs/decisions/0004-iphone-ui-and-pwa.md)).

## Layout

```
apps/
  mobile/          The app (Random Useful Shit). Expo + TypeScript → iOS, Android, web PWA. Offline.
  web-prototype/   Original prototype. Static HTML + JS, localStorage. Frozen as a backup.
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
