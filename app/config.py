"""Environment-based configuration with documented defaults."""

import os

# In-progress linger window in seconds. Default 1 hour.
LINGER_SECONDS = int(os.environ.get("LINGER_SECONDS", "3600"))

# SQLite database file path. Default lives under /data so it maps to a Docker volume.
DB_PATH = os.environ.get("DB_PATH", "/data/events.db")
