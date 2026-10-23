"""Unrot: the card catalog, and related cards by meaning (RAG over the catalog).

Each user's likes, saves and taste model sync through /sync/unrot like any other tool's data.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import Path as PathParam
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .config import settings
from .db import DB
from .rag import EmbedDep, ingest, similar
from .ratelimit import limit

router = APIRouter(prefix="/unrot", tags=["unrot"])
COLLECTION = "unrot-cards"


class Version(BaseModel):
    version: str


@lru_cache(maxsize=4)
def _catalog(path: Path, mtime: float) -> dict[str, Any]:
    return json.loads(path.read_text())


def catalog_data() -> dict[str, Any]:
    p = settings().unrot_catalog
    return _catalog(p, p.stat().st_mtime)


@router.get("/catalog/version", response_model=Version)
def catalog_version() -> Version:
    """The app checks this first and downloads the catalog only when it changed."""
    return Version(version=catalog_data()["version"])


@router.get("/catalog", response_class=FileResponse, responses={200: {"content": {"application/json": {}}, "description": "{ version, cards }"}})
def catalog() -> FileResponse:
    return FileResponse(settings().unrot_catalog, media_type="application/json")


class Related(BaseModel):
    id: str
    score: float


CardId = Annotated[str, PathParam(pattern=r"^[a-z]+-\d{3}$")]


@router.get("/related/{card_id}", response_model=list[Related], dependencies=[Depends(limit("unrot-related", 120, 60))])
async def related(card_id: CardId, db: DB, k: Annotated[int, Query(ge=1, le=10)] = 3) -> list[Related]:
    """Cards about the same idea, even when they share no tags (e.g. Seneca on time next to a Buddhist verse on
    impermanence). Empty until the catalog has been embedded: `uv run python -m app.cli ingest-unrot`."""
    if not any(c["id"] == card_id for c in catalog_data()["cards"]):
        raise HTTPException(404, "No such card")
    return [Related(id=h.source_id, score=h.score) for h in await similar(db, COLLECTION, card_id, k)]


def card_text(c: dict[str, Any]) -> str:
    return "\n\n".join(x for x in [c.get("title"), c["text"], c["more"], c.get("author")] if x)


async def ingest_catalog(db: DB, embed: EmbedDep) -> tuple[int, int]:
    """Embeds every card that's new or changed. Returns (cards, changed)."""
    cards = catalog_data()["cards"]
    changed = 0
    for c in cards:
        _, did = await ingest(db, embed, COLLECTION, c["id"], card_text(c), c.get("title"), {"topic": c["topic"], "type": c["type"]})
        changed += did
    await db.commit()
    return len(cards), changed
