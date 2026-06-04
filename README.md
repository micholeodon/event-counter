# Event Countdown

Shared, no-auth web page showing a live countdown to the next event (e.g., videocall).
Built for friends in different timezones: open the
same URL and each sees the countdown plus event times in their own browser-local
timezone.

## Features

- Live per-second countdowns. Nearest event shown as a large, centered **hero** bar;
  later events as smaller, narrower **compact** bars.
- Times stored in UTC, displayed in each viewer's local timezone.
- **IN PROGRESS** linger state for a configurable window after an event starts
  (default 1 hour, configurable); during it the hero also counts down to the next event.
- Add events via a modal (entered in local time, saved as UTC).
- Delete events with a confirmation prompt.
- Per-event **timezone preview**: type a city (resolved to IANA) or pick from a
  dropdown; last-used zone remembered in localStorage.

## Run locally

```bash
pip install -e .
DB_PATH=./events.db uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000. The DB defaults to `/data/events.db`; for local runs set a
writable path via `DB_PATH` as shown.

## Run with Docker

```bash
docker build -t event-countdown .
docker run -d -p 8000:8000 -v event_data:/data event-countdown
```

The named volume `event_data` persists the SQLite database across restarts and rebuilds.

## Configuration (environment variables)

| Variable         | Default            | Description                                   |
|------------------|--------------------|-----------------------------------------------|
| `LINGER_SECONDS` | `3600`             | How long an event stays IN PROGRESS (seconds) |
| `DB_PATH`        | `/data/events.db`  | SQLite database file path                     |

Example with a 30-minute linger:

```bash
docker run -d -p 8000:8000 -v event_data:/data -e LINGER_SECONDS=1800 event-countdown
```

## API

| Method | Path                | Body / Result                                |
|--------|---------------------|----------------------------------------------|
| GET    | `/api/events`       | List events, ascending by start time         |
| POST   | `/api/events`       | `{ "title", "start_utc" }` → created event   |
| DELETE | `/api/events/{id}`  | 204 on delete, 404 if missing                |
