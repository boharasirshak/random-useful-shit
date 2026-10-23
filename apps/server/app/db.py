"""Postgres via SQLAlchemy (async). One database for every tool; tables are prefixed by tool when tool-specific."""

from collections.abc import AsyncIterator
from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from .config import settings


class Base(DeclarativeBase):
    pass


@lru_cache
def engine() -> AsyncEngine:
    s = settings()
    if s.testing:
        return create_async_engine(s.database_url, poolclass=NullPool)
    return create_async_engine(s.database_url, pool_size=s.db_pool_size, max_overflow=s.db_pool_size, pool_pre_ping=True)


@lru_cache
def sessions() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine(), expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with sessions()() as db:
        yield db


DB = Annotated[AsyncSession, Depends(get_db)]
