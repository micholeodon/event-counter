## ADDED Requirements

### Requirement: Per-event timezone preview control

The system SHALL provide a globe control on every event bar that opens a popover for
previewing the event's start time in an arbitrary timezone.

#### Scenario: Open preview popover

- **WHEN** the viewer clicks the globe icon on an event bar
- **THEN** a popover opens offering a way to choose a timezone for that event

### Requirement: City search to timezone

The system SHALL let the viewer type a city name and resolve it to an IANA timezone,
then display the event's start time rendered in that timezone.

#### Scenario: City resolves to a timezone

- **WHEN** the viewer types a recognized city name in the preview popover
- **THEN** the system resolves it to an IANA timezone and shows the event's start time
  in that timezone

### Requirement: Dropdown fallback

The system SHALL provide a dropdown of IANA timezones as a fallback selection method
when a typed city cannot be resolved or the viewer prefers to pick directly.

#### Scenario: Unresolved city falls back to dropdown

- **WHEN** the viewer types a city name that cannot be resolved to a timezone
- **THEN** the system offers the IANA timezone dropdown so the viewer can select one
  directly

#### Scenario: Select from dropdown

- **WHEN** the viewer selects an IANA timezone from the dropdown
- **THEN** the system shows the event's start time rendered in that timezone

### Requirement: Remember last-used timezone

The system SHALL remember the most recently used preview timezone in the browser's
localStorage and offer it as the default the next time a preview is opened.

#### Scenario: Last timezone is remembered

- **WHEN** the viewer has previewed an event in a timezone and later opens a preview again
- **THEN** the previously used timezone is pre-selected as the default
