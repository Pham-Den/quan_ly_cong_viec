## ADDED Requirements

### Requirement: User can create and track branches
The system SHALL allow the user to create or register self-hosted GitLab branches under a repository with branch name, base branch, branch type, lifecycle status, optional aliases, and optional merge request URL.

#### Scenario: Register branch
- **WHEN** the user registers a branch under a repository
- **THEN** the branch appears in branch views with its current lifecycle status

#### Scenario: Create branch record from app
- **WHEN** the user creates a feature branch from the app and selects checkout source `main` plus intended merge target `release/08072026`
- **THEN** the system stores the branch name, checkout source, intended merge target, generated checkout command, and linked task references

#### Scenario: Create derived branch from existing branch
- **WHEN** the user creates branch `B` from tracked source branch `A`
- **THEN** the system stores `A` as the source branch, keeps `B` in the same branch lineage by default, and allows `B` to carry task links from `A`

#### Scenario: Create branch at any lifecycle point
- **WHEN** the user creates a branch from `main`, a feature branch, a release branch, or a hotfix branch
- **THEN** the system allows the branch record when the selected checkout source exists or is manually entered

#### Scenario: Create remote branch when GitLab API is configured
- **WHEN** the repository has self-hosted GitLab API credentials and the user creates a branch from the app
- **THEN** the system creates the remote GitLab branch from the selected checkout source and stores the app branch record

#### Scenario: Create app-only branch when GitLab API is not configured
- **WHEN** the repository has no GitLab API credentials and the user creates a branch from the app
- **THEN** the system creates only the app branch record and shows the checkout command for manual Git use

#### Scenario: Register release branch
- **WHEN** the user registers branch `release/08072026`
- **THEN** the system recognizes it as a release branch when it matches the repository release pattern

#### Scenario: Register biweekly release branch
- **WHEN** the user creates a new release branch for the next two-week release cycle
- **THEN** the system stores that release branch as the current release target for tasks merged during that cycle

#### Scenario: Register hotfix branch from production
- **WHEN** the user registers a hotfix branch with base branch `main`
- **THEN** the system stores the branch type as `HOTFIX` and keeps it available for main merge tracking

#### Scenario: Add branch alias
- **WHEN** the user adds an alias to a branch whose real name does not include the task code
- **THEN** the system allows search and manual linking by either the branch name or alias

### Requirement: User can link tasks and branches
The system SHALL support many-to-many links between tasks and branches with a relationship role so the user can see whether a task is in a feature branch, release branch, or `main`.

#### Scenario: Link task to branch
- **WHEN** the user links a task to a branch with role `PRIMARY`
- **THEN** the task detail shows the branch and the branch detail shows the task

#### Scenario: View task branch path
- **WHEN** the user opens a task linked to a feature branch
- **THEN** the system shows the branch path from checkout source to feature branch, intended release branch, and final `main` target

#### Scenario: Derived branch carries task
- **WHEN** task `CRM-001` is linked to branch `A` and the user creates branch `B` from `A` with task inheritance enabled
- **THEN** the system links task `CRM-001` to `B` as carried from source branch `A`

#### Scenario: Branch contains multiple tasks
- **WHEN** the user links multiple tasks to one branch
- **THEN** merge actions on that branch evaluate every linked task

#### Scenario: Task spans multiple independent branch lineages
- **WHEN** the user links one task to multiple independent required branch lineages
- **THEN** the task is not considered complete until every required lineage has reached `main`

#### Scenario: Link branch with existing short name
- **WHEN** the user links an existing short branch name to a task and adds a task-code alias
- **THEN** the system stores the manual link and alias without requiring the real branch name to change

### Requirement: User can update branch lifecycle status
The system SHALL allow branch status to move through draft, coding, review, testing, release readiness, release merged, main readiness, main merged, and closed states.

#### Scenario: Update branch status
- **WHEN** the user changes a branch lifecycle status
- **THEN** the system updates the branch and records a timeline event with the previous and new status

### Requirement: Release merge updates linked tasks without completing them
The system SHALL update release merge state and linked task state when a feature branch is marked merged into a release branch, but it MUST NOT mark linked tasks as `DONE`.

#### Scenario: Mark feature branch merged to release
- **WHEN** the user marks a linked feature branch as merged into `release/08072026`
- **THEN** the system records the release merge timestamp, stores `release/08072026` as the actual merged-into branch, creates a `MERGED_TO_RELEASE` timeline event, and moves eligible linked tasks to `MERGED_RELEASE`

#### Scenario: Release merge does not complete task
- **WHEN** a linked task reaches a release branch through branch merge
- **THEN** the task remains not done until it reaches `main`

### Requirement: Main merge completes eligible linked task lineages
The system SHALL treat recorded merge into `main` as the source of truth for completion, update branch main merge state, and mark linked tasks `DONE` when all required branch lineages for each task have reached `main`. If linked tasks were not marked release-ready, the system SHALL warn but still allow the user to record the actual main merge.

#### Scenario: Main merge warns when task was not ready
- **WHEN** the user marks a branch as merged into `main` while a linked task is not release-ready
- **THEN** the system warns which linked task was not marked ready and still allows the user to confirm the real main merge

#### Scenario: Single-branch task merged to main
- **WHEN** the user marks the task's only required branch as merged into `main`
- **THEN** the system marks the branch as merged to main, stores `main` as the actual merged-into branch, sets the task status to `DONE`, sets `done_at`, and records timeline events

#### Scenario: Derived branch merged to main completes source task
- **WHEN** task `CRM-001` is on branch `A`, branch `B` was created from `A` carrying `CRM-001`, and `B` is marked merged into `main`
- **THEN** the system marks task `CRM-001` as `DONE` for that branch lineage even if branch `A` was not merged into `main`

#### Scenario: Multi-branch task partially merged to main
- **WHEN** the user marks one required independent branch lineage as merged into `main` but another required lineage for the same task has not reached `main`
- **THEN** the system keeps the task not done and shows that main completion is partial

#### Scenario: Multi-branch task fully merged to main
- **WHEN** all required independent branch lineages linked to a task have reached `main`
- **THEN** the system marks the task `DONE` and records the completion event

### Requirement: User can record actual merge destination
The system SHALL allow the user to record which branch a branch was actually merged into, independent of the originally intended merge target.

#### Scenario: Record different merge destination
- **WHEN** the user records that a feature branch intended for `release/08072026` was actually merged into `release/22072026`
- **THEN** the system stores the actual merged-into branch and keeps the original intended merge target visible for comparison

### Requirement: Closed branches do not complete tasks automatically
The system SHALL NOT mark linked tasks as `DONE` when a branch is closed or cancelled.

#### Scenario: Close branch
- **WHEN** the user marks a linked branch as `CLOSED`
- **THEN** the system records the branch closure and leaves linked task completion unchanged

### Requirement: Branch name suggestion follows task and branch type
The system SHALL suggest branch names from task code, task title, and branch type while allowing the user to override the final branch name.

#### Scenario: Suggest feature branch name
- **WHEN** the user creates a branch from task `CRM-BE-001` titled `Sua validate form`
- **THEN** the system suggests a branch name like `feature/CRM-BE-001-sua-validate-form`

#### Scenario: Suggest hotfix branch name
- **WHEN** the user creates a hotfix branch from task `CRM-BE-001`
- **THEN** the system suggests a branch name like `hotfix/CRM-BE-001-sua-validate-form` with base branch `main`
