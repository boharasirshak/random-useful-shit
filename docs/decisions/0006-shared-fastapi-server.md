# 0006. One shared FastAPI server for every tool
Date: 2026-10-23
Status: accepted. Storage and Unrot's sync code superseded by [0007](0007-accounts-sync-postgres.md)

## Context

ADR 0002 removed the server: calorie data is personal and lives on the phone. Unrot, the second tool, is a feed of cards that learns what you like. Its taste model should follow you across devices, and new cards should reach the app without a release. More tools are coming, and several will want machine learning (recommendations, embeddings, text processing), where Python's libraries are far ahead of Node's.

## Decision

- **One server, `apps/server`, in Python with FastAPI.** Every tool is one router under its own URL prefix (`/unrot/...`) and owns tables prefixed with its id (`unrot_*`). One process, one deploy, one database.
- **Store as little as possible.** For Unrot that is the taste model only: a few hundred weights and biases, filed under an anonymous code the app makes up. No accounts, no reading history, no saved cards. Ranking runs on the phone.
- **The server is optional for the app.** With no `EXPO_PUBLIC_API_URL`, Unrot works fully offline on the cards it ships with.
- **Calorie data still never leaves the device.** ADR 0002 stands for the Calorie Tracker.
- **SQLite to start**, one file. Move to Postgres when more than one server process needs to write.
- **Shared data lives in `packages/`** as plain files both languages read (e.g. `packages/unrot-content/cards.json`). The app's TypeScript types and the server's Pydantic models describe the same JSON; the server's OpenAPI file (`/openapi.json`) is the contract, and TypeScript types can be generated from it when a tool needs more than a few calls.

## Consequences

- Python joins TypeScript in the repo. Tooling is `uv` (lockfile, pinned Python).
- Automatic API docs at `/docs`, from the same Pydantic models that validate input.
- A bad deploy takes every tool's backend down at once. Fine for personal tools; split a tool out only if it needs to scale differently.
- Slow CPU work (model inference) must not run in `async` routes, or it blocks the event loop. Use plain `def` routes (FastAPI runs them in a thread pool) or a worker.
- Hosting is not set up yet. Before it faces the internet it needs a reverse proxy with TLS, a body-size limit and rate limiting.
