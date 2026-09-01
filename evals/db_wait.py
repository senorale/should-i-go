"""Wait for the database to accept connections before running evals."""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))

from sqlalchemy import text
from db import engine

MAX_RETRIES = 10
RETRY_INTERVAL = 3


def wait_for_db():
    """Block until DB responds to a simple query."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("  DB ready.")
            return
        except Exception:
            print(f"  Waiting for DB... ({attempt}/{MAX_RETRIES})")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_INTERVAL)

    print("  DB not available after retries. Exiting.")
    sys.exit(1)
