"""Users, sessions, sync records, RAG documents and chunks (pgvector).

Revision ID: 0001
Revises:
Create Date: 2026-10-23
"""

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE SEQUENCE sync_seq")
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("google_sub", sa.String(255), unique=True),
        sa.Column("email", sa.String(320)),
        sa.Column("name", sa.String(200)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "sessions",
        sa.Column("token_hash", sa.LargeBinary(32), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("device", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "sync_records",
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tool", sa.String(40), primary_key=True),
        sa.Column("key", sa.String(200), primary_key=True),
        sa.Column("value", postgresql.JSONB()),
        sa.Column("deleted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("at", sa.BigInteger(), nullable=False),
        sa.Column("seq", sa.BigInteger(), server_default=sa.text("nextval('sync_seq')"), nullable=False),
    )
    op.create_index("sync_records_pull", "sync_records", ["user_id", "tool", "seq"])
    op.create_table(
        "rag_documents",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("collection", sa.String(80), nullable=False),
        sa.Column("source_id", sa.String(200), nullable=False),
        sa.Column("title", sa.String(500)),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("meta", postgresql.JSONB(), server_default="{}", nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("collection", "source_id"),
    )
    op.create_table(
        "rag_chunks",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("document_id", sa.Uuid(), sa.ForeignKey("rag_documents.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("collection", sa.String(80), nullable=False, index=True),
        sa.Column("ordinal", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("embedding", Vector(384), nullable=False),
    )
    op.create_index("rag_chunks_embedding", "rag_chunks", ["embedding"], postgresql_using="hnsw",
                    postgresql_ops={"embedding": "vector_cosine_ops"})


def downgrade() -> None:
    op.drop_table("rag_chunks")
    op.drop_table("rag_documents")
    op.drop_table("sync_records")
    op.drop_table("sessions")
    op.drop_table("users")
    op.execute("DROP SEQUENCE sync_seq")
