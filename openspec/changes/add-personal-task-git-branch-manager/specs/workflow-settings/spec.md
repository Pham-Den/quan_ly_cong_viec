## ADDED Requirements

### Requirement: User can configure workflow statuses
The system SHALL provide configurable task and branch status metadata while retaining canonical internal status keys for workflow rules.

#### Scenario: Rename status label
- **WHEN** the user changes the display label of a task status
- **THEN** the system keeps the canonical status key unchanged and shows the new label in the UI

#### Scenario: Disable optional status
- **WHEN** the user disables an optional status
- **THEN** the system hides that status from creation and filter controls without corrupting existing records

#### Scenario: Configure branch Kanban drop
- **WHEN** the user configures a branch workflow status
- **THEN** the system allows the user to decide whether branch cards can be dragged into that status from the Kanban board

#### Scenario: Show restricted movement reason
- **WHEN** a branch workflow status does not allow Kanban drop
- **THEN** the workflow settings UI shows the reason or required action so the user understands why cards cannot be dropped there

### Requirement: User can configure custom status colors
The system SHALL allow custom colors for task and branch statuses and use those colors consistently in table, board, dashboard, detail drawer, and timeline views.

#### Scenario: Default status colors exist
- **WHEN** the app is used before any custom workflow color configuration
- **THEN** task status tags use semantic default colors, and branch status tags use the compact branch flow colors for coding, develop, release, and main

#### Scenario: Change status color
- **WHEN** the user changes the color for `MERGED_MAIN`
- **THEN** all visible `MERGED_MAIN` tags and board columns use the configured color

#### Scenario: Status text remains visible
- **WHEN** a status has a configured color
- **THEN** the UI still shows the status label text and does not rely on color alone

#### Scenario: Note statuses use simple colors
- **WHEN** the user views inbox notes
- **THEN** pending, archived, and converted note states use distinct simple colors while keeping their labels visible

### Requirement: User can configure release branch pattern and Git flow rules
The system SHALL allow the release branch pattern and repository Git flow rules to be configured with default release pattern `release/DDMMYYYY`.

#### Scenario: Default release pattern
- **WHEN** the user creates a self-hosted GitLab repository and does not customize release pattern
- **THEN** the repository uses `release/DDMMYYYY` as the default release branch pattern

#### Scenario: Configure active release branch
- **WHEN** the user selects or creates the active release branch for a repository
- **THEN** new feature and hotfix branch plans use that release branch by default

#### Scenario: Configure branch flow rules
- **WHEN** the user edits repository Git flow rules
- **THEN** the system supports configuring trust source branch, develop branch, production branch, feature name pattern, hotfix name pattern, intended targets, and override flags

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
