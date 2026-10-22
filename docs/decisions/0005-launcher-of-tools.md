# 0005. One app, many tools: "Random Useful Shit" launcher
Date: 2026-10-22
Status: accepted

## Context

The calorie tracker is the first of several small personal tools. Shipping each as its own app would mean a new bundle ID, Google client IDs, and store setup every time.

## Decision

- The app is **Random Useful Shit** (`com.sirshak.randomusefulshit`). Its home screen (`src/app/index.tsx`) is a launcher: an iOS home-screen-style grid of tools, listed in `src/tools/registry.ts`.
- Each tool is self-contained:
  - routes in `src/app/<tool>/` (its own `_layout.tsx`, tabs, sheets)
  - code in `src/tools/<tool>/` (lib, data, store, features)
- Shared, tool-agnostic pieces live in `src/ui/` (the iOS design kit). Shared code must not import from a tool.
- Each tool owns its storage key and backup file, so tools can't clobber each other's data.

## Consequences

- Adding a tool is three steps: a folder under `src/tools/`, a folder under `src/app/`, and one entry in the registry.
- One set of Google OAuth clients and one App Store entry for everything.
- Code shared by two tools gets promoted to `src/ui/` (UI) or a new `src/shared/` (logic) when the second tool actually needs it.
