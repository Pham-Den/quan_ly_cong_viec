## ADDED Requirements

### Requirement: User can create and track branches
The system SHALL allow the user to create or register self-hosted GitLab branches under a repository with branch name, base branch, branch type, lifecycle status, optional aliases, optional merge request URL, and configurable Git flow rules.

#### Scenario: Register branch
- **WHEN** the user registers a branch under a repository
- **THEN** the branch appears in branch views with its current lifecycle status

#### Scenario: Create branch record from app
- **WHEN** the user creates a feature branch from the app for Jira/task code `CRM-BE-001`
- **THEN** the system uses checkout source `main`, suggests branch name `feature/CRM-BE-001`, stores intended targets `develop`, active `release/...`, and `main`, generates the checkout command, and links selected task references

#### Scenario: Plan multiple intended merge targets
- **WHEN** the user creates or edits a branch and selects multiple intended merge targets such as `develop`, `release/08072026`, and `main`
- **THEN** the system stores the intended merge targets as the original plan and shows all of them on branch table and Kanban cards

#### Scenario: Disable fields that are not editable
- **WHEN** the user opens an existing branch detail drawer
- **THEN** fields that cannot safely change for that branch state, such as repository, branch type, existing task links, release-child state, and main-merged branch identity, are shown but disabled instead of appearing editable

#### Scenario: Create hotfix branch record from app
- **WHEN** the user creates a hotfix branch from the app for Jira/task code `CRM-BE-001`
- **THEN** the system uses checkout source `main`, suggests branch name `hotfix/CRM-BE-001-<date>`, stores intended targets active `release/...` and `main`, generates the checkout command, and links selected task references

#### Scenario: Enforce trust source by default
- **WHEN** the user creates a feature or hotfix branch while checkout source override is disabled
- **THEN** the system requires the configured trust source branch, default `main`, and rejects any other checkout source

#### Scenario: Create remote branch when GitLab API is configured
- **WHEN** the repository has self-hosted GitLab API credentials and the user creates a branch from the app
- **THEN** the system creates the remote GitLab branch from the configured checkout source and stores the app branch record

#### Scenario: Create app-only branch when GitLab API is not configured
- **WHEN** the repository has no GitLab API credentials and the user creates a branch from the app
- **THEN** the system creates only the app branch record and shows the checkout command for manual Git use

#### Scenario: Register release branch
- **WHEN** the user registers branch `release/08072026`
- **THEN** the system recognizes it as a release branch when it matches the repository release pattern, records it as a separate release base branch, sets checkout source to `main`, and stores intended merge target `main`

#### Scenario: Register active release branch
- **WHEN** the user creates or selects release branch `release/08072026` for the current release cycle
- **THEN** the system stores that release branch as the active release target for task branches merged during that cycle

#### Scenario: Release branch starts in release column
- **WHEN** the user creates or selects a release branch
- **THEN** the system puts that release branch in `MERGED_RELEASE` by default and does not allow it to appear in coding or develop lifecycle columns

#### Scenario: Attach task branch to a release branch
- **WHEN** the user records a feature or hotfix branch as merged to release
- **THEN** the system lets the user choose an existing release branch receiving the merge, requires that branch to be a distinct release branch, and stores that release branch/cycle on the task branch

#### Scenario: Change release branch for a task branch
- **WHEN** a task branch was previously attached to `release/08072026` and the user changes it to `release/15072026`
- **THEN** the system updates the task branch release assignment, keeps both release branches separate from task branches, and records the change in timeline

#### Scenario: Reject attaching to a deleted release branch
- **WHEN** a release branch record has been deleted
- **THEN** the system does not show that release branch in attach/change release options
- **AND** the backend rejects attaching a task branch to that deleted release branch name

#### Scenario: Reject changing release for a child branch already in main
- **WHEN** a task branch is a child of a release branch that has already reached `main`
- **THEN** the system rejects changing the child branch's release assignment until the release parent is rolled back to `MERGED_RELEASE`

#### Scenario: Register hotfix branch from production
- **WHEN** the user registers a hotfix branch with base branch `main`
- **THEN** the system stores the branch type as `HOTFIX` and keeps it available for main merge tracking

#### Scenario: Add branch alias
- **WHEN** the user adds an alias to a branch whose real name does not include the task code
- **THEN** the system allows search and manual linking by either the branch name or alias

#### Scenario: Delete branch before main
- **WHEN** the user deletes a branch whose lifecycle status has not reached `MERGED_MAIN`
- **THEN** the system deletes the branch record and task links, and records a branch deletion timeline event before removing the branch reference

#### Scenario: Reject deleting branch already in main
- **WHEN** the user tries to delete a branch whose lifecycle status is `MERGED_MAIN`
- **THEN** the system rejects the deletion and explains that work already in `main` cannot be deleted from tracking

#### Scenario: Reject deleting release parent with child branches
- **WHEN** the user tries to delete a release branch that still contains child task branches
- **THEN** the system rejects the deletion until the child branches are moved to another release or deleted

### Requirement: User can link tasks and branches
The system SHALL allow each task to have at most one active branch link at a time, while allowing a branch to contain multiple tasks, so the user can see the single current branch path for each task.

#### Scenario: Link task to branch
- **WHEN** the user links a task to a branch with role `PRIMARY`
- **THEN** the task detail shows the branch and the branch detail shows the task

#### Scenario: Reject linking done or cancelled task to branch
- **WHEN** the user tries to manually link a task whose status is `DONE` or `CANCELLED`
- **THEN** the system rejects the link and explains that a cancelled task must be restored to draft before it can be added to a branch

#### Scenario: Reassign task to another branch
- **WHEN** a task already has an active branch and the user links it to another branch
- **THEN** the system deactivates the previous task-branch link, keeps only the new link active, and syncs the task status from the new branch

#### Scenario: View task branch path
- **WHEN** the user opens a task linked to a feature branch
- **THEN** the system shows the branch path from checkout source to feature branch, intended release branch, and final `main` target

#### Scenario: Task branch enters active release
- **WHEN** task `CRM-001` is linked to a feature branch and the user records that branch merged into the active release branch
- **THEN** the system keeps the task linked to the task branch and records which release branch/cycle now contains that work

#### Scenario: Branch contains multiple tasks
- **WHEN** the user links multiple tasks to one branch
- **THEN** merge actions on that branch evaluate every linked task

#### Scenario: Add tasks to an active branch before release
- **WHEN** a branch is still in coding or develop state
- **THEN** the user can add or remove linked tasks on that branch, and each newly linked task becomes active on that branch while any previous active branch link for that task is superseded

#### Scenario: Lock task links after release
- **WHEN** a branch has reached release or main
- **THEN** the system prevents adding or removing linked tasks on that branch so release and production history stay stable

#### Scenario: Link branch with existing short name
- **WHEN** the user links an existing short branch name to a task and adds a task-code alias
- **THEN** the system stores the manual link and alias without requiring the real branch name to change

#### Scenario: Inherit only unfinished tasks from source branch
- **WHEN** the user creates a branch from a source branch with task inheritance enabled
- **THEN** the system inherits only source tasks that are not `DONE`, not `CANCELLED`, and do not have `done_at`

### Requirement: User can update branch lifecycle status
The system SHALL keep the branch lifecycle compact with four statuses: coding, merged to develop, merged to release, and merged to main.

#### Scenario: Update branch status
- **WHEN** the user changes a branch lifecycle status
- **THEN** the system updates the branch and records a timeline event with the previous and new status

#### Scenario: Move branch status from Kanban
- **WHEN** the user drags a branch card into a branch status column that allows Kanban drop
- **THEN** the system updates the branch status, keeps the branch in the target column, and records a timeline event

#### Scenario: Reject restricted Kanban status
- **WHEN** the user drags a branch card into a status that does not allow Kanban drop
- **THEN** the system rejects the status move, returns the branch to the previous column, and shows the action required for that status

#### Scenario: Merge statuses require merge actions by default
- **WHEN** the user tries to drag a branch directly into `MERGED_RELEASE` or `MERGED_MAIN`
- **THEN** the system blocks the drop by default and directs the user to use the merge release or merge main action so linked task rules are not bypassed

#### Scenario: Develop status is manual tracking only
- **WHEN** the user moves a branch to `MERGED_DEVELOP`
- **THEN** the system records the branch status change and keeps linked tasks in `IN_PROGRESS`

#### Scenario: Release branch moves only to main
- **WHEN** the user drags a release branch from `MERGED_RELEASE` to `MERGED_MAIN`
- **THEN** the system records the release-to-main merge workflow and propagates main state to task branches in that release

#### Scenario: Roll back mistaken release main movement
- **WHEN** the user drags a release branch from `MERGED_MAIN` back to `MERGED_RELEASE`
- **THEN** the system treats it as correcting a mistaken move, returns the release branch and its child task branches to release state, clears main merge timestamps for those branches, moves tasks that no longer have every required flow in main back to release state, and records timeline events

#### Scenario: Reject release branch movement to normal statuses
- **WHEN** the user tries to move a release branch to coding or develop
- **THEN** the system rejects the move and explains that release branches only live in release and then main

### Requirement: User can view branches as a one-row Kanban board
The system SHALL provide a Kanban view for `/branches` where branch lifecycle statuses are shown as columns in a single horizontal row.

#### Scenario: View branch Kanban
- **WHEN** the user opens `/branches` and selects Kanban view
- **THEN** the system shows all enabled branch statuses as same-row columns ordered by workflow settings

#### Scenario: Compact branch card
- **WHEN** a branch appears in the Kanban board
- **THEN** the branch card shows branch name, repository, linked task titles with task code as a secondary reference, checkout source, intended targets, actual merged-into state, and quick actions without requiring the table view

#### Scenario: Linked task color follows task priority
- **WHEN** a linked task appears inside a branch table row, Kanban card, release child row, or branch detail drawer
- **THEN** the linked task chip uses the task priority color so Low is green, Medium is gold, and High is red

#### Scenario: Change linked task work status from branch views
- **WHEN** a linked task appears inside the branch table, branch Kanban card, release child row, or branch detail drawer
- **THEN** the system shows the task work status and allows the user to change it without changing the branch lifecycle status

#### Scenario: Show disabled unavailable actions
- **WHEN** a branch row, branch card, or card action menu contains actions that are not valid for the current branch state
- **THEN** the system still shows those actions but disables them instead of hiding them

#### Scenario: Status menu lists disabled invalid statuses
- **WHEN** the user opens a status selector for a branch action
- **THEN** the system lists every enabled branch status while disabling statuses that cannot be selected for that branch state

#### Scenario: Release branch card stands apart
- **WHEN** a release branch appears in the Kanban board
- **THEN** the release branch card uses a distinct background treatment from feature, hotfix, and support branch cards

#### Scenario: Task branches become release sub-items
- **WHEN** a feature or hotfix branch is recorded as merged into a release branch
- **THEN** the Kanban shows that task branch as a release sub-item under the release branch card instead of as a separate top-level card

#### Scenario: Reorder top-level branch cards in a status column
- **WHEN** the user drags a top-level branch card onto another top-level card in the same Kanban status column
- **THEN** the system saves the new manual order and keeps that order after refresh

#### Scenario: Reorder release sub-items inside a parent release branch
- **WHEN** the user drags a release child branch onto another child branch under the same release branch card
- **THEN** the system saves the new child order inside that release branch while keeping both children attached to the same release parent

#### Scenario: Release sub-items follow parent main merge
- **WHEN** a release branch card is moved to `MERGED_MAIN`
- **THEN** every task branch sub-item under that release follows the release branch to `MERGED_MAIN`, and linked tasks are evaluated through the release-to-main workflow

#### Scenario: Detach release child branch before main
- **WHEN** a task branch is attached to a release parent that is still in `MERGED_RELEASE`
- **AND** the user changes that child branch to a normal lifecycle status by edit or by dragging it out to a normal Kanban column
- **THEN** the system clears the child branch release assignment and actual release merge target, shows it again as a top-level branch, records a detach timeline event, and moves linked active tasks back out of release when the active branch is no longer in release or main

#### Scenario: Lock release child branch while parent is in main
- **WHEN** a release parent branch is in `MERGED_MAIN`
- **THEN** its child task branches cannot be dragged out, manually moved to another status, reassigned to another release, or deleted

#### Scenario: Allow child correction after parent rollback
- **WHEN** a release parent branch is rolled back from `MERGED_MAIN` to `MERGED_RELEASE`
- **THEN** child task branches return to release state and can be reassigned to a different release or deleted if they still have not reached `main`

#### Scenario: Kanban respects existing filters
- **WHEN** the user filters by repository, status, or search query
- **THEN** the Kanban board shows only branches matching the current filters

#### Scenario: Horizontal overflow
- **WHEN** the viewport cannot fit every status column
- **THEN** the Kanban board keeps the columns in one row and allows horizontal scrolling instead of wrapping columns into multiple rows

### Requirement: Release merge updates linked tasks without completing them
The system SHALL update release merge state and linked task state when a feature or hotfix branch is marked merged into the active release branch, but it MUST NOT mark linked tasks as `DONE`.

#### Scenario: Mark task branch merged to release
- **WHEN** the user marks a linked feature or hotfix branch as merged into active release branch `release/08072026`
- **THEN** the system records the release merge timestamp, stores `release/08072026` as the actual merged-into branch, creates a `MERGED_TO_RELEASE` timeline event, and moves eligible linked tasks to `MERGED_RELEASE`

#### Scenario: Release merge does not complete task
- **WHEN** a linked task reaches a release branch through branch merge
- **THEN** the task remains not done until that release branch reaches `main`

### Requirement: Main merge completes eligible linked branch flows
The system SHALL treat recorded release branch merge into `main` as the source of truth for completion, update release and child branch main state, and mark linked tasks `DONE` when each task's active branch reaches `main`.

#### Scenario: Main merge does not require task ready-main flag
- **WHEN** the user marks a release branch as merged into `main`
- **THEN** the system records the real main merge and evaluates linked tasks without requiring any task-level ready-main flag

#### Scenario: Release branch merged to main completes included task branches
- **WHEN** release branch `release/08072026` is marked merged into `main`
- **THEN** the system marks the release branch as merged to main, stores `main` as the release actual merged-into branch, propagates main state to task branches attached to that release, sets eligible task status to `DONE`, sets `done_at`, and records timeline events

### Requirement: User can record actual merge destination
The system SHALL allow the user to record which branch a branch was actually merged into, independent of the originally intended merge target.

#### Scenario: Record different merge destination
- **WHEN** the user records that a feature branch intended for `release/08072026` was actually merged into `release/22072026`
- **THEN** the system stores the actual merged-into branch and keeps the original intended merge target visible for comparison

### Requirement: Branch name suggestion follows task and branch type
The system SHALL suggest branch names from task code, task title, and branch type while allowing the user to override the final branch name.

#### Scenario: Suggest feature branch name
- **WHEN** the user creates a branch from task `CRM-BE-001` titled `Sua validate form`
- **THEN** the system suggests a branch name like `feature/CRM-BE-001` according to the configured feature branch pattern

#### Scenario: Suggest hotfix branch name
- **WHEN** the user creates a hotfix branch from task `CRM-BE-001`
- **THEN** the system suggests a branch name like `hotfix/CRM-BE-001-08072026` according to the configured hotfix branch pattern with base branch `main`

### Requirement: User can configure Git flow rules
The system SHALL allow repository-level branch flow rules so the default workflow can be adjusted without rewriting existing branch history.

#### Scenario: Configure branch flow defaults
- **WHEN** the user opens repository workflow settings
- **THEN** the system allows configuring trust source branch, develop branch, production branch, release branch pattern, feature name pattern, hotfix name pattern, feature intended targets, hotfix intended targets, checkout source override, and direct main merge override

#### Scenario: Rule change affects only new branch plans
- **WHEN** the user changes a Git flow rule
- **THEN** newly created branch plans use the new rule while existing branches keep their original intended targets and recorded history

#### Scenario: Select active release branch
- **WHEN** the user creates or selects an active release branch for a repository
- **THEN** new feature and hotfix branches use that release branch in their intended targets and release merge action by default
