# AGENTS

Monorepo for Random Useful Shit. The app is `apps/mobile` (Expo + TypeScript); its README has the run, test and build commands. New tools go inside it (`src/tools/<id>` + `src/app/<id>`), not as new apps. The shared backend is `apps/server` (Python + FastAPI, one router per tool); Unrot's cards are in `packages/unrot-content`.

The app's Rive animations are a Rive CLI project in `apps/mobile/rive/` — read `apps/mobile/rive/AGENTS.md` before touching an `.rml` there.
