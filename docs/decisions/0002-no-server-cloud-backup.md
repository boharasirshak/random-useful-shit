# 0002. No server; back up to Google Drive
Date: 2026-10-22
Status: accepted (revised same day: iCloud dropped, Google Drive on every platform). Still holds for the Calorie Tracker; ADR 0006 adds a shared server for tools that need one.

## Context

ADR 0001 planned an optional lightweight server for sync/backup. There's one user, all the data is personal, and the app is offline-first. A server means hosting, auth and a sync model, all for a backup. iCloud would only cover Apple devices and the PWA can't use it.

## Decision

- No server. `apps/server` is removed.
- The app keeps all data on-device.
- Backup = "Sign in with Google" on the device, then one JSON file in the user's Google Drive **appDataFolder** (hidden, app-only). The same code runs on iOS, Android and web; there's no Google SDK, just OAuth (`expo-auth-session`) and the Drive REST API.
- The backup file is the whole app state (`src/tools/calories/lib/backup.ts`), so restore works across platforms.
- Menu/calorie data and photos ship inside the app.

## Consequences

- No hosting, accounts or auth to run. Google OAuth client IDs are needed (iOS, Android, web); see `apps/mobile/README.md`.
- Backup is manual (Back Up / Restore buttons). Automatic backup can come later.
- Calorie changes need an app update.
- A future data API is still possible as a separate, optional project.
