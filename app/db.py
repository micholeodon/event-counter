"""SQLite persistence for events. Single table, times stored as ISO-8601 UTC strings."""

import os
import sqlite3
from pathlib import Path

from .config import DB_PATH


def _connect() -> sqlite3.Connection:
    """Open a connection to the configured DB, creating the parent dir if needed."""
    parent = Path(DB_PATH).parent
    if str(parent) and parent != Path("."):
        os.makedirs(parent, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the events table if it does not already exist."""
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                title     TEXT NOT NULL,
                start_utc TEXT NOT NULL
            )
            """
        )


def create_event(title: str, start_utc: str) -> dict:
    """Insert an event and return it with its assigned id."""
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO events (title, start_utc) VALUES (?, ?)",
            (title, start_utc),
        )
        return {"id": cur.lastrowid, "title": title, "start_utc": start_utc}


def list_events() -> list[dict]:
    """Return all events sorted by start_utc ascending (soonest first)."""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT id, title, start_utc FROM events ORDER BY start_utc ASC"
        ).fetchall()
        return [dict(row) for row in rows]


def delete_event(event_id: int) -> bool:
    """Delete an event by id. Return True if a row was removed."""
    with _connect() as conn:
        cur = conn.execute("DELETE FROM events WHERE id = ?", (event_id,))
        return cur.rowcount > 0
