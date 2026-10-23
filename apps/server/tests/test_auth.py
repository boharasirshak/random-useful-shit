import pytest

from tests.conftest import signup

pytestmark = pytest.mark.anyio


async def test_anonymous_account(client):
    h = await signup(client)
    me = (await client.get("/auth/me", headers=h)).json()
    assert me["anonymous"] is True and me["email"] is None


async def test_needs_a_valid_token(client):
    assert (await client.get("/auth/me")).status_code == 401
    assert (await client.get("/auth/me", headers={"Authorization": "Bearer nope"})).status_code == 401


async def test_google_upgrades_the_anonymous_account_in_place(client):
    h = await signup(client)
    before = (await client.get("/auth/me", headers=h)).json()
    r = (await client.post("/auth/google", json={"id_token": "g:alice"}, headers=h)).json()
    assert r["user"]["id"] == before["id"] and r["user"]["email"] == "alice@example.com" and not r["merged"]
    assert (await client.get("/auth/me", headers=h)).status_code == 401  # the old token is replaced
    assert (await client.get("/auth/me", headers={"Authorization": f"Bearer {r['token']}"})).json()["anonymous"] is False


async def test_second_device_folds_into_the_existing_account(client):
    first = (await client.post("/auth/google", json={"id_token": "g:alice"})).json()
    h2 = await signup(client)
    await client.post("/sync/unrot", json={"changes": [{"key": "f:topics", "value": ["math"], "at": 1}]}, headers=h2)
    r = (await client.post("/auth/google", json={"id_token": "g:alice"}, headers=h2)).json()
    assert r["user"]["id"] == first["user"]["id"] and r["merged"] is True
    # The anonymous account and its data are gone; the device re-sends under the real account.
    h = {"Authorization": f"Bearer {r['token']}"}
    assert (await client.post("/sync/unrot", json={}, headers=h)).json()["changes"] == []


async def test_bad_google_token(client):
    assert (await client.post("/auth/google", json={"id_token": "forged"})).status_code == 401


async def test_logout_and_delete(client):
    h = await signup(client)
    assert (await client.post("/auth/logout", headers=h)).status_code == 204
    assert (await client.get("/auth/me", headers=h)).status_code == 401
    h = await signup(client)
    await client.post("/sync/calories", json={"changes": [{"key": "f:shake", "value": 160, "at": 1}]}, headers=h)
    assert (await client.delete("/auth/me", headers=h)).status_code == 204
    assert (await client.get("/auth/me", headers=h)).status_code == 401


async def test_anonymous_signups_are_rate_limited(client):
    codes = [(await client.post("/auth/anonymous", json={})).status_code for _ in range(21)]
    assert codes[:20] == [200] * 20 and codes[20] == 429
