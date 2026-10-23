"""Admin commands. Run: uv run python -m app.cli ingest-unrot"""

import asyncio
import sys

from .db import sessions
from .rag import local_embed
from .unrot import ingest_catalog


async def ingest_unrot() -> None:
    async with sessions()() as db:
        n, changed = await ingest_catalog(db, local_embed)
    print(f"unrot-cards: {n} cards, {changed} embedded")


COMMANDS = {"ingest-unrot": ingest_unrot}

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in COMMANDS:
        sys.exit(f"usage: python -m app.cli {{{','.join(COMMANDS)}}}")
    asyncio.run(COMMANDS[sys.argv[1]]())
