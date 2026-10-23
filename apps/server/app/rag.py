"""Retrieval for RAG, inside Postgres with pgvector: documents are split into chunks, embedded, and searched by
cosine distance with an HNSW index. Embeddings come from a small local model (fastembed, ONNX on CPU), so nothing
leaves the server and there's no API bill.

Collections are server-owned (e.g. "unrot-cards"): admins write, signed-in users search. Generation (asking an LLM
with the retrieved chunks) isn't here yet; add it next to `search` when a tool needs it.
"""

import hashlib
import re
import secrets
from collections.abc import Callable
from functools import lru_cache
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi import Path as PathParam
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import CurrentUser
from .config import settings
from .db import DB
from .models import EMBED_DIM, RagChunk, RagDocument

router = APIRouter(prefix="/rag", tags=["rag"])

Embed = Callable[[list[str]], list[list[float]]]
Collection = Annotated[str, PathParam(pattern=r"^[a-z0-9][a-z0-9-]{1,79}$")]
CHUNK = 900  # characters; small enough for the embedding model's 512-token window
OVERLAP = 120


@lru_cache
def _model():
    from fastembed import TextEmbedding  # imported lazily: loading the model takes a few seconds and ~130 MB

    s = settings()
    return TextEmbedding(s.embed_model, specific_model_path=s.embed_model_path)


def local_embed(texts: list[str]) -> list[list[float]]:
    return [v.tolist() for v in _model().embed(texts)]


def get_embed() -> Embed:
    """Dependency, so tests can swap in a fake."""
    return local_embed


EmbedDep = Annotated[Embed, Depends(get_embed)]


def chunks(text: str) -> list[str]:
    """Splits on paragraphs, packs them up to CHUNK characters, and hard-splits anything longer with some overlap."""
    out: list[str] = []
    buf = ""
    for para in [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]:
        while len(para) > CHUNK:
            out.append(para[:CHUNK])
            para = para[CHUNK - OVERLAP:]
        if buf and len(buf) + len(para) + 2 > CHUNK:
            out.append(buf)
            buf = ""
        buf = f"{buf}\n\n{para}" if buf else para
    if buf:
        out.append(buf)
    return out or [text[:CHUNK]]


async def ingest(db: AsyncSession, embed: Embed, collection: str, source_id: str, text: str,
                 title: str | None = None, meta: dict[str, Any] | None = None) -> tuple[RagDocument, bool]:
    """Adds or replaces a document. Returns (document, changed); unchanged text and metadata skip re-embedding."""
    meta = meta or {}
    digest = hashlib.sha256(f"{title}\0{text}\0{sorted(meta.items())}".encode()).hexdigest()
    doc = (await db.execute(select(RagDocument).where(RagDocument.collection == collection, RagDocument.source_id == source_id))).scalar_one_or_none()
    if doc and doc.content_hash == digest:
        return doc, False
    if doc:
        await db.execute(delete(RagChunk).where(RagChunk.document_id == doc.id))
        doc.title, doc.text, doc.meta, doc.content_hash = title, text, meta, digest
    else:
        doc = RagDocument(collection=collection, source_id=source_id, title=title, text=text, meta=meta, content_hash=digest)
        db.add(doc)
    await db.flush()
    parts = chunks(text)
    vectors = await run_in_threadpool(embed, parts)  # CPU-bound: never on the event loop
    for i, (part, vec) in enumerate(zip(parts, vectors, strict=True)):
        if len(vec) != EMBED_DIM:
            raise ValueError(f"embedding has {len(vec)} dimensions, the table expects {EMBED_DIM}")
        db.add(RagChunk(document_id=doc.id, collection=collection, ordinal=i, text=part, embedding=vec))
    return doc, True


class Hit(BaseModel):
    source_id: str
    title: str | None
    text: str = Field(description="The best-matching chunk")
    score: float = Field(description="Cosine similarity, -1…1")
    meta: dict[str, Any]


async def search(db: AsyncSession, embed: Embed, collection: str, query: str, k: int = 5) -> list[Hit]:
    """The k best documents for `query` (best chunk per document)."""
    [qv] = await run_in_threadpool(embed, [query])
    return await _nearest(db, collection, qv, k, set())


async def similar(db: AsyncSession, collection: str, source_id: str, k: int = 5) -> list[Hit]:
    """Documents nearest to an already-ingested one, using its stored first-chunk embedding (no model call)."""
    vec = await db.scalar(
        select(RagChunk.embedding).join(RagDocument, RagDocument.id == RagChunk.document_id)
        .where(RagDocument.collection == collection, RagDocument.source_id == source_id, RagChunk.ordinal == 0)
    )
    return [] if vec is None else await _nearest(db, collection, list(vec), k, {source_id})


async def _nearest(db: AsyncSession, collection: str, qv: list[float], k: int, exclude: set[str]) -> list[Hit]:
    dist = RagChunk.embedding.cosine_distance(qv)
    rows = (await db.execute(
        select(RagChunk.text, RagDocument.source_id, RagDocument.title, RagDocument.meta, dist.label("d"))
        .join(RagDocument, RagDocument.id == RagChunk.document_id)
        .where(RagChunk.collection == collection)
        .order_by(dist)
        .limit((k + len(exclude)) * 4)  # several chunks can come from one document
    )).all()
    hits: dict[str, Hit] = {}
    for text, source_id, title, meta, d in rows:
        if source_id not in hits and source_id not in exclude:
            hits[source_id] = Hit(source_id=source_id, title=title, text=text, score=round(1 - d, 4), meta=meta)
    return list(hits.values())[:k]


def require_admin(x_admin_token: Annotated[str | None, Header()] = None) -> None:
    expected = settings().admin_token
    if not expected:
        raise HTTPException(503, "Admin routes are off (set ADMIN_TOKEN)")
    if not x_admin_token or not secrets.compare_digest(x_admin_token, expected):
        raise HTTPException(403, "Admin token required")


class DocumentIn(BaseModel):
    source_id: str = Field(min_length=1, max_length=200)
    title: str | None = Field(None, max_length=500)
    text: str = Field(min_length=1, max_length=200_000)
    meta: dict[str, Any] = Field(default_factory=dict)


class SearchIn(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    k: int = Field(5, ge=1, le=20)


@router.put("/{collection}/documents", dependencies=[Depends(require_admin)])
async def put_document(collection: Collection, body: DocumentIn, db: DB, embed: EmbedDep) -> dict[str, Any]:
    doc, changed = await ingest(db, embed, collection, body.source_id, body.text, body.title, body.meta)
    await db.commit()
    return {"id": str(doc.id), "changed": changed}


@router.delete("/{collection}/documents/{source_id}", status_code=204, dependencies=[Depends(require_admin)])
async def delete_document(collection: Collection, source_id: str, db: DB) -> None:
    await db.execute(delete(RagDocument).where(RagDocument.collection == collection, RagDocument.source_id == source_id))
    await db.commit()


@router.post("/{collection}/search", response_model=list[Hit])
async def search_route(collection: Collection, body: SearchIn, db: DB, embed: EmbedDep, _: CurrentUser) -> list[Hit]:
    return await search(db, embed, collection, body.query, body.k)
