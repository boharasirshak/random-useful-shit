# 0007. Accounts, offline-first sync, and Postgres with pgvector
Date: 2026-10-23
Status: accepted

## Context

The app is offline-first and must stay that way. The owner now wants every tool's data to reach the server whenever the device is online, to know which data belongs to whom, and a server ready to grow: migrations, a real database, retrieval for RAG, and protection against abuse. ADR 0006 started the server on SQLite with Unrot's anonymous sync code.

## Decision

- **The device stays the source of truth.** Every tool saves locally first. A shared sync engine (`apps/mobile/src/shared/sync/`) watches each tool's store and splits its state into small records: one per field, one per map entry (per day, per card). Edits are stamped with the device's time. On open, on coming back to the app, on reconnecting, a few seconds after edits, and every few minutes, it pushes unsent records and pulls newer ones.
- **Conflicts: last write wins per record**, by edit time. An edit is always stamped later than the version it was made on. The server caps future times at now. Small records mean edits to different days never collide.
- **Accounts without sign-up.** Each install gets an anonymous account the first time it's online. "Sign in with Google" (server verifies the ID token) upgrades it in place, or folds it into an existing account; the device then re-sends its data. Sessions are random bearer tokens; the server keeps only their SHA-256, and the app keeps them in the keychain (`expo-secure-store`).
- **Postgres 17 + SQLAlchemy 2 (async) + Alembic.** Migrations are written by hand and checked with `alembic check`.
- **RAG inside Postgres with pgvector**, HNSW index, embeddings from a small local model (fastembed, `bge-small-en-v1.5`, 384 dimensions). One database to run and back up, joins with user data, transactions. A separate vector database (Qdrant) is only worth it past several million vectors or for heavy filtered search.
- **Redis only where it earns its place:** rate limits shared across workers. Not a cache or a queue yet.
- **Calorie data now syncs too**, when sync is on. This narrows ADR 0002: Drive backup still exists, but the owner's server holds a copy.

## Consequences

- One `docker compose up db redis` for local dev. Tests run against real Postgres.
- Sync is on by default whenever `EXPO_PUBLIC_API_URL` is set, and can be turned off (and the server copy deleted) from the Account screen.
- Clock skew between devices can still pick the "wrong" winner for a record edited on two devices in the same minutes. Fine for one person; revisit with per-field merges if a tool needs it.
- `expo-secure-store` is a native module: phones need a rebuild of the dev client before sync turns on.
- Not yet: Sign in with Apple (required before an App Store release that offers Google sign-in), generation in RAG (an LLM call over the retrieved chunks), background job queue, hosting.
