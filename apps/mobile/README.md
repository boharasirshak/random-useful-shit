# Random Useful Shit (apps/mobile)

One app, many small tools: the home screen is a launcher. The tools are **Calorie Tracker** and **Unrot**, a Reels-style feed of quotes, big ideas and true facts that leaves you sharper instead of fried. One Expo (React Native) + TypeScript codebase for **iPhone, Android and a web PWA**, with an iPhone-style UI everywhere. Fully offline; backs up to your Google Drive. See ADRs [0003](../../docs/decisions/0003-expo-react-native.md), [0004](../../docs/decisions/0004-iphone-ui-and-pwa.md) and [0005](../../docs/decisions/0005-launcher-of-tools.md).

## Requirements

- Node.js 22+ (tests run TypeScript natively with `node --test`)
- **iOS:** Xcode + Simulator, and CocoaPods (`brew install cocoapods`). A real iPhone without the 7-day install expiry needs the paid Apple Developer Program.
- **Android:** Android Studio (emulator + SDK).
- **Web:** any modern browser.

## Run

```sh
npm install
npm start                          # dev server (add -- --tunnel off your Wi-Fi); press w for web
npm run ios                        # build + install the dev client in the Simulator (slow the first time)
npm run phone:dev                  # dev client on a plugged-in or Wi-Fi-paired iPhone
npm run phone                      # standalone Release build on your iPhone: no Metro, no Mac needed after install
npm run android                    # dev client for Android
```

There are two apps, and both fit on one phone: **Useful Shit Dev** (`com.sirshak.randomusefulshit.dev`, scheme `randomusefulshit-dev`) is the dev client that loads JS from Metro, and **Random Useful Shit** is the real one. `APP_VARIANT=development` picks the dev one in `app.config.ts`; the scripts set it for you. They keep separate data. `ios/` is generated per variant: `scripts/native.sh` parks the other one as `ios-dev`/`ios-prod` with its Pods and build cache, so switching is instant. After changing native config (a plugin in `app.json`, the bundle ID), `rm -rf ios ios-dev ios-prod` and the next build regenerates it. Start Metro with `npm start` (not bare `npx expo start`) so the QR code opens the Dev app.

`npm run phone` installs a **Release** build with the JS bundled in, so the app runs on its own for the 7 days a free Apple ID allows (then run it again). First launch: Settings → General → VPN & Device Management → trust your Apple ID.

Phones run a **development build** with `expo-dev-client`, not Expo Go, because the app uses native modules (Google sign-in redirect, haptics, SwiftUI pickers). Build it once; after that, `npx expo start` is all you need day to day. The dev client finds the server on your network (or scan the QR code), shows errors on screen, and has a dev menu (shake the phone). Rebuild only when you add or upgrade a package with native code. Add packages with `npx expo install <pkg>` so versions match the Expo SDK.

## Test

```sh
npm test                # logic tests: calorie model, log math, meal builder, projection, backup format; Unrot ranking and feed; sync (two simulated devices)
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
    account.tsx                 Account and sync
    unrot/                      Unrot routes
      _layout.tsx               Waits for saved data; syncs the taste model; checks for new cards
      (tabs)/index.tsx          The feed (Feed / Saved / You tabs, native and web layouts)
      welcome.tsx · card/[id].tsx   Topic picker (first run) · one card from Saved
    calories/                   Calorie Tracker routes
      _layout.tsx               Waits for saved data; Add Food sheet
      (tabs)/_layout.tsx        Native tab bar (iOS/Android)
      (tabs)/_layout.web.tsx    iOS-style tab bar for web
      (tabs)/index.tsx · body.tsx · progress.tsx
      add.tsx                   Add Food sheet: à la carte, or build a plate/meal
  shared/                       Tool-agnostic logic: api.ts (server + session token), google.ts, account/, sync/ (engine + tested core)
  tools/
    registry.ts                 Tools shown on the launcher
    sync.ts                     Which tools sync, and which fields
    unrot/
      lib/                      Pure logic + tests: model (weights and biases), feed (picking, threads, reviews)
      data/                     topics.ts; catalog.ts (cards from packages/unrot-content, or newer ones from the server)
      store/                    app.ts (persisted, key "unrot"), sync.ts (catalog updates, related cards)
      features/                 Feed, FeedItem (gestures), CardFace, MorePanel, Rail, EndCard, Coach, …
    calories/
      lib/                      Pure logic + *.test.ts: model, log, builder, projection, backup, dates
      data/                     menu.ts (stable ids, ORDERS), images.ts (generated)
      store/                    app.ts (persisted), ui.ts (selected day/meal), derived.ts
      features/<tab>/           Screen pieces, one component per file (+ Thumb.tsx)
      backup/                   google.ts (sign-in → Drive token), drive.ts (Drive REST)
    reader/                     Reader routes: index (library), book/[id], voices (sheet)
    reader/
      lib/                      text.ts (PDF text → sentences, word position) + test; import.ts (pick + extract); files.ts; models.ts
      engine/                   system.ts (phone voice → audio file), model.ts (downloaded Kokoro/Kitten via sherpa-onnx), model.web.ts
      player.ts                 Renders sentences ahead of the cursor into an expo-audio playlist (background, lock screen, speed)
      store/app.ts              Library + voice settings (persisted, key "reader")
      features/                 Library, BookScreen, PlayerBar, Voices
  ui/                           Shared iOS design kit: theme, Screen, Section, Row, Segmented, Field,
                                Stepper, Button, LineChart, AppIcon, WebTab, haptics, confirm
assets/menu/                    Menu photos, one folder per restaurant (+ CREDITS.md)
assets/tools/                   Drawn launcher icons (unrot.png, made by unrot-logo.py)
assets/rive/                    Built Rive animations (one .riv, built from rive/)
rive/                           Rive source: rive.yaml + one .rml per artboard (Rive CLI project)
public/                         PWA files: index.html, manifest.json, icons
app.json / app.config.ts        Expo config (app.config.ts adds the Google iOS URL scheme from .env)
```

## Account and sync

Everything is saved on the device first and works offline. With `EXPO_PUBLIC_API_URL` set (see `.env.example` and `apps/server`), the app also syncs every tool's data to the server: on open, when you come back to it, when back online, a few seconds after edits, and every few minutes. No sign-up: each install gets an anonymous account the first time it's online. **Sign in with Google** on the Account screen (the person icon on the launcher) to use the same data on every device. The Account screen can also turn sync off, sign out, or delete the account and its server copy.

- Tools choose what syncs in `src/tools/sync.ts`. The engine is `src/shared/sync/` (`core.ts` is the tested algorithm); it diffs each store, so tool code doesn't change.
- The session token lives in the keychain (`expo-secure-store`). **Rebuild the dev client once** (`npm run ios` / `npm run phone`) after pulling this; until then the Account screen says sync needs a rebuild.

## Unrot

A vertical feed, one card per screen, like Reels, but every card is a verified quote, a book's idea in plain words, or a checked fact, each with its source.

- **Swipe up**: next card (a quick flick counts as a mild "not interested"). **Swipe left**: "Go deeper", the story behind the card, its source, related ideas, and "Not for me"; swipe right to come back. **Double tap**: like. **Press and hold**: not for me, fewer like this (Undo shows at the bottom). Swiping right on a card does nothing on purpose: thumbs read right as "yes", and iOS uses it for Back. Four buttons on the right (like, save, go deeper, share) cover the same, for people who don't swipe.
- **Teaching**: first run is four short steps (hello, topics, cards a day, a promise) with Sprout, the mascot, asking one thing per screen. Gestures are taught one at a time on real cards, and each tip disappears once you've done it.
- **Look**: quiet black. Warm white type in the platform's own font (SF Pro on iPhone), emphasis by brightness and weight, no topic colours, no labels over the words. The only colours are a like's red and Sprout's lime. Tokens live in `src/tools/unrot/features/style.ts`. Each card's key phrase (`em` in the content) is the brightest part, and the text brightens a phrase at a time when the card lands.
- **Animations**: Sprout, the like heart, the save bookmark, and the plant on the end-of-day card are Rive (web shows simple fallbacks). Gesture tips are a fingertip dot drawn with Reanimated, so they look the same everywhere.
- **It learns on the phone.** A logistic-regression taste model (one bias per topic, weights for type, author and tags) updates on every like, save, share, "go deeper", reading time, quick skip and swipe-left. 20% of picks explore your least-seen topic; no topic gets more than 2 of any 5 cards.
- **Threads**: 7-card mini-courses. Like or save a part and the next part comes up next.
- **Saved cards come back** to check you still remember them, after 1, 3, 7, 21 and 60 days.
- **It ends.** After the daily goal (picked at first run; 25 by default) you get "That's enough for today". A hairline at the top fills as you go.
- **Online extras.** Likes, saves and taste sync like everything else (see Account and sync). New cards arrive from the server without an app release, and "Go deeper" shows related ideas found by meaning (embeddings on the server).

Cards live in `packages/unrot-content` (one JSON file per topic, checked by `node build.mjs`); Metro watches that folder.

## Reader

Add a PDF and the phone reads it to you like an audiobook: works with the screen locked, lock-screen controls, speed from 0.8× to 2×, the sentence and word being read highlighted, and your place saved per book. No server, no paid voices.

- **Phone voices** (v1): the system text-to-speech, rendered sentence by sentence to audio files by the local module in `modules/speech-file/` (AVSpeechSynthesizer on iOS, TextToSpeech on Android) and played through an `expo-audio` playlist. Playing files instead of speaking live is what makes background playback and the lock screen reliable. Better system voices: Settings → Accessibility → Spoken Content → Voices on iOS (the app can only explain the steps); the Android button opens the TTS settings directly.
- **Downloadable voices** (v2): Kitten (27 MB) and Kokoro (147 MB), neural models that run on the phone through `react-native-sherpa-onnx`. Nothing is bundled: the user confirms the size, the model downloads from the sherpa-onnx GitHub release and unpacks under the app's documents. Delete any time.
- Text comes out of the PDF natively (`expo-pdf-text-extract`: PDFKit / PDFBox). Scanned PDFs have no text layer and are refused with a message.

## Animations (Rive)

The small interactive animations (streak flame, Day Complete ring, the + → ✓ on food rows, the weigh-in scale, award medals) are one Rive file, `assets/rive/random-useful-shit.riv`, built from the `.rml` files in `rive/` with the [Rive CLI](https://rive.app). Each artboard is driven by view-model values the app sets (`src/ui/RiveView.tsx`); on web `RiveView.web.tsx` shows the plain fallback instead.

```sh
npm run rive            # rebuild assets/rive/*.riv after editing an .rml (needs `rive` on PATH)
rive rive               # live previewer; `main:` in rive/rive.yaml picks the artboard
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

Done: launcher; Reader (PDF → audiobook with phone voices or downloaded Kokoro/Kitten, lock screen, speed, highlighting); Unrot (feed with swipe/double-tap gestures, Go deeper, on-device taste model, threads, spaced review of saved cards, daily limit, Saved/Liked, taste screen, code-based sync, 247 cards across 12 topics); Calorie Tracker with Food (meals, Panda bowl/plate/bigger plate with half & half, Chick-fil-A meal + sauces, à la carte, shake), Food home (week strip, Activity-style rings for calories/protein/carbs plus fat, favorites, per-meal targets, yesterday's recap), Weigh-in tab (ring to goal, wheels, reactions, week bubbles, 5-lb milestones), "Done for the Day" celebration with streaks and Apple Fitness-style awards, closed days bending the plan, Body (profile on iOS wheel pickers, a typical step week whose edits apply from that day on → daily burn), Goals (goal + lb/week → daily target, scrubbable plan vs actual chart, weigh-ins, history), How It Works (FAQ with example graphs), haptics, Google Drive backup/restore, PWA.

Next ideas: automatic backups, import from the old web prototype, EAS builds, the missing Panda photos.
