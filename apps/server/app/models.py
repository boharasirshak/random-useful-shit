"""Every table. Alembic reads this module's metadata; change a model, then add a migration in migrations/versions/."""

import uuid
from datetime import datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Identity, Index, Integer, LargeBinary, Sequence, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base

EMBED_DIM = 384


class User(Base):
    """Anonymous until signed in with Google; the same row, so nothing has to move."""

    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True)
    email: Mapped[str | None] = mapped_column(String(320))
    name: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    @property
    def anonymous(self) -> bool:
        return self.google_sub is None


class AuthSession(Base):
    """A device's sign-in. The app holds the token; we keep only its SHA-256, so a database leak can't be replayed."""

    __tablename__ = "sessions"
    token_hash: Mapped[bytes] = mapped_column(LargeBinary(32), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    device: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


sync_seq = Sequence("sync_seq")


class SyncRecord(Base):
    """One piece of a tool's on-device data (e.g. calories / m:logs:2026-10-23). Last write wins, by the device's edit time.

    `seq` comes from one global sequence and changes on every write, so "everything since seq N" is a cheap index scan.
    """

    __tablename__ = "sync_records"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    tool: Mapped[str] = mapped_column(String(40), primary_key=True)
    key: Mapped[str] = mapped_column(String(200), primary_key=True)
    value: Mapped[Any] = mapped_column(JSONB, nullable=True)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    at: Mapped[int] = mapped_column(BigInteger)  # device edit time, ms since epoch
    seq: Mapped[int] = mapped_column(BigInteger, sync_seq, server_default=sync_seq.next_value())
    __table_args__ = (Index("sync_records_pull", "user_id", "tool", "seq"),)


class RagDocument(Base):
    """A source document in a collection (e.g. one Unrot card in "unrot-cards"). Chunks hold the embeddings."""

    __tablename__ = "rag_documents"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    collection: Mapped[str] = mapped_column(String(80))
    source_id: Mapped[str] = mapped_column(String(200))
    title: Mapped[str | None] = mapped_column(String(500))
    text: Mapped[str] = mapped_column(Text)
    meta: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, server_default="{}")
    content_hash: Mapped[str] = mapped_column(String(64))  # skip re-embedding unchanged documents
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("collection", "source_id"),)


class RagChunk(Base):
    __tablename__ = "rag_chunks"
    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rag_documents.id", ondelete="CASCADE"), index=True)
    collection: Mapped[str] = mapped_column(String(80), index=True)  # copied from the document, for filtered search
    ordinal: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBED_DIM))
    __table_args__ = (
        Index("rag_chunks_embedding", "embedding", postgresql_using="hnsw", postgresql_ops={"embedding": "vector_cosine_ops"}),
    )
