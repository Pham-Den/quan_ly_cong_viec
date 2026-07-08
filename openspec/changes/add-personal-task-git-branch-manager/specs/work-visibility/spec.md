## ADDED Requirements

### Requirement: Dashboard shows actionable work
The system SHALL provide a dashboard that prioritizes actionable items instead of showing every record.

#### Scenario: Dashboard highlights active work
- **WHEN** the user opens the dashboard for a project
- **THEN** the system shows active tasks, branches ready for test/release/main, blocked work, unconverted inbox notes, and recent timeline events

#### Scenario: Dashboard highlights due dates
- **WHEN** tasks have target dates near or past today
- **THEN** the dashboard shows them as actionable signals

### Requirement: User can search across tasks and branches
The system SHALL provide global search by task code, task group code, task title, note content, branch name, and branch alias.

#### Scenario: Search by branch name
- **WHEN** the user searches for a branch name
- **THEN** the system returns matching branches and linked tasks

#### Scenario: Search by branch alias
- **WHEN** the user searches for a branch alias
- **THEN** the system returns the matching branch and linked tasks

#### Scenario: Search by task code
- **WHEN** the user searches for a task code
- **THEN** the system returns the task and any linked branches

### Requirement: User can view tasks as table and board
The system SHALL provide task table and task board views with filters for project, status, priority, type, branch, and text query.

#### Scenario: Filter task table by status
- **WHEN** the user filters tasks by `IN_PROGRESS`
- **THEN** the system shows only matching tasks for the selected project

#### Scenario: Filter task table by group
- **WHEN** the user filters tasks by a task group
- **THEN** the system shows only tasks in that group for the selected project

### Requirement: User can view all tasks grouped by practical status
The system SHALL provide an All Tasks view that groups tasks into personal workflow buckets for quick status review.

#### Scenario: View all task groups
- **WHEN** the user opens the All Tasks view
- **THEN** the system groups tasks into buckets such as not started, in progress, waiting/review/testing, in release, ready for main, done, blocked, and cancelled

#### Scenario: Status groups are color coded
- **WHEN** the user views task or branch status groups
- **THEN** each group shows a compact color accent and visible status label based on workflow status color metadata

#### Scenario: Group reflects branch progress
- **WHEN** a task has a linked branch merged into a release branch but not yet into `main`
- **THEN** the All Tasks view shows that task in the in-release bucket

#### Scenario: Done group reflects main merge
- **WHEN** a task's required branch flow reaches `main` through its release branch
- **THEN** the All Tasks view shows that task in the done bucket

#### Scenario: Open task from grouped view
- **WHEN** the user selects a task from any All Tasks group
- **THEN** the system opens the task detail drawer without losing the grouped view context

### Requirement: User can view branches as table or board
The system SHALL provide branch views grouped or filtered by lifecycle status, repository, project, linked task, and text query.

#### Scenario: Find branches ready for main
- **WHEN** the user filters branches by `READY_MAIN`
- **THEN** the system shows branches waiting for main merge action

#### Scenario: View branch source and target
- **WHEN** the user views the branch table
- **THEN** the system shows checkout source branch, intended merge target branches, active release branch, and actual merged-into branch when present

### Requirement: Details open in drawers
The system SHALL open task and branch details in drawers from dashboard, table, board, search, and timeline views.

#### Scenario: Open task drawer from search
- **WHEN** the user selects a task search result
- **THEN** the system opens the task detail drawer without losing the current list context

### Requirement: UI uses Vietnamese labels
The system SHALL use Vietnamese labels, navigation text, empty states, and action text for the application UI.

#### Scenario: View main navigation
- **WHEN** the authenticated user opens the app
- **THEN** the sidebar and primary actions are shown in Vietnamese
