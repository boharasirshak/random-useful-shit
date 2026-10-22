# 0004. iPhone-style UI everywhere, and a PWA from the same code
Date: 2026-10-22
Status: accepted

## Context

The user prefers the iPhone look and feel over Android's. A web version (PWA) is wanted too, with the same UX as the app. On web, React Native components render as plain HTML/CSS: there are no native controls, so any "native" look on web is drawn by us.

No maintained cross-platform component library ships an iOS look (React Native Paper is Material; Tamagui and gluestack are generic).

## Decision

- **One codebase, three targets:** `apps/mobile` builds for iOS, Android and web. The web build is an installable, offline PWA (`npm run build:web`).
- **UI:** our own small component kit in `src/ui/`, styled to Apple's HIG (system colors, grouped lists, segmented controls, SF/system font), plus real native pieces where the platform has them:
  - native tab bar (`expo-router/native-tabs`) on iOS/Android; an iOS-style tab bar on web (`(tabs)/_layout.web.tsx`)
  - native form sheet for Add Food on iOS; a modal on web
  - haptics on phones
- **Storage:** AsyncStorage + Zustand persist. It works on all three targets, and the whole state is one small JSON document that doubles as the backup format.

## Consequences

- Android looks like iOS, except for its native tab bar. Accepted.
- Components are ours to maintain, so they're kept small: one component per file.
- Every library we add must work on web, or have a web fallback.
- The old `apps/web-prototype` is fully superseded; it stays only as a frozen backup.
