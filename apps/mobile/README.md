# Random Useful Shit (apps/mobile)

One app, many small tools: the home screen is a launcher, and **Calorie Tracker** is the first tool. One Expo (React Native) + TypeScript codebase for **iPhone, Android and a web PWA**, with an iPhone-style UI everywhere. Fully offline; backs up to your Google Drive. See ADRs [0003](../../docs/decisions/0003-expo-react-native.md), [0004](../../docs/decisions/0004-iphone-ui-and-pwa.md) and [0005](../../docs/decisions/0005-launcher-of-tools.md).

## Requirements

- Node.js 22+ (tests run TypeScript natively with `node --test`)
- **iOS:** Xcode + Simulator, and CocoaPods (`brew install cocoapods`). A real iPhone without the 7-day install expiry needs the paid Apple Developer Program.
- **Android:** Android Studio (emulator + SDK).
- **Web:** any modern browser.

## Run

```sh
npm install
npx expo start          # press w for web
npm run ios             # builds + runs the iOS dev build in the Simulator (first build is slow)
npm run android         # same for Android
```

The app uses native modules (Google sign-in redirect, haptics), so phones run a **development build** (`npm run ios|android`), not Expo Go. Add packages with `npx expo install <pkg>` so versions match the Expo SDK.

## Test

```sh
npm test                # logic tests: model, log math, meal builder, projection, backup format
npm run typecheck
npx expo lint
npx expo-doctor
```

Run all four before calling a change done.

## Build / release

- **PWA:** `npm run build:web` → `dist/` (static site + offline service worker). Every push to `main` deploys it to GitHub Pages (`.github/workflows/pages.yml`) at https://boharasirshak.github.io/random-useful-shit/. Sub-path builds set `EXPO_BASE_URL=/<repo>`; for Drive backup on the hosted site, add a `GOOGLE_WEB_CLIENT_ID` repo variable.
- **iOS / Android:** EAS cloud builds (not set up yet): `npx eas-cli@latest build --profile development|preview|production`.

## Google Drive backup (one-time setup)

Backup works with no server: the app signs you in with Google and saves one file to your Drive's hidden app folder. You need OAuth client IDs:

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and enable the **Google Drive API**.
2. Set up the **OAuth consent screen** (External, Testing is fine) and add yourself as a test user. Scope: `.../auth/drive.appdata`.
3. Under **Credentials → Create OAuth client ID**, create:
   - **iOS**: bundle ID `com.sirshak.randomusefulshit` (from `app.json`)
   - **Web**: add your origins under *Authorized JavaScript origins* and *Authorized redirect URIs* (e.g. `http://localhost:8081` and your PWA URL)
   - **Android**: package `com.sirshak.randomusefulshit` + your SHA-1, with *custom URI scheme* enabled under Advanced settings
4. `cp .env.example .env` and paste the IDs.
5. Rebuild the phone apps (`npm run ios`). `app.config.ts` registers the iOS sign-in redirect automatically.

Until this is done, the Backup rows are disabled and say why.

## Layout

```
src/
  app/                          Routes (Expo Router). Thin: compose features.
    _layout.tsx                 Root stack
    index.tsx                   Launcher (home screen)
    calories/                   Calorie Tracker routes
      _layout.tsx               Waits for saved data; Add Food sheet
      (tabs)/_layout.tsx        Native tab bar (iOS/Android)
      (tabs)/_layout.web.tsx    iOS-style tab bar for web
      (tabs)/index.tsx · body.tsx · progress.tsx
      add.tsx                   Add Food sheet: à la carte, or build a plate/meal
  tools/
    registry.ts                 Tools shown on the launcher
    calories/
      lib/                      Pure logic + *.test.ts: model, log, builder, projection, backup, dates
      data/                     menu.ts (stable ids, ORDERS), images.ts (generated)
      store/                    app.ts (persisted), ui.ts (selected day/meal), derived.ts
      features/<tab>/           Screen pieces, one component per file (+ Thumb.tsx)
      backup/                   google.ts (sign-in → Drive token), drive.ts (Drive REST)
  ui/                           Shared iOS design kit: theme, Screen, Section, Row, Segmented, Field,
                                Stepper, Button, LineChart, AppIcon, haptics, confirm
assets/menu/                    Menu photos, one folder per restaurant (+ CREDITS.md)
public/                         PWA files: index.html, manifest.json, icons
app.json / app.config.ts        Expo config (app.config.ts adds the Google iOS URL scheme from .env)
```

## Adding a tool

1. Code in `src/tools/<id>/` (its own `lib/`, `store/`, `features/`), with tests for any logic.
2. Routes in `src/app/<id>/`: a `_layout.tsx` and screens. Pass `back="Apps"` to `Screen` for the link home.
3. Add an entry to `src/tools/registry.ts` (name, icon, color, href).
4. Give its store its own storage key. `src/ui/` must never import from a tool.

## Conventions

- Keep files small: one component per file; logic goes in `lib/` with a test next to it.
- Each tool's `lib/` and `data/` import each other with relative paths **including `.ts`** (so `node --test` can run them). Everything else imports with `@/…`.
- Every new library must work on web too (or have a `.web.tsx` fallback).
- Adding a menu photo: drop it in `assets/menu/`, set `image` in `tools/calories/data/menu.ts`, and add it to `tools/calories/data/images.ts`.

## Status

Done: launcher; Calorie Tracker with Food (meals, Panda bowl/plate/bigger plate with half & half, Chick-fil-A meal + sauces, à la carte, shake), Body (profile, steps → daily burn), Goals (goal + lb/week → daily target, plan vs actual trend chart, weigh-ins, history), Google Drive backup/restore, PWA.

Next ideas: automatic backups, import from the old web prototype, EAS builds, the missing Panda photos.
