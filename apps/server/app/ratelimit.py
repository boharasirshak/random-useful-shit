"""Fixed-window rate limits. Redis when REDIS_URL is set (shared by every worker), else in-process memory."""

import time
from functools import lru_cache

from fastapi import HTTPException, Request
from redis.asyncio import Redis

from .config import settings

_memory: dict[str, tuple[int, int]] = {}  # key -> (window, count)


@lru_cache
def redis() -> Redis | None:
    url = settings().redis_url
    return Redis.from_url(url) if url else None


async def hit(key: str, limit: int, window: int) -> bool:
    """Counts one request; False once `limit` is passed within the current `window` seconds."""
    slot = int(time.time()) // window
    r = redis()
    if r:
        k = f"rl:{key}:{slot}"
        n = await r.incr(k)
        if n == 1:
            await r.expire(k, window)
        return n <= limit
    # ponytail: per-process and never pruned beyond the current window per key; fine for one worker, set REDIS_URL for more.
    w, n = _memory.get(key, (slot, 0))
    n = n + 1 if w == slot else 1
    _memory[key] = (slot, n)
    return n <= limit


def limit(name: str, per: int, window: int):
    """Dependency: at most `per` requests per client IP per `window` seconds. Behind a proxy, run uvicorn with --proxy-headers."""

    async def check(request: Request) -> None:
        ip = request.client.host if request.client else "unknown"
        if not await hit(f"{name}:{ip}", per, window):
            raise HTTPException(429, "Too many requests, slow down")

    return check
