import pytest

from app.config import settings
from app.db import sessions
from app.rag import CHUNK, chunks
from app.unrot import ingest_catalog
from tests.conftest import fake_embed, signup

pytestmark = pytest.mark.anyio
ADMIN = {"X-Admin-Token": "admin-secret"}
DOCS = [
    ("seneca", "On the shortness of life", "Life is long if you know how to use it. We waste time on trivial things."),
    ("dhammapada", "Impermanence", "All conditioned things are impermanent. When one sees this with wisdom, one turns away from suffering."),
    ("monty", "Monty Hall", "Three doors, one car, two goats. Switching doors wins two thirds of the time."),
]


async def test_ingest_and_search(client):
    for sid, title, text in DOCS:
        r = await client.put("/rag/test/documents", json={"source_id": sid, "title": title, "text": text}, headers=ADMIN)
        assert r.json()["changed"] is True
    again = await client.put("/rag/test/documents", json={"source_id": "seneca", "title": DOCS[0][1], "text": DOCS[0][2]}, headers=ADMIN)
    assert again.json()["changed"] is False  # unchanged: not re-embedded
    h = await signup(client)
    hits = (await client.post("/rag/test/search", json={"query": "which doors should I pick, goats or a car", "k": 2}, headers=h)).json()
    assert hits[0]["source_id"] == "monty" and len(hits) == 2
    assert (await client.delete("/rag/test/documents/monty", headers=ADMIN)).status_code == 204
    hits = (await client.post("/rag/test/search", json={"query": "doors goats car"}, headers=h)).json()
    assert "monty" not in {x["source_id"] for x in hits}


async def test_writes_need_the_admin_token_and_search_needs_an_account(client):
    body = {"source_id": "x", "text": "y"}
    assert (await client.put("/rag/test/documents", json=body)).status_code == 403
    assert (await client.put("/rag/test/documents", json=body, headers={"X-Admin-Token": "wrong"})).status_code == 403
    assert (await client.post("/rag/test/search", json={"query": "y"})).status_code == 401


def test_chunks():
    assert chunks("one\n\ntwo") == ["one\n\ntwo"]
    long = "word " * 1000
    parts = chunks(long)
    assert all(len(p) <= CHUNK for p in parts) and len(parts) > 5
    assert chunks("a" * 10 + "\n\n" + "b" * (CHUNK - 5)) == ["a" * 10, "b" * (CHUNK - 5)]


async def test_unrot_catalog_and_related_cards(client):
    assert (await client.get("/unrot/catalog/version")).json()["version"] == (await client.get("/unrot/catalog")).json()["version"]
    assert (await client.get("/unrot/related/stoicism-001")).json() == []  # nothing embedded yet
    async with sessions()() as db:
        n, changed = await ingest_catalog(db, fake_embed)
    assert n == changed > 200
    async with sessions()() as db:
        assert await ingest_catalog(db, fake_embed) == (n, 0)
    related = (await client.get("/unrot/related/stoicism-001?k=3")).json()
    assert len(related) == 3 and "stoicism-001" not in {r["id"] for r in related}
    assert (await client.get("/unrot/related/nope-999")).status_code == 404
    assert settings().unrot_catalog.exists()
