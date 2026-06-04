## Why

Two people in different timezones (Warsaw and Guarda, Portugal) keep getting confused
about when their scheduled videocalls start. A shared countdown page removes the
timezone math: both open the same URL and see a live countdown to the next call,
displayed in each viewer's own local time.

## What Changes

- New single-page web app that displays a list of events as a live countdown.
- Events have a title and a date/time, stored canonically in UTC.
- The nearest (or currently in-progress) event is shown as a large, centered **hero**
  countdown; all later events appear as smaller, narrower **compact** bars sorted by time.
- All countdowns tick live down to the second; event times are rendered in the viewer's
  browser-local timezone.
- An event that has started "lingers" in an **IN PROGRESS** state for a configurable
  window (default 1 hour, via ENV var); during that time the hero bar also shows a
  countdown to the next event if one exists.
- Add events via a modal (title + date + time entered in browser-local time, converted
  to UTC on save).
- Delete events via a trashbin icon on each bar, with a confirmation step.
- **Timezone preview** per event: a globe icon opens a popover where the user types a
  city (resolved to an IANA timezone) or picks from a dropdown fallback, showing the
  event time in that zone. The last-used zone is remembered in localStorage.
- No authentication and no overlap enforcement — rescheduling is done by deleting and
  re-adding.
- Packaged as a Docker container with SQLite persisted on a volume, for VPS deployment.

## Capabilities

### New Capabilities
- `event-management`: Create, list, and delete events persisted in SQLite, with times
  stored in UTC; exposed via an HTTP API.
- `countdown-display`: Single-page UI rendering events as live hero/compact countdown
  bars in the viewer's local timezone, including the IN PROGRESS linger state.
- `timezone-preview`: Per-event preview of the event time in an arbitrary timezone via
  city search with IANA dropdown fallback, remembered in localStorage.
- `deployment`: Docker container packaging with SQLite on a persisted volume and
  environment-based configuration.

### Modified Capabilities
<!-- None — this is a greenfield project. -->

## Impact

- New FastAPI application (replaces the placeholder `main.py`).
- New dependencies: `fastapi`, an ASGI server (`uvicorn`), and a city→timezone
  resolution mechanism for the preview feature.
- New SQLite database file (path configurable, persisted via Docker volume).
- New static frontend assets (HTML/CSS/vanilla JS, no build step).
- New `Dockerfile` and runtime configuration (ENV vars for linger window and DB path).
