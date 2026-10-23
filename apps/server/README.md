# server (apps/server)

The shared API for the Random Useful Shit tools: accounts, offline-first sync of every tool's data, retrieval (RAG) over pgvector, and one router per tool. Python + FastAPI on Postgres, with Redis for rate limits. See ADRs [0006](../../docs/decisions/0006-shared-fastapi-server.md) and [0007](../../docs/decisions/0007-accounts-sync-postgres.md).

## Requirements

- [uv](https://docs.astral.sh/uv/) (`brew install uv`). It installs the pinned Python (3.13).
- Docker (OrbStack or Docker Desktop) for Postgres + pgvector and Redis.

## Run

```sh
cp .env.example .env                      # defaults work for local dev
docker compose up db redis -d             # Postgres 17 + pgvector, Redis 7
uv sync                                   # first time, and after dependency changes
uv run alembic upgrade head               # create / update tables
uv run python -m app.cli ingest-unrot     # embed Unrot's cards (first run downloads a ~70 MB model)
uv run fastapi dev app/main.py --host 0.0.0.0   # http://<your-mac's-LAN-IP>:8000, docs at /docs
```

Point the app at it with `EXPO_PUBLIC_API_URL=http://<your-mac's-LAN-IP>:8000` in `apps/mobile/.env`, then restart Expo.

Everything in containers instead: `uv lock` once, then `docker compose --profile full up --build`.

Settings (environment or `.env`):

| Variable | Default | What |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://app:app@localhost:5432/app` | Postgres with the `vector` extension |
| `REDIS_URL` | unset | Rate limits shared by every worker. Unset: per process |
| `GOOGLE_CLIENT_IDS` | empty | Comma-separated OAuth client IDs (iOS, Android, web) whose ID tokens we accept. Empty: Google sign-in off |
| `ADMIN_TOKEN` | unset | Needed for admin routes (`PUT /rag/...`). Unset: they're off |
| `EMBED_MODEL_PATH` | unset | A folder with the embedding model files, for servers without internet |
| `CORS_ORIGINS` | `*` | Browser origins allowed to call it |
| `UNROT_CATALOG` | `packages/unrot-content/cards.json` | Unrot's cards |

## Test

```sh
docker compose up db -d
uv run pytest              # uses its own database, app_test, created and migrated on first run
uv run alembic check       # fails if the models and migrations disagree
```

## Build / release

Not hosted yet. The `Dockerfile` migrates and then serves with two workers. In front of it you need a reverse proxy with TLS and a body-size limit. Set `REDIS_URL` once there's more than one worker, and set `GOOGLE_CLIENT_IDS` and `ADMIN_TOKEN`. Back up the Postgres volume.

## What's stored

| Table | What | Why |
|---|---|---|
| `users` | id; Google `sub`, email and name once signed in | Knowing whose data is whose |
| `sessions` | SHA-256 of each device's token, expiry | Signing in. The token itself is never stored |
| `sync_records` | Each tool's on-device data as small records (`calories / m:logs:2026-10-23`), with the device's edit time | Offline-first sync and a copy for new devices |
| `rag_documents`, `rag_chunks` | Server-owned text and its embeddings (e.g. Unrot's cards) | Retrieval: related cards today, RAG later |

`DELETE /auth/me` removes a user and everything above that belongs to them.

## How sync works

The app splits each tool's saved state into records: one per setting, one per day of logs, one per liked card. It remembers when each was last edited on the device. `POST /sync/{tool}` takes the records changed since the last sync, keeps each one only if its edit time is newer than what's stored (last write wins, future times capped at now), and returns everything changed since the device's cursor, in pages of 500. A per-user lock makes the cursor safe with two devices syncing at once. The app's half is `apps/mobile/src/shared/sync/`.

## Layout

```
app/
  main.py        App: CORS, body-size limit, /health, routers
  config.py      Settings
  db.py          Async engine and session (SQLAlchemy 2)
  models.py      Every table (Alembic reads it)
  auth.py        Anonymous accounts, Google sign-in, sessions, /auth/me
  sync.py        POST /sync/{tool}: push changed records, pull newer ones
  rag.py         Chunking, local embeddings (fastembed), pgvector search, admin ingest
  ratelimit.py   Fixed-window limits in Redis (or memory)
  unrot.py       Catalog, related cards
  cli.py         python -m app.cli ingest-unrot
migrations/      Alembic (async); versions/0001_initial.py
tests/           pytest against real Postgres; fakes for Google and the embedding model
compose.yaml     db (pgvector), redis, api (profile "full")
```

## Adding a tool

1. To sync its on-device data: add its id to `TOOLS` in `app/sync.py` and its fields to `apps/mobile/src/tools/sync.ts`. That's all.
2. For its own endpoints: `app/<tool>.py` with `router = APIRouter(prefix="/<tool>")`, Pydantic models for every input, then add it to the router list in `main.py`.
3. New tables: models in `app/models.py` (prefix `<tool>_`), then a migration in `migrations/versions/`.
4. Store the least data that makes the feature work.
