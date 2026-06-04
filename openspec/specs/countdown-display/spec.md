# countdown-display

### Requirement: Single-page event listing

The system SHALL serve a single web page that displays all events as countdown bars,
sorted by start datetime with the soonest event first.

#### Scenario: Page loads with events

- **WHEN** a viewer opens the page and events exist
- **THEN** every event is shown as a countdown bar in ascending start-time order

#### Scenario: Page loads with no events

- **WHEN** a viewer opens the page and no events exist
- **THEN** the page renders without error and indicates that there are no events

### Requirement: Hero countdown bar

The system SHALL render the nearest upcoming event (or the currently in-progress event)
as a hero bar that is visually larger than all other bars, with the event title and a
large, centered live countdown.

#### Scenario: Nearest event is the hero

- **WHEN** at least one upcoming or in-progress event exists
- **THEN** that event is rendered as the hero bar, taller and full page width, with its
  countdown shown large and centered

#### Scenario: Hero updates as events pass

- **WHEN** the current hero event passes out of its in-progress window
- **THEN** the next event in chronological order becomes the hero bar

### Requirement: Compact countdown bars

The system SHALL render every event other than the hero as a compact bar that is both
noticeably shorter and noticeably narrower than the hero bar, horizontally centered,
showing the title, date, and live countdown on a single line.

#### Scenario: Secondary events are compact

- **WHEN** more than one event exists
- **THEN** all events after the hero are shown as compact single-line bars, narrower and
  shorter than the hero, centered on the page

### Requirement: Live countdown to the second

The system SHALL update every countdown live, decrementing once per second, displaying
days, hours, minutes, and seconds as appropriate.

#### Scenario: Countdown ticks

- **WHEN** the page is open
- **THEN** each visible countdown updates at least once per second without a page reload

### Requirement: Display in viewer-local timezone

The system SHALL render each event's date and time in the viewer's browser-local
timezone, derived on the client, so that two viewers in different timezones each see
their own local time for the same event.

#### Scenario: Two viewers see local times

- **WHEN** the same event is viewed from two browsers configured to different timezones
- **THEN** each browser displays the event's date and time in its own local timezone

### Requirement: In-progress linger state

The system SHALL treat an event as IN PROGRESS from its start time until a configurable
linger window elapses (default 1 hour), during which the event remains the hero bar,
displays an IN PROGRESS indicator, and shows the remaining linger time.

#### Scenario: Event enters in-progress

- **WHEN** an event's start time is reached and the linger window has not yet elapsed
- **THEN** the event is shown as the hero bar with an IN PROGRESS indicator and the time
  remaining in the linger window

#### Scenario: Configurable linger duration

- **WHEN** the linger window is configured via the environment variable to a value other
  than the default
- **THEN** events remain in the IN PROGRESS state for that configured duration

#### Scenario: Next-event countdown during linger

- **WHEN** an event is IN PROGRESS and a later event exists
- **THEN** the hero bar additionally shows a live countdown to that next event

#### Scenario: Event leaves in-progress

- **WHEN** an in-progress event's linger window elapses
- **THEN** the event is removed from the display and the next event becomes the hero

### Requirement: Add event via modal

The system SHALL provide an "Add Event" control that opens a modal collecting a title,
date, and time entered in the viewer's local timezone, and SHALL convert the entered
local datetime to UTC before persisting it.

#### Scenario: Add an event

- **WHEN** the viewer opens the Add Event modal, enters a title, date, and local time,
  and submits
- **THEN** the system converts the local datetime to UTC, persists the event, and the new
  event appears in the list

#### Scenario: Cancel without saving

- **WHEN** the viewer opens the modal and cancels
- **THEN** no event is created and the modal closes

### Requirement: Delete event with confirmation

The system SHALL provide a trashbin control on every event bar that, after the viewer
confirms, deletes the event.

#### Scenario: Confirmed deletion

- **WHEN** the viewer clicks the trashbin icon on a bar and confirms the prompt
- **THEN** the event is deleted and its bar is removed from the page

#### Scenario: Cancelled deletion

- **WHEN** the viewer clicks the trashbin icon but dismisses the confirmation
- **THEN** the event is not deleted and remains on the page
