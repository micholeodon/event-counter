# Run the dev server with live reload on a local SQLite DB.
dev:
    DB_PATH=./events.db uv run uvicorn app.main:app --reload --port 8000
