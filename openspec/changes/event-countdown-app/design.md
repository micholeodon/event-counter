## Context

Greenfield project. The repo currently contains only a placeholder `main.py` and an empty
`pyproject.toml` (no dependencies, Python ≥ 3.13). The goal is a tiny, single-user-class
web app for two friends to share a countdown to videocalls across the Warsaw and Guarda
timezones, deployed as a Docker container on a VPS. No auth, low traffic, no scaling
concerns. The dominant complexity is timezone handling and a couple of frontend states
(hero vs compact, in-progress linger), not backend scale.

## Goals / Non-Goals

**Goals:**
- Store event times canonically in UTC; never depend on server timezone.
- Live, per-second countdowns rendered in each viewer's own browser-local timezone.
- A clear visual hierarchy: one large centered hero bar + smaller, narrower compact bars.
- Configurable in-progress linger window (default 1h) computed consistently on the client.
- Per-event timezone preview: city → IANA with dropdown fallback, remembered locally.
- Trivial Docker deployment with SQLite persisted on a volume.

**Non-Goals:**
- No authentication, accounts, or multi-tenant separation.
- No overlap detection or edit/reschedule flow (delete + re-add instead).
- No recurring events, reminders, or notifications.
- No build pipeline for the frontend (plain HTML/CSS/JS served as static files).
- No real-time server push; the client polls and ticks locally.

## Decisions

### Backend: FastAPI + Uvicorn
The user is familiar with FastAPI. It serves the JSON API and the static frontend from
one process. Run under Uvicorn as the ASGI server inside the container.
*Alternative:* Flask — rejected only because the user already knows FastAPI; either fits.

### Storage: SQLite via the standard library (`sqlite3`)
A single table is enough; no ORM needed for one entity. Keeps dependencies minimal and
the DB is a single file that maps cleanly to a Docker volume. The schema is created on
startup if absent (`CREATE TABLE IF NOT EXISTS`).
*Alternative:* SQLModel/SQLAlchemy — rejected as overkill for one table.

Schema:
```
events(
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  title     TEXT NOT NULL,
  start_utc TEXT NOT NULL   -- ISO-8601 UTC, e.g. 2026-06-05T17:00:00Z
)
```
Times are stored as ISO-8601 UTC strings for human-readable inspection; the API also
returns them in this form. The list endpoint sorts by `start_utc ASC`.

### Time model: UTC everywhere on the server, local rendering on the client
The API only ever speaks UTC. The Add-Event modal collects a local date+time using native
`<input type="date">` and `<input type="time">`, then converts to UTC on the client before
POSTing (build a `Date` from the local parts, send its ISO UTC string). Display likewise
converts UTC → local using `Intl.DateTimeFormat` with the browser's resolved timezone.
This keeps the server timezone-agnostic and means it doesn't matter what TZ the container
runs in.

### Hero vs compact + linger: computed on the client each tick
The client fetches the full event list (UTC) and, on every 1-second tick, computes
"now" and derives state purely client-side:
- An event is **in-progress** if `start <= now < start + linger`.
- The **hero** is the in-progress event if one exists, otherwise the earliest event with
  `start > now`. (With non-overlapping events, at most one is in-progress.)
- All other future events (and not-yet-elapsed events) render as compact bars, sorted
  ascending. Events whose linger window has fully elapsed are not displayed.

The linger duration is injected into the page from the server config (so the ENV var is
the single source of truth) — e.g. rendered into a `<script>` constant or exposed via a
tiny `/api/config` endpoint. Decision: expose `linger_seconds` via the page at load.

### Countdown rendering
A single `setInterval(…, 1000)` loop recomputes all visible countdowns from the absolute
target timestamps (not by decrementing counters), so drift and backgrounded-tab throttling
self-correct. Format as `Xd Xh Xm Xs`, omitting leading zero-value units (e.g. no `0d`).

### Timezone preview: city → IANA with dropdown fallback
Resolve city names to IANA zones. To avoid a heavy geocoding dependency, ship a curated
city→IANA lookup table (covering the friends' cities plus common ones) and use the full
IANA list (`Intl.supportedValuesOf('timeZone')`) for the dropdown fallback. Rendering the
event time in the chosen zone uses `Intl.DateTimeFormat` with `timeZone` set — no server
round-trip. The last-used zone is stored under a localStorage key and pre-selected next
time.
*Alternative:* server-side geocoding (geopy + timezonefinder) — rejected as a heavy
dependency for a two-person tool; can be revisited if the curated table proves too small.

### Frontend delivery: static files, no build
Plain `index.html` + `app.js` + `styles.css` served by FastAPI's `StaticFiles` (or a
template route). No bundler, no framework — matches the "vanilla JS, no build step" goal.

### Configuration via environment variables
- `LINGER_SECONDS` (default `3600`) — in-progress window.
- `DB_PATH` (default e.g. `/data/events.db`) — SQLite file location, mounted as a volume.
Defaults are applied when unset; the `/data` directory is the documented volume mount.

### Packaging
A single `Dockerfile` (slim Python base) installs deps from `pyproject.toml`, copies the
app + static assets, exposes the app port, and runs Uvicorn. `/data` is the volume for the
SQLite file.

## Risks / Trade-offs

- **Client-clock skew** → If a viewer's device clock is wrong, their countdown is wrong.
  Acceptable for a two-person tool; mitigation (optional) is sending server time to
  compute an offset. Out of scope for v1.
- **Curated city table is incomplete** → Unknown cities won't resolve. Mitigation: the
  IANA dropdown fallback always works, and the table is easy to extend.
- **No overlap enforcement** → Two events could overlap, making "in-progress" ambiguous.
  Mitigation: the hero rule (in-progress first, else earliest future) is deterministic
  even if it overlaps; users are trusted not to double-book, per the proposal.
- **Backgrounded-tab throttling** → Browsers throttle timers in inactive tabs. Mitigated
  by recomputing from absolute timestamps rather than decrementing, so the display
  corrects on focus.
- **DST around input/preview** → Conversions rely on the browser's `Intl`/`Date` and IANA
  data, which handle DST correctly; the curated table only maps city→IANA, never fixed
  offsets, so DST stays correct.

## Open Questions

- Should the linger window be exposed via a dedicated `/api/config` endpoint instead of
  inlining it into the page? (Leaning inline at load for simplicity.)
- How large should the initial curated city→timezone table be? (Start small: the two
  friends' cities plus a handful of common ones; extend on demand.)
