import time

import pytest

from tests.conftest import signup

pytestmark = pytest.mark.anyio


async def sync(client, h, since=0, changes=(), tool="calories"):
    r = await client.post(f"/sync/{tool}", json={"since": since, "changes": list(changes)}, headers=h)
    assert r.status_code == 200, r.text
    return r.json()


def ch(key, value, at, deleted=False):
    return {"key": key, "value": value, "at": at, "deleted": deleted}


async def test_push_then_pull_from_another_device(client):
    h = await signup(client)
    first = await sync(client, h, changes=[ch("f:shake", 160, 10), ch("m:logs:2026-10-23", [{"meal": "lunch"}], 11)])
    assert {c["key"] for c in first["changes"]} == {"f:shake", "m:logs:2026-10-23"}
    assert (await sync(client, h, since=first["cursor"]))["changes"] == []  # nothing new
    again = await sync(client, h)  # a new device on the same account starts from 0
    assert {c["key"]: c["value"] for c in again["changes"]}["f:shake"] == 160


async def test_last_write_wins_by_edit_time(client):
    h = await signup(client)
    await sync(client, h, changes=[ch("f:shake", 160, 100)])
    await sync(client, h, changes=[ch("f:shake", 999, 50)])  # older edit, synced later: loses
    await sync(client, h, changes=[ch("f:shake", 555, 100)])  # same time: the stored one stays
    assert (await sync(client, h))["changes"][0]["value"] == 160
    await sync(client, h, changes=[ch("f:shake", 200, 101)])
    assert (await sync(client, h))["changes"][0]["value"] == 200


async def test_future_edit_times_are_capped(client):
    h = await signup(client)
    await sync(client, h, changes=[ch("f:shake", 1, int(time.time() * 1000) + 10**10)])
    assert (await sync(client, h))["changes"][0]["at"] <= int(time.time() * 1000)
    await sync(client, h, changes=[ch("f:shake", 2, int(time.time() * 1000) + 1000)])
    assert (await sync(client, h))["changes"][0]["value"] == 2  # a correct clock can still win


async def test_deletes_are_tombstones(client):
    h = await signup(client)
    c = await sync(client, h, changes=[ch("m:weights:2026-10-01", 180.2, 1)])
    out = await sync(client, h, since=c["cursor"], changes=[ch("m:weights:2026-10-01", None, 2, deleted=True)])
    assert out["changes"] == [{"key": "m:weights:2026-10-01", "value": None, "deleted": True, "at": 2, "seq": out["cursor"]}]


async def test_duplicate_keys_in_one_batch_keep_the_newest(client):
    h = await signup(client)
    out = await sync(client, h, changes=[ch("f:shake", 1, 5), ch("f:shake", 2, 9), ch("f:shake", 3, 7)])
    assert [c["value"] for c in out["changes"]] == [2]


async def test_users_and_tools_are_separate(client):
    a, b = await signup(client), await signup(client)
    await sync(client, a, changes=[ch("f:shake", 1, 1)])
    assert (await sync(client, b))["changes"] == []
    assert (await sync(client, a, tool="unrot"))["changes"] == []


async def test_pages(client):
    h = await signup(client)
    for start in (0, 500, 1000):
        await sync(client, h, changes=[ch(f"m:seen:c{i}", i, 1) for i in range(start, start + 500)], tool="unrot")
    seen, cursor, more, pages = set(), 0, True, 0
    while more:
        out = await sync(client, h, since=cursor, tool="unrot")
        seen |= {c["key"] for c in out["changes"]}
        cursor, more, pages = out["cursor"], out["more"], pages + 1
    assert len(seen) == 1500 and pages == 3
    assert (await client.get("/sync/unrot/status", headers=h)).json() == {"records": 1500}


async def test_rejects_bad_input(client):
    h = await signup(client)
    assert (await client.post("/sync/nope", json={}, headers=h)).status_code == 404
    assert (await client.post("/sync/calories", json={"changes": [ch("k", 1, 1)] * 501}, headers=h)).status_code == 422
    assert (await client.post("/sync/calories", json={"changes": [ch("k" * 201, 1, 1)]}, headers=h)).status_code == 422
    assert (await client.post("/sync/calories", json={"changes": [ch("k", 1, -1)]}, headers=h)).status_code == 422
    assert (await client.post("/sync/calories", json={})).status_code == 401
