# deployment

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
