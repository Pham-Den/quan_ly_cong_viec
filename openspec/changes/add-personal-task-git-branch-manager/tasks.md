## 1. Bootstrap

- [x] 1.1 Wait for user review and explicit approval before starting any implementation.
- [x] 1.2 Use Fastify as the compact backend framework.
- [x] 1.3 Create monorepo structure with `frontend/` and `backend/`.
- [x] 1.4 Create Vue 3 + Vite + TypeScript frontend project.
- [x] 1.5 Install and configure Ant Design Vue, Vue Router, Pinia, Axios or TanStack Query, and Day.js.
- [x] 1.6 Create compact backend API project with TypeScript.
- [x] 1.7 Install and configure Prisma with SQLite for local MVP and a documented database driver switch path.
- [x] 1.8 Add Docker Compose for local startup of frontend, backend, and database volume.
- [x] 1.9 Add shared environment configuration for frontend API URL, backend port, database URL, JWT secrets, and local setup behavior.
- [x] 1.10 Stop for user review before moving to database/auth implementation.

## 2. Database Schema

- [x] 2.1 Define Prisma models for users and refresh tokens.
- [x] 2.2 Define Prisma models for projects, task groups, and repositories.
- [x] 2.3 Define Prisma models for workflow statuses and status colors.
- [x] 2.4 Define Prisma models for notes and tasks, including task group and target date.
- [x] 2.5 Define Prisma models for branches, branch aliases, and task-branch links.
- [x] 2.6 Define Prisma model for timeline events with JSON metadata.
- [x] 2.7 Add indexes for project/status, task code, task group, branch repo/name, branch aliases, branch status, task-branch links, and timeline project/date.
- [x] 2.8 Seed one sample project, default workflow statuses, self-hosted GitLab repository defaults, and custom status colors; do not seed a user because the first-run setup screen creates the first account.
- [x] 2.9 Stop for user review before moving to auth/app shell implementation.

## 3. Auth And App Shell

- [x] 3.1 Implement first-run setup API for creating the initial local account when no user exists.
- [x] 3.2 Implement login API with password hash verification and JWT session issuing.
- [x] 3.3 Implement refresh/logout/current-user APIs.
- [x] 3.4 Add backend auth guard for protected APIs.
- [x] 3.5 Build frontend first-run setup account screen.
- [x] 3.6 Build frontend login page.
- [x] 3.7 Build protected Vietnamese layout with sidebar, header, project switcher, global search slot, and user menu.
- [x] 3.8 Add frontend route guards and session restore behavior.
- [x] 3.9 Stop for user review before moving to project/repository workspace implementation.
- [x] 3.10 Add Playwright browser smoke test for setup, login, logout, session restore, and protected app shell before review.

## 4. Project And Repository Workspace

- [x] 4.1 Implement project CRUD APIs.
- [x] 4.2 Implement task group CRUD APIs scoped by project.
- [x] 4.3 Implement repository CRUD APIs scoped by project.
- [x] 4.4 Build project list, project selector, and project settings UI.
- [x] 4.5 Build task group settings UI.
- [x] 4.6 Build repository settings UI with provider `GITLAB_SELF_HOSTED`, internal GitLab URL, optional GitLab project id/path, default branch, production branch `main`, and release branch pattern `release/DDMMYYYY`.
- [x] 4.7 Add optional self-hosted GitLab API credential configuration for branch creation, keeping MVP usable without credentials.
- [x] 4.8 Implement project and group based task sequence generation.
- [x] 4.9 Stop for user review before moving to inbox/task planning implementation.

## 5. Inbox And Task Planning

- [x] 5.1 Implement note list/create/update/archive APIs.
- [x] 5.2 Implement convert-note-to-task API that links the source note and writes timeline events.
- [x] 5.3 Implement task CRUD and task status APIs.
- [x] 5.4 Build dashboard inbox quick-add panel.
- [x] 5.5 Build inbox page with actionable, pending, and archived filters while hiding converted notes from normal inbox review.
- [x] 5.6 Build convert-note-to-task drawer with project, group, priority, type, and target date fields.
- [x] 5.7 Build task table view with filters for project, group, status, priority, type, branch, and text query.
- [x] 5.8 Build task detail drawer with editable fields and timeline tab placeholder.
- [x] 5.9 Implement a dedicated mark-ready-prod task button/action used as a production-readiness planning signal, not a hard completion gate.
- [x] 5.10 Record timeline events for task creation and manual task status changes.
- [x] 5.11 Stop for user review before moving to branch lifecycle implementation.

## 6. Branch Lifecycle

- [x] 6.1 Implement branch CRUD APIs scoped by repository and project.
- [x] 6.2 Add branch fields for checkout source branch, source branch record id, lineage id, intended merge target branch, actual merged-into branch, generated checkout command, and remote-created flag.
- [x] 6.3 Add task-branch fields for lineage id, inherited/carry role, active/superseded flag, and completion-required flag.
- [x] 6.4 Implement app-assisted branch creation API that stores the app branch record and links selected tasks.
- [x] 6.5 Allow app-assisted branch creation from any selected source branch, including `main`, feature branches, release branches, and hotfix branches.
- [x] 6.6 Implement task-link inheritance when creating branch `B` from tracked branch `A`.
- [x] 6.7 Implement optional self-hosted GitLab remote branch creation when API credentials are configured.
- [x] 6.8 Implement branch alias CRUD support.
- [x] 6.9 Implement task-branch link and unlink APIs with relationship role.
- [x] 6.10 Implement branch status update API with timeline event creation.
- [x] 6.11 Implement self-hosted GitLab release branch recognition for names like `release/08072026`.
- [x] 6.12 Implement hotfix branch metadata for branches checked out from `main`.
- [x] 6.13 Implement two-week release branch tracking so tasks can be associated with the active release branch.
- [x] 6.14 Implement `mark-merged-release` workflow action for feature branch -> release branch with branch timestamp, actual merged-into branch, status update, linked task updates, and timeline events.
- [x] 6.15 Implement `mark-merged-main` workflow action that warns about tasks not marked ready, then allows confirmed main merge recording, updates branch timestamp/status, actual merged-into branch, linked task completion by lineage, and timeline events.
- [x] 6.16 Implement record-merged-into action for correcting or documenting actual merge destinations.
- [x] 6.17 Ensure branch `B` created from task branch `A` can complete the carried task when `B` reaches `main`.
- [x] 6.18 Ensure multi-branch tasks only require every independent required branch lineage, not every historical branch, to reach `main`.
- [x] 6.19 Ensure closed branches never complete linked tasks automatically.
- [x] 6.20 Build create-branch drawer with task selection, checkout source branch, inherited task links, intended merge target branch, branch type, branch name suggestion, and checkout command preview.
- [x] 6.21 Build branch table view with status, repository, linked tasks, checkout source, intended target, actual merged-into, MR URL, aliases, current release branch, lineage, and quick actions.
- [x] 6.22 Build branch detail drawer with linked tasks, branch path, merge target history, lineage, and timeline tab placeholder.
- [x] 6.23 Add branch suggestion helper for names like `feature/PROJECT-GROUP-001-short-title` and `hotfix/PROJECT-GROUP-001-short-title`.
- [x] 6.24 Stop for user review before moving to timeline implementation.

## 7. Timeline And Audit

- [x] 7.1 Implement timeline query API with project, task, branch, event type, and date filters.
- [x] 7.2 Implement timeline comment API.
- [x] 7.3 Build timeline page with compact filters and event list.
- [x] 7.4 Add timeline tab to task detail drawer.
- [x] 7.5 Add timeline tab to branch detail drawer.
- [x] 7.6 Verify all important note, task, branch, link, release merge, main merge, comment, blocked, and unblocked events are recorded.
- [x] 7.7 Stop for user review before moving to work visibility implementation.

## 8. Work Visibility

- [x] 8.1 Build dashboard blocks for active tasks, branches ready for test/release/main, blocked work, inbox notes, and recent timeline events.
- [x] 8.2 Add dashboard signals for target dates near or past today.
- [x] 8.3 Implement global search API across task code, task group, task title, note content, branch name, and branch alias.
- [x] 8.4 Build global search UI that opens task or branch drawers from results.
- [x] 8.5 Build first-phase task board grouped by status.
- [x] 8.6 Build first-phase branch board grouped by lifecycle status.
- [x] 8.7 Add views for tasks without branch links and branches not merged to `main`.
- [x] 8.8 Add task detail branch path display showing feature branch, checkout source, release target, actual merged-into branch, inherited branches, and `main` status without exposing lineage jargon to the user.
- [x] 8.9 Build All Tasks view grouped by practical status buckets: not started, in progress, waiting/review/testing, in release, ready for main, done, blocked, and cancelled.
- [x] 8.10 Add group counts, project/group filters, and drawer opening from the All Tasks grouped view.
- [x] 8.11 Stop for user review before moving to workflow settings implementation.

## 9. Workflow Settings And UI Polish

- [x] 9.1 Implement workflow settings APIs for task statuses, branch statuses, labels, display order, enabled flag, and custom colors.
- [x] 9.2 Seed semantic default colors for task and branch statuses so the app is readable before customization.
- [x] 9.3 Build workflow settings UI with compact color picker or preset color selection for statuses.
- [x] 9.4 Apply status colors consistently to dashboard, task table, branch table, grouped boards, drawers, and timeline.
- [x] 9.5 Apply simple static colors for note statuses: pending, archived, and converted.
- [x] 9.6 Ensure colors are paired with visible text labels so status is still clear without relying on color alone.
- [x] 9.7 Ensure Vietnamese UI labels across navigation, forms, buttons, empty states, filters, and validation messages.
- [x] 9.8 Add dark mode to the post-MVP backlog without making it part of MVP acceptance.
- [x] 9.9 Stop for user review before moving to verification.

## 10. Verification

- [x] 10.1 Add backend unit tests for feature branch -> release branch merge rules.
- [x] 10.2 Add backend unit tests for main merge warning behavior when linked tasks are not release-ready.
- [x] 10.3 Add backend unit tests for main merge completion rules, including multi-branch tasks.
- [x] 10.4 Add backend tests for auth guard and protected APIs.
- [x] 10.5 Add backend tests for task code generation with project groups.
- [x] 10.6 Add backend tests for app-assisted branch creation with checkout source and intended merge target.
- [x] 10.7 Add backend tests for creating branch `B` from task branch `A` and inheriting task links.
- [x] 10.8 Add backend tests proving branch `B` merged to `main` completes the carried task even if `A` did not reach `main`.
- [x] 10.9 Add backend tests for actual merged-into branch tracking.
- [x] 10.10 Add frontend component or integration tests for login, note conversion, task drawer, branch creation drawer, branch drawer, All Tasks grouped view, workflow settings, and merge quick actions.
- [x] 10.11 Run typecheck, lint, backend tests, frontend tests, and build.
- [x] 10.12 Manually verify the MVP flow: note -> task -> create feature branch A -> create branch B from A -> B reaches main -> task done -> All Tasks done bucket -> timeline.
- [x] 10.13 Stop for user review before considering post-MVP Git automation.

## 11. Branch Kanban And Status Movement

- [x] 11.1 Keep GitLab automation deferred; do not implement webhook automation in this phase.
- [x] 11.2 Review the current `/branches` flow and keep existing create branch, edit drawer, table filters, merge release, merge main, and manual status editing available.
- [x] 11.3 Add workflow metadata for branch statuses to control whether a branch can be dropped into that status from Kanban.
- [x] 11.4 Seed sane default Kanban drop behavior: normal work statuses allow manual drop, merge-derived statuses require merge actions by default, and closed requires explicit confirmation.
- [x] 11.5 Extend workflow settings UI so branch statuses show whether Kanban drop is allowed and, when not allowed, why.
- [x] 11.6 Add backend branch status move API that validates the target status Kanban-drop rule, records timeline events, and does not bypass merge release/main business rules.
- [x] 11.7 Build `/branches` view mode toggle between table and Kanban while keeping compact filters and the existing create-branch action.
- [x] 11.8 Build Branch Kanban as one horizontal row of status columns, with each column kept in the same row and horizontally scrollable on small screens.
- [x] 11.9 Add drag-and-drop for branch cards between allowed status columns, with optimistic UI only after backend validation succeeds.
- [x] 11.10 When dropping into a restricted status, block the drop and show the correct action path, for example use `Merge release` or `Merge main`.
- [x] 11.11 Keep branch cards compact but useful: branch name, repo, linked task codes, source/target path, status color, and quick actions.
- [x] 11.12 Add UI test for dragging a branch into an allowed status and rejecting a restricted drop.
- [x] 11.13 Stop for user review before moving to any GitLab automation.

## 12. Later: Post-MVP Self-Hosted GitLab Automation

- [ ] 12.1 Add self-hosted GitLab webhook configuration storage.
- [ ] 12.2 Implement self-hosted GitLab webhook endpoint for merge request merge events.
- [ ] 12.3 Match GitLab source and target branch names to registered branches, aliases, `main`, and `release/DDMMYYYY`.
- [ ] 12.4 Write timeline events from webhook processing.
- [ ] 12.5 Keep manual override actions available after webhook automation is enabled.
- [ ] 12.6 Review whether local Git repository scanning is needed in addition to GitLab webhooks.
