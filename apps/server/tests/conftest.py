"""Tests run against a real Postgres (with pgvector): `docker compose up db -d`. They use a separate database,
app_test, created and migrated on first run and emptied between tests."""

import asyncio
import hashlib
import math
import os
import re

import asyncpg
import pytest

URL = os.environ.get("TEST_DATABASE_URL", "postgresql+asyncpg://app:app@localhost:5432/app_test")
os.environ.update(DATABASE_URL=URL, TESTING="true", ADMIN_TOKEN="admin-secret", GOOGLE_CLIENT_IDS="test-client", REDIS_URL="")

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app import auth, ratelimit  # noqa: E402
from app.main import app  # noqa: E402
from app.models import EMBED_DIM  # noqa: E402
from app.rag import get_embed  # noqa: E402

PLAIN = URL.replace("+asyncpg", "")


def fake_embed(texts: list[str]) -> list[list[float]]:
    """Bag of words hashed into EMBED_DIM buckets: texts sharing words land close together. Deterministic, no model."""
    out = []
    for t in texts:
        v = [0.0] * EMBED_DIM
        for w in re.findall(r"[a-z]+", t.lower()):
            v[int(hashlib.md5(w.encode()).hexdigest(), 16) % EMBED_DIM] += 1
        n = math.sqrt(sum(x * x for x in v)) or 1
        out.append([x / n for x in v])
    return out


def fake_google(token: str) -> dict:
    """ID tokens in tests look like "g:alice"."""
    if not token.startswith("g:"):
        from fastapi import HTTPException
        raise HTTPException(401, "bad token")
    who = token[2:]
    return {"sub": f"sub-{who}", "email": f"{who}@example.com", "email_verified": True, "name": who.title()}


@pytest.fixture(scope="session", autouse=True)
def database():
    async def create():
        admin = await asyncpg.connect(PLAIN.rsplit("/", 1)[0] + "/postgres")
        name = PLAIN.rsplit("/", 1)[1]
        if not await admin.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", name):
            await admin.execute(f'CREATE DATABASE "{name}"')
        await admin.close()

    asyncio.run(create())
    command.upgrade(Config("alembic.ini"), "head")


@pytest.fixture(autouse=True)
def clean(monkeypatch):
    async def wipe():
        conn = await asyncpg.connect(PLAIN)
        await conn.execute("TRUNCATE users, rag_documents CASCADE")
        await conn.close()

    asyncio.run(wipe())
    ratelimit._memory.clear()
    monkeypatch.setattr(auth, "verify_google", fake_google)
    app.dependency_overrides[get_embed] = lambda: fake_embed
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def signup(client: AsyncClient) -> dict[str, str]:
    """A new anonymous account; returns the auth header."""
    r = await client.post("/auth/anonymous", json={"device": "test"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}
