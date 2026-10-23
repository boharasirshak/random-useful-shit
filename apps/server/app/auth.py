"""Who is who. Every install gets an anonymous account the first time it's online, so sync works with no sign-up.
"Sign in with Google" then links that account to a person, so their other devices land in the same place.

Tokens are opaque random strings; the server stores only their SHA-256. They last `session_days`, renewed on use.
"""

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from pydantic import BaseModel, Field
from sqlalchemy import delete, select

from .config import settings
from .db import DB
from .models import AuthSession, User
from .ratelimit import limit

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)


def hash_token(token: str) -> bytes:
    return hashlib.sha256(token.encode()).digest()


async def new_session(db: DB, user: User, device: str | None) -> str:
    token = secrets.token_urlsafe(32)
    db.add(AuthSession(token_hash=hash_token(token), user_id=user.id, device=device,
                       expires_at=datetime.now(UTC) + timedelta(days=settings().session_days)))
    return token


async def optional_session(db: DB, creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> AuthSession | None:
    if not creds:
        return None
    s = await db.get(AuthSession, hash_token(creds.credentials))
    now = datetime.now(UTC)
    if not s or s.expires_at < now:
        raise HTTPException(401, "Signed out. Sign in again.", headers={"WWW-Authenticate": "Bearer"})
    if now - s.last_used_at > timedelta(days=1):  # sliding expiry, written at most once a day
        s.last_used_at, s.expires_at = now, now + timedelta(days=settings().session_days)
        await db.commit()
    return s


async def current_session(s: Annotated[AuthSession | None, Depends(optional_session)]) -> AuthSession:
    if not s:
        raise HTTPException(401, "Sign in first", headers={"WWW-Authenticate": "Bearer"})
    return s


async def current_user(db: DB, s: Annotated[AuthSession, Depends(current_session)]) -> User:
    user = await db.get(User, s.user_id)
    if not user:
        raise HTTPException(401, "Account deleted")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


class UserOut(BaseModel):
    id: uuid.UUID
    anonymous: bool
    email: str | None = None
    name: str | None = None


class SessionOut(BaseModel):
    token: str
    user: UserOut
    merged: bool = Field(False, description="True when this device's anonymous account was folded into an existing one: re-send all local data")


class DeviceIn(BaseModel):
    device: str | None = Field(None, max_length=100, description="Shown in a future 'your devices' list, e.g. 'iPhone'")


class GoogleIn(DeviceIn):
    id_token: str = Field(max_length=4096)


def out(user: User) -> UserOut:
    return UserOut(id=user.id, anonymous=user.anonymous, email=user.email, name=user.name)


@router.post("/anonymous", response_model=SessionOut, dependencies=[Depends(limit("auth-anon", 20, 3600))])
async def anonymous(db: DB, body: DeviceIn) -> SessionOut:
    """A new anonymous account for this install."""
    user = User()
    db.add(user)
    await db.flush()
    token = await new_session(db, user, body.device)
    await db.commit()
    return SessionOut(token=token, user=out(user))


def verify_google(token: str) -> dict:
    ids = settings().google_ids
    if not ids:
        raise HTTPException(503, "Google sign-in isn't set up on this server (GOOGLE_CLIENT_IDS)")
    try:
        info = google_id_token.verify_oauth2_token(token, google_requests.Request(), audience=ids)
    except ValueError as e:
        raise HTTPException(401, f"Google sign-in failed: {e}") from e
    if not info.get("email_verified"):
        raise HTTPException(401, "Google account email isn't verified")
    return info


@router.post("/google", response_model=SessionOut, dependencies=[Depends(limit("auth-google", 30, 3600))])
async def google(db: DB, body: GoogleIn, current: Annotated[AuthSession | None, Depends(optional_session)]) -> SessionOut:
    """Signs in with a Google ID token. Called with this device's anonymous token, it upgrades that account in place,
    or, if the Google account already exists, folds the anonymous one into it (the app then re-sends its data)."""
    info = await run_in_threadpool(verify_google, body.id_token)
    me = await db.get(User, current.user_id) if current else None
    user = (await db.execute(select(User).where(User.google_sub == info["sub"]))).scalar_one_or_none()
    merged = False
    if user is None and me is not None and me.anonymous:
        user = me  # upgrade in place: nothing to move
    elif user is None:
        user = User()
        db.add(user)
    elif me is not None and me.id != user.id and me.anonymous:
        await db.delete(me)  # its data comes back from the device under the real account
        merged = True
    user.google_sub, user.email, user.name = info["sub"], info.get("email"), info.get("name")
    await db.flush()
    token = await new_session(db, user, body.device)
    if current:
        await db.execute(delete(AuthSession).where(AuthSession.token_hash == current.token_hash))
    await db.commit()
    return SessionOut(token=token, user=out(user), merged=merged)


@router.post("/logout", status_code=204)
async def logout(db: DB, s: Annotated[AuthSession, Depends(current_session)]) -> None:
    await db.execute(delete(AuthSession).where(AuthSession.token_hash == s.token_hash))
    await db.commit()


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> UserOut:
    return out(user)


@router.delete("/me", status_code=204)
async def delete_me(db: DB, user: CurrentUser) -> None:
    """Deletes the account and everything stored for it (sessions, synced data). Devices keep their own copy."""
    await db.delete(user)
    await db.commit()
