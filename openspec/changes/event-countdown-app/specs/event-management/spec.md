## ADDED Requirements

### Requirement: Event data model

The system SHALL represent each event with a unique identifier, a non-empty title,
and a start datetime stored canonically in UTC.

#### Scenario: Event stored in UTC

- **WHEN** an event is persisted
- **THEN** its start datetime is stored as a UTC value independent of any viewer's timezone

#### Scenario: Title is required

- **WHEN** a request to create an event omits the title or provides an empty/whitespace-only title
- **THEN** the system rejects the request with a validation error and does not create the event

### Requirement: Create event

The system SHALL provide an HTTP endpoint to create a new event from a title and a
UTC start datetime, returning the created event including its assigned identifier.

#### Scenario: Successful creation

- **WHEN** a client submits a valid title and a UTC start datetime
- **THEN** the system persists a new event and returns it with a unique identifier

#### Scenario: Invalid datetime rejected

- **WHEN** a client submits a start datetime that is missing or not a valid datetime
- **THEN** the system rejects the request with a validation error and creates no event

### Requirement: List events

The system SHALL provide an HTTP endpoint that returns all events ordered by start
datetime ascending (soonest first).

#### Scenario: Events returned in chronological order

- **WHEN** a client requests the list of events
- **THEN** the system returns every stored event sorted by start datetime ascending

#### Scenario: Empty list

- **WHEN** no events exist and a client requests the list
- **THEN** the system returns an empty list

### Requirement: Delete event

The system SHALL provide an HTTP endpoint to delete an event by its identifier.

#### Scenario: Successful deletion

- **WHEN** a client deletes an existing event by identifier
- **THEN** the system removes the event and it no longer appears in the event list

#### Scenario: Deleting a missing event

- **WHEN** a client requests deletion of an identifier that does not exist
- **THEN** the system responds with a not-found result and makes no changes

### Requirement: Persistent storage

The system SHALL persist events in a SQLite database whose file path is configurable,
so that events survive application and container restarts.

#### Scenario: Events survive restart

- **WHEN** events have been created and the application is restarted
- **THEN** the previously created events are still present and returned by the list endpoint
