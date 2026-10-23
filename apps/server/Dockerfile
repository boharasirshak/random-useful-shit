FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /bin/uv
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY . .
# Migrate, then serve. --proxy-headers so rate limits see the real client IP behind a reverse proxy.
CMD ["sh", "-c", "uv run --no-dev alembic upgrade head && uv run --no-dev fastapi run app/main.py --port 8000 --proxy-headers --workers 2"]
