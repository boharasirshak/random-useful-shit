"""Offline-first sync. Each tool's on-device data is split into records (one per field, or per day / per card);
the app sends the ones it changed since last time and gets back everything newer than its cursor.

Conflicts: last write wins per record, by the device's edit time. Edit times from the future are capped at now,
so one device with a wrong clock can't win forever.
"""

import time
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException
from fastapi import Path as PathParam
from pydantic import BaseModel, Field
from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert

from .auth import CurrentUser
from .db import DB
from .models import SyncRecord, sync_seq

router = APIRouter(prefix="/sync", tags=["sync"])

TOOLS = {"calories", "unrot"}  # a tool must be listed here to sync
PAGE = 500

Tool = Annotated[str, PathParam(pattern=r"^[a-z][a-z0-9-]{1,39}$")]


class Change(BaseModel):
    key: str = Field(min_length=1, max_length=200)
    value: Any = None
    deleted: bool = False
    at: int = Field(ge=0, description="When the device made this change, ms since epoch")


class SyncIn(BaseModel):
    since: int = Field(0, ge=0, description="The cursor from the last sync; 0 the first time")
    changes: list[Change] = Field(default_factory=list, max_length=PAGE)


class ChangeOut(Change):
    seq: int


class SyncOut(BaseModel):
    changes: list[ChangeOut]
    cursor: int
    more: bool = Field(description="True when there's another page: call again with the new cursor and no changes")


@router.post("/{tool}", response_model=SyncOut)
async def sync(tool: Tool, body: SyncIn, db: DB, user: CurrentUser) -> SyncOut:
    if tool not in TOOLS:
        raise HTTPException(404, f"Unknown tool {tool!r}")
    # One writer per user and tool at a time, so sequence numbers become visible in order and no change is skipped.
    await db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:k))"), {"k": f"{user.id}:{tool}"})
    if body.changes:
        now = int(time.time() * 1000)
        latest: dict[str, Change] = {}
        for c in body.changes:  # the same key twice in one batch: keep the newer
            if c.key not in latest or c.at >= latest[c.key].at:
                latest[c.key] = c
        rows = [{"user_id": user.id, "tool": tool, "key": c.key, "value": None if c.deleted else c.value,
                 "deleted": c.deleted, "at": min(c.at, now)} for c in latest.values()]
        stmt = insert(SyncRecord).values(rows)
        await db.execute(stmt.on_conflict_do_update(
            index_elements=[SyncRecord.user_id, SyncRecord.tool, SyncRecord.key],
            set_={"value": stmt.excluded.value, "deleted": stmt.excluded.deleted, "at": stmt.excluded.at, "seq": sync_seq.next_value()},
            where=SyncRecord.at < stmt.excluded.at,
        ))
    found = (await db.execute(
        select(SyncRecord).where(SyncRecord.user_id == user.id, SyncRecord.tool == tool, SyncRecord.seq > body.since)
        .order_by(SyncRecord.seq).limit(PAGE + 1)
    )).scalars().all()
    await db.commit()
    page = found[:PAGE]
    cursor = page[-1].seq if page else body.since
    return SyncOut(changes=[ChangeOut(key=r.key, value=r.value, deleted=r.deleted, at=r.at, seq=r.seq) for r in page],
                   cursor=cursor, more=len(found) > PAGE)


@router.get("/{tool}/status")
async def status(tool: Tool, db: DB, user: CurrentUser) -> dict[str, int]:
    """How many records the server holds for this tool (for the Account screen)."""
    n = await db.scalar(select(func.count()).select_from(SyncRecord).where(SyncRecord.user_id == user.id, SyncRecord.tool == tool, SyncRecord.deleted.is_(False)))
    return {"records": n or 0}
