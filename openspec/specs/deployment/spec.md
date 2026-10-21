# deployment

## Purpose

How the app is packaged, configured and hosted.
## Requirements
### Requirement: Containerized application

The system SHALL be packaged as a Docker image that runs the FastAPI application via an
ASGI server and serves both the API and the single-page frontend.

#### Scenario: Container serves the app

- **WHEN** the Docker image is built and run
- **THEN** the application starts and serves the countdown page and its API on the
  configured port

### Requirement: Persisted database volume

The system SHALL store its SQLite database at a path that can be mounted as a Docker
volume, so event data persists across container restarts and image rebuilds.

#### Scenario: Data persists across container restarts

- **WHEN** events exist and the container is stopped and started again with the same
  mounted volume
- **THEN** the previously created events are still available

### Requirement: Environment-based configuration

The system SHALL read its configuration — at minimum the in-progress linger duration and
the SQLite database path — from environment variables, applying documented defaults when
they are not set.

#### Scenario: Defaults applied when unset

- **WHEN** the container starts without the optional environment variables set
- **THEN** the application uses the documented default linger duration (1 hour) and
  default database path

#### Scenario: Overrides honored

- **WHEN** the container starts with the linger duration or database path environment
  variables set
- **THEN** the application uses the provided values instead of the defaults

### Requirement: Path-prefix hosting
The frontend SHALL reference its static assets and API with relative URLs so the app works both at the site root and behind a reverse proxy path prefix.

#### Scenario: Behind the gateway
- **WHEN** the page is opened at `/events/`
- **THEN** styles and script load from `/events/static/...` and events load from `/events/api/events`

#### Scenario: Local development
- **WHEN** the app runs directly with uvicorn and the page is opened at `/`
- **THEN** assets and API load from `/static/...` and `/api/events`

### Requirement: Named database volume
The compose setup SHALL mount a named volume at the database directory so events survive `docker compose down` and rebuilds.

#### Scenario: Data survives compose down
- **WHEN** events exist and `docker compose down` followed by `docker compose up -d` is run
- **THEN** the previously created events are still available

