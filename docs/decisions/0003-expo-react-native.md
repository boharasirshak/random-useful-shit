# 0003. Mobile app: Expo (React Native) + TypeScript
Date: 2026-10-22
Status: accepted (backup revised by 0002 to Google Drive only; UI + web target in 0004)

## Context

`apps/mobile` needs to be one codebase for iOS and Android, feel native, work fully offline, and back up to iCloud and Google Drive (ADR 0002). Desktop is unlikely. The prototype's weight model and menu data are already JavaScript.

Options considered: Expo/React Native, Flutter, Kotlin Multiplatform, separate Swift + Kotlin apps.

## Decision

Expo (React Native) with TypeScript and Expo Router.

- The model and menu data port almost line for line; the prototype's checks carry over as tests.
- React Native renders real native controls, not a WebView.
- Fast iteration (reload on save), cloud builds via EAS, and config-plugin access to native features.
- Flutter was the runner-up: better desktop story, but a full rewrite in Dart for no gain on mobile.

## Consequences

- Day-to-day work happens in a **development build**, not Expo Go, once native modules (cloud backup) are added.
- Installing on a real iPhone without the 7-day expiry needs the paid Apple Developer Program ($99/yr). The user accepted this.
- Native `ios/` and `android/` folders are generated, never hand-edited; native config lives in `app.json` and config plugins.
- `apps/mobile` is now the source of truth for the menu data (`src/tools/calories/data/menu.ts`) and the weight model (`src/tools/calories/lib/model.ts`), moved there by ADR 0005. The web prototype is frozen as a backup and won't be kept in sync.
