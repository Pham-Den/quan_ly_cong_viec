## ADDED Requirements

### Requirement: System records timeline events for important changes
The system SHALL create timeline events for note creation, task creation, task status changes, branch creation, branch deletion, task-branch linking, branch status changes, release merge, main merge, comments, blocked state, and unblocked state.

#### Scenario: Task status event
- **WHEN** a task status changes
- **THEN** the system records a timeline event containing task reference, previous status, new status, actor, and timestamp

#### Scenario: Branch merge event
- **WHEN** a branch is marked merged to a release branch or `main`
- **THEN** the system records a timeline event containing branch reference, linked task references, merge target, actor, and timestamp

#### Scenario: Branch deletion event
- **WHEN** a branch is deleted before reaching `main`
- **THEN** the system records a timeline event with deleted branch id, name, status, type, linked task ids, actor, and timestamp before the branch reference is removed

### Requirement: User can view project timeline
The system SHALL provide a timeline view filtered by project, task, branch, event type, and date range.

#### Scenario: Filter timeline by branch
- **WHEN** the user filters timeline by a branch
- **THEN** the system shows events associated with that branch and its linked task changes

### Requirement: User can add comments to timeline
The system SHALL allow the user to add comments associated with a project and optionally a task or branch.

#### Scenario: Add branch comment
- **WHEN** the user adds a comment to a branch
- **THEN** the system stores the comment as a timeline event visible in branch detail and project timeline
