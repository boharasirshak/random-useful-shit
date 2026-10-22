# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Monorepo (see `docs/architecture.md`). `apps/web-prototype` is static HTML + plain JS with CDN styling (DaisyUI 5 + Tailwind browser build) and data in localStorage. `apps/mobile` is Expo (React Native) + TypeScript: iOS, Android and a web PWA from one codebase, iPhone-style UI, offline. No server; backup to Google Drive.

## Users

One person (the owner) tracking their own weight loss. Logs meals on both phone and desktop equally.

## Product Purpose

The app is **Random Useful Shit**, a launcher of small personal tools. The first tool is the Calorie Tracker:

Calorie Calculator: log what was eaten today, see BMR/TDEE, daily deficit, and a projected weight-loss curve toward a goal weight.

## Operating Context

Diet is limited to three sources: Chick-fil-A, Panda Express, and one morning protein shake (calories set by the user). Nothing else. Logging happens right after eating; the user browses a photo grid of menu items and also filters by name.

## Capabilities and Constraints

- Food logging is the primary job. BMR/profile and weight record are secondary, but each must persist in localStorage.
- Calorie values come from official nutrition pages (Chick-fil-A site, Panda Express nutrition table, Oct 2026).
- Food photos are real menu photos saved locally under `apps/web-prototype/calorie-calculator/img/`.
- Imperial units (lb, ft/in).

## Evidence on Hand

Official calorie tables (in `apps/web-prototype/calorie-calculator/script.js`). No other data.

## Product Principles

1. Adding food is one tap.
2. The numbers that matter (eaten, left, deficit) are always visible.
3. Nothing to install, nothing to sign into.
