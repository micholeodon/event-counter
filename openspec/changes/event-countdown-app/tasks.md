## 1. Project setup

- [x] 1.1 Add dependencies to `pyproject.toml` (`fastapi`, `uvicorn[standard]`)
- [x] 1.2 Define config loading from env vars: `LINGER_SECONDS` (default 3600) and `DB_PATH` (default `/data/events.db`) with documented defaults
- [x] 1.3 Create app package layout (app module, `static/` for frontend assets)

## 2. Persistence layer (event-management)

- [x] 2.1 Create SQLite connection helper using `DB_PATH`, ensuring the parent directory exists
- [x] 2.2 Create `events` table on startup if absent (`id`, `title`, `start_utc`)
- [x] 2.3 Implement `create_event(title, start_utc)` returning the new event with its id
- [x] 2.4 Implement `list_events()` returning all events sorted by `start_utc` ascending
- [x] 2.5 Implement `delete_event(id)` returning whether a row was removed

## 3. API endpoints (event-management)

- [x] 3.1 Define Pydantic models for event input (title, UTC start datetime) and output
- [x] 3.2 `POST /api/events`: validate non-empty title and valid UTC datetime, create, return event (400 on invalid)
- [x] 3.3 `GET /api/events`: return all events ascending (empty list when none)
- [x] 3.4 `DELETE /api/events/{id}`: delete by id, 404 when missing
- [x] 3.5 Expose `linger_seconds` to the frontend (inline into the page at load)

## 4. Frontend scaffold (countdown-display)

- [x] 4.1 Serve `index.html` and mount `static/` (CSS/JS) via FastAPI
- [x] 4.2 Fetch the event list on load and store target timestamps (UTC) in memory
- [x] 4.3 Implement a 1s `setInterval` tick that recomputes all countdowns from absolute UTC targets
- [x] 4.4 Implement countdown formatter `Xd Xh Xm Xs`, omitting leading zero-value units
- [x] 4.5 Render event date/time in viewer-local timezone via `Intl.DateTimeFormat`

## 5. Hero / compact rendering & linger (countdown-display)

- [x] 5.1 Each tick, derive state: in-progress if `start <= now < start + linger`; hero = in-progress event else earliest future event
- [x] 5.2 Render the hero bar: tall, full-width, title + large centered live countdown + local datetime
- [x] 5.3 Render compact bars for all other not-yet-elapsed events: shorter and narrower, centered, single line (title · date · countdown)
- [x] 5.4 Hide events whose linger window has fully elapsed
- [x] 5.5 In-progress hero: show IN PROGRESS indicator + remaining linger time, and a countdown to the next event when one exists
- [x] 5.6 Empty-state message when no events exist
- [x] 5.7 Style hero vs compact hierarchy in `styles.css` to match the agreed layout

## 6. Add event modal (countdown-display)

- [x] 6.1 Add an "Add Event" button that opens a modal with title, date, and time inputs
- [x] 6.2 On submit, convert local date+time to a UTC ISO string and POST to `/api/events`
- [x] 6.3 On success, refresh the list and close the modal; Cancel closes without saving

## 7. Delete with confirmation (countdown-display)

- [x] 7.1 Add a trashbin icon to hero and compact bars
- [x] 7.2 On click, show a confirmation prompt; on confirm DELETE the event and remove its bar; on dismiss do nothing

## 8. Timezone preview (timezone-preview)

- [x] 8.1 Add a globe icon to hero and compact bars that opens a per-event popover
- [x] 8.2 Ship a curated city→IANA lookup table (include Warsaw and Guarda) and resolve typed city names against it
- [x] 8.3 On resolved city, render the event start time in that timezone via `Intl.DateTimeFormat`
- [x] 8.4 Provide an IANA dropdown (`Intl.supportedValuesOf('timeZone')`) as fallback when a city is unresolved or for direct selection
- [x] 8.5 Persist the last-used timezone in localStorage and pre-select it on next open

## 9. Deployment (deployment)

- [x] 9.1 Write a `Dockerfile` (slim Python base) that installs deps, copies app + static assets, exposes the port, and runs Uvicorn
- [x] 9.2 Configure `/data` as the SQLite volume mount and confirm `DB_PATH` defaults there
- [x] 9.3 Document run instructions and env vars (`LINGER_SECONDS`, `DB_PATH`) in `README.md`

## 10. Verification

- [x] 10.1 Verify events persist across container restart with a mounted volume
- [x] 10.2 Verify two browsers in different timezones each show correct local times for the same event
- [x] 10.3 Verify in-progress linger behavior and the default vs overridden `LINGER_SECONDS`
