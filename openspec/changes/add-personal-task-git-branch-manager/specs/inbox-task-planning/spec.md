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

#### Scenario: Task status follows branch
- **WHEN** a task has no branch, an active branch in progress/develop, an active branch in release, or an active branch in main
- **THEN** the system shows the task as `PLANNED`, `IN_PROGRESS`, `MERGED_RELEASE`, or `DONE` respectively and does not rely on manual task status editing

#### Scenario: Task work status is separate from branch progress
- **WHEN** the user changes a task work status to `TODO`, `DOING`, `TESTING`, or `DONE`
- **THEN** the system stores that work status separately from the branch-derived task status and does not move the task between branch progress buckets

#### Scenario: Delete task before production
- **WHEN** the user deletes a task that has not reached `main`
- **THEN** the system removes the task, removes its task-branch links through cascade cleanup, keeps any branch records intact, and records a `TASK_DELETED` timeline audit event

#### Scenario: Cancel task without deleting
- **WHEN** the user cancels a task that has not reached `main`
- **THEN** the system keeps the task record, sets status `CANCELLED`, deactivates active branch links, and records a `TASK_CANCELLED` timeline audit event

#### Scenario: Restore cancelled task to draft before branch linking
- **WHEN** the user restores a `CANCELLED` task
- **THEN** the system sets the task back to `PLANNED` without restoring old branch links, so the task can be explicitly added to a branch again

#### Scenario: Reject deleting task already on production
- **WHEN** the user tries to delete a task whose status is `DONE` or whose active branch already reached `main`
- **THEN** the system rejects the deletion and keeps the task available for tracking history

### Requirement: Task edit controls reflect branch-derived state
The system SHALL keep task status branch-derived, SHALL NOT expose a separate ready-main task action, and SHALL disable task edit/delete controls when the task has already reached `main`/prod.

#### Scenario: No ready-main action on task screen
- **WHEN** the user views the task table or task detail drawer
- **THEN** the system does not show a `Sẵn sàng main` action or field

#### Scenario: Task status is read-only in detail drawer
- **WHEN** the user opens a task detail drawer
- **THEN** the system shows the branch-derived task status as a tag or summary and does not provide a manual status field

#### Scenario: Task already on production is read-only
- **WHEN** the user opens a task whose status is `DONE` or whose active branch already reached `main`
- **THEN** edit fields, save action, and delete action are visible but disabled with a reason

#### Scenario: Main merge completes task without ready-main flag
- **WHEN** the task's active branch flow is recorded as merged into `main` through a release branch
- **THEN** the system can mark the task `DONE` without any task-level ready-main action
