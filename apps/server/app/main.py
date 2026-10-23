"""The shared server. Each tool is a router under its own prefix; shared pieces (auth, sync, rag) are routers too."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from . import auth, rag, sync, unrot
from .config import settings
from .db import engine
from .ratelimit import redis

MAX_BODY = 1024 * 1024  # bytes; a full first sync of a tool is the biggest thing anyone sends


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await engine().dispose()
    if r := redis():
        await r.aclose()


app = FastAPI(title="Random Useful Shit API", version="0.2.0", lifespan=lifespan,
              description="Accounts, offline-first sync and retrieval for the Random Useful Shit tools. Stores as little as it can.")
# No cookies: auth is a bearer token, so allowing any origin doesn't expose anything. Narrow it with CORS_ORIGINS if you like.
app.add_middleware(CORSMiddleware, allow_origins=settings().cors_origins.split(","),
                   allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type"])


# ponytail: trusts Content-Length; chunked bodies without one get through to Pydantic's limits. Set a body limit
# in the reverse proxy too when this faces the internet.
@app.middleware("http")
async def limit_body(request: Request, call_next):
    if int(request.headers.get("content-length") or 0) > MAX_BODY:
        return JSONResponse({"detail": "Request body too large"}, status_code=413)
    return await call_next(request)


@app.get("/health", tags=["server"])
async def health() -> dict[str, str]:
    """Liveness and readiness: checks the database (and Redis, when set)."""
    async with engine().connect() as conn:
        await conn.execute(text("SELECT 1"))
    if r := redis():
        await r.ping()
    return {"status": "ok"}


for module in (auth, sync, rag, unrot):
    app.include_router(module.router)
