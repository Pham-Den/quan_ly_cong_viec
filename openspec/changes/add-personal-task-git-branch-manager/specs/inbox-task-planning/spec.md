## ADDED Requirements

### Requirement: User can capture quick notes
The system SHALL provide an inbox for quickly capturing small requests before they are planned as tasks.

#### Scenario: Add inbox note
- **WHEN** the user submits note content with an optional project and source
- **THEN** the system stores the note with status `NEW` and shows it in the inbox

### Requirement: User can convert notes into tasks
The system SHALL allow an inbox note to be converted into a task while preserving a link back to the source note and allowing an optional task group.

#### Scenario: Convert note to task
- **WHEN** the user converts a `NEW` or `ARCHIVED` note into a task with title, project, priority, and type
- **THEN** the system creates the task, marks the note `CONVERTED`, records the source note on the task, and removes the note from the normal inbox review list

#### Scenario: Convert note to grouped task
- **WHEN** the user converts a note into a task and selects a task group
- **THEN** the created task uses the selected group in its generated task code

### Requirement: User can archive notes
The system SHALL allow notes that will not become tasks to be archived.

#### Scenario: Archive note
- **WHEN** the user archives a `NEW` note
- **THEN** the system changes the note status to `ARCHIVED` and removes it from the active inbox list

#### Scenario: Convert archived note
- **WHEN** the user converts an `ARCHIVED` note into a task
- **THEN** the system creates the task and marks the note `CONVERTED`

### Requirement: User can manage task details
The system SHALL allow tasks to be created, viewed, updated, filtered, and assigned statuses, priorities, types, descriptions, and target dates.

#### Scenario: Create manual task
- **WHEN** the user creates a task without a source note
- **THEN** the system stores the task under a project with a generated task code and status `PLANNED`

#### Scenario: Set target date
- **WHEN** the user sets a target date on a task
- **THEN** the system stores and displays that target date in task views and dashboard signals

#### Scenario: Update task status
- **WHEN** the user changes a task status manually
- **THEN** the system updates the task and records a timeline event with the previous and new status

### Requirement: User can mark task ready for production with dedicated action
The system SHALL provide a dedicated task action for marking a task release-ready for production, separate from ordinary status editing. This action SHALL be a planning signal and MUST NOT be required for a task to become `DONE` after its branch flow reaches `main`.

#### Scenario: Mark task ready for production
- **WHEN** the user clicks the dedicated ready-for-production action on a task
- **THEN** the system records the task as release-ready and writes a timeline event

#### Scenario: Production readiness is not a normal status edit
- **WHEN** the user edits general task fields or changes a non-production status
- **THEN** the system does not mark the task release-ready unless the dedicated action is used

#### Scenario: Main merge can complete task without readiness flag
- **WHEN** the task was not marked ready for production but its required branch flow is recorded as merged into `main` through a release branch
- **THEN** the system can still mark the task `DONE` and records that completion came from main merge
