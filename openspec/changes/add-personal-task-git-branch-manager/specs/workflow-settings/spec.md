## ADDED Requirements

### Requirement: User can configure workflow statuses
The system SHALL provide configurable task and branch status metadata while retaining canonical internal status keys for workflow rules.

#### Scenario: Rename status label
- **WHEN** the user changes the display label of a task status
- **THEN** the system keeps the canonical status key unchanged and shows the new label in the UI

#### Scenario: Disable optional status
- **WHEN** the user disables an optional status
- **THEN** the system hides that status from creation and filter controls without corrupting existing records

### Requirement: User can configure custom status colors
The system SHALL allow custom colors for task and branch statuses and use those colors consistently in table, board, dashboard, detail drawer, and timeline views.

#### Scenario: Change status color
- **WHEN** the user changes the color for `READY_MAIN`
- **THEN** all visible `READY_MAIN` tags and board columns use the configured color

### Requirement: User can configure release branch pattern
The system SHALL allow the release branch pattern to be configured per repository with default `release/DDMMYYYY`.

#### Scenario: Default release pattern
- **WHEN** the user creates a self-hosted GitLab repository and does not customize release pattern
- **THEN** the repository uses `release/DDMMYYYY` as the default release branch pattern

### Requirement: Dark mode is a future preference
The system SHALL record dark mode as a planned post-MVP UI preference and MUST NOT require dark mode for MVP acceptance.

#### Scenario: MVP without dark mode
- **WHEN** the MVP is reviewed
- **THEN** absence of dark mode does not block MVP acceptance

### Requirement: Implementation waits for review approval
The system planning workflow SHALL require explicit user approval before implementation starts and before each phase moves forward.

#### Scenario: Phase awaiting review
- **WHEN** a phase plan is complete but the user has not approved implementation
- **THEN** no application code is scaffolded or changed for that phase
