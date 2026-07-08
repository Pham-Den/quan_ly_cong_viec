## Context

This is a new personal internal tool. The current workspace only contains planning docs, so implementation must not start until the user reviews and explicitly approves the OpenSpec artifacts or a specific phase.

The main domain problem is traceability: small requests become tasks, tasks are implemented in feature branches, feature branches are merged into a two-week release branch, and the release branch is merged into `main`. A task is only truly done after it reaches `main`. The UI must stay compact because the app is for repeated daily use, not project-management ceremony.

The first runtime target is local. The app should still keep enough structure to support more users later, but MVP UX and auth can assume one primary user.

## Goals / Non-Goals

**Goals:**

- Provide login-protected access for a personal workspace.
- Keep MVP local-first with Docker Compose support.
- Let the user capture quick notes and convert them into planned tasks.
- Organize tasks and repositories by project.
- Support task code groups inside a project, such as `CRM-BE-001` or `CRM-FE-001`.
- Track branches independently from tasks while keeping each task attached to at most one active branch.
- Support self-hosted GitLab first, production branch `main`, release branches like `release/08072026`, and hotfix branches checked out from production.
- Allow users to create branch records from the app at any time using configurable Git flow rules for checkout source branch, intended merge target branches, active release branch, branch naming, and generated checkout command.
- Allow actual self-hosted GitLab branch creation later when repository API credentials are configured.
- Make feature, release, and main merge state explicit.
- Treat actual merge into `main` as the source of truth for task completion; task detail does not expose a separate ready-for-production gate.
- Automatically update linked task status after release/main merge actions according to deterministic rules.
- Record timeline events for every important status, link, and merge action.
- Provide dashboard, all-task status overview, search, table, board, drawer, and filter workflows that are fast to use.
- Use Vietnamese UI text, custom status colors, and a later phase for dark mode.

**Non-Goals:**

- Do not build a full Jira replacement in MVP.
- Do not require Git provider webhook automation before manual tracking works.
- Do not model sprints, epics, story points, or team permissions in MVP.
- Do not mark tasks done based only on review, testing, or release branch merge.
- Do not implement application code before review approval.

## Decisions

### Decision 1: Use a split frontend/backend app

Use Vue 3 + Vite + TypeScript + Ant Design Vue for the frontend and a Node.js API for the backend.

Rationale: the app needs login, persistence, workflow actions, and later Git webhooks. A backend API keeps workflow rules centralized instead of embedding production-merge logic only in the UI.

Alternative considered: a frontend-only app with local storage. This is faster but weak for login, audit history, future webhooks, and durable data.

### Decision 2: Use a compact Fastify API with Prisma and SQLite first

Use Fastify with TypeScript for a compact backend. Use Prisma as the data model boundary. Use SQLite for local MVP, with a datasource/configuration path that can switch to PostgreSQL or another supported database later.

Rationale: the app is personal and local-first, so a small API is better than a heavier framework. Prisma keeps schema changes explicit and gives a migration path from SQLite to a durable database.

Alternative considered: Express, NestJS + PostgreSQL from the start, direct SQL, or an ad hoc JSON store. Fastify keeps the implementation compact while still giving strong TypeScript-friendly routing and plugin structure. NestJS is more structured but heavier than needed for the first local version.

### Decision 3: Model tasks and branches separately

Create separate `tasks`, `branches`, and `task_branches` tables. `branches` stores checkout source, source branch record, merge target fields, active release assignment, and internal flow/completion fields. `task_branches` stores the relationship role such as `PRIMARY`, `FIX`, `FOLLOW_UP`, `CARRIED_FROM_SOURCE`, or `CHERRY_PICK`.

Rationale: one branch can contain multiple tasks, but for the personal tracking workflow one task should only have one active implementation branch at a time. Keeping the link table preserves history and makes reassignment explicit without making the daily UI complex.

Alternative considered: store branch name directly on task. This is too limited for combined branches, release-cycle tracking, follow-up fixes, cherry-picks, and answering "this task's branch was checked out from where and merged into where?"

Note: `CHERRY_PICK` means taking one specific commit from one branch and applying it to another branch. It should be supported as metadata later, but it does not need a complex first-class MVP workflow.

### Decision 4: Centralize status transitions in backend workflow actions

Expose explicit API actions such as `POST /api/branches/:id/mark-merged-release` and `POST /api/branches/:id/mark-merged-main`. These actions update branch state, evaluate linked tasks, and write timeline events in one transaction. The main merge action records the real release-to-main merge and completes eligible tasks because `main` is the source of truth.

Rationale: merge-driven task updates are business rules. They should be consistent whether triggered manually from the UI or later by a Git webhook.

Alternative considered: generic PATCH endpoints only. Generic updates are flexible but make it easy to bypass required timeline and task recalculation logic.

### Decision 5: Use timeline events as the audit trail

Every important action creates a `timeline_events` row. Events can reference a project, task, branch, and JSON metadata.

Rationale: the user's main pain is losing the history of what happened. Timeline events make state transitions explainable and searchable.

Alternative considered: store only current status fields. Current state is necessary but not enough to reconstruct why a task moved or when a branch merged.

### Decision 6: Keep the UI operational, compact, and drawer-based

Use Ant Design Vue layout, table, tabs, drawer, form, timeline, tags, and dropdown actions. Use task/branch detail drawers to avoid page hopping. UI text is Vietnamese. Status colors are custom and configurable. Dark mode is planned for a later phase, not MVP.

Rationale: the app is for daily operational tracking. Dense scan-friendly views matter more than decorative screens.

Alternative considered: card-heavy landing or marketing-style layout. That would waste space and slow repeated workflows.

### Decision 7: Review gates before implementation and phase transitions

Every implementation phase must wait for user review and explicit approval before any code changes begin. After a phase is implemented and verified, the next phase also waits for approval.

Rationale: the user explicitly wants control over scope and review before work proceeds.

Alternative considered: implement the full MVP after writing specs. That is faster but violates the requested collaboration model.

### Decision 8: Keep the app personal-first, not process-first

The UI must optimize for one person's daily question: "Task nay dang nam o nhanh nao, da toi release nao, da vao main chua?" Internal models such as branch flow state, release-cycle links, and completion-required flags exist only to calculate status correctly. The UI should present them as a simple task path and branch history, not as process-heavy project management concepts.

In branch-facing views, linked tasks should be identified by their title first because the title is what the user recognizes during daily work. Task codes remain visible as secondary reference ids for search/linking, and task groups remain primarily for task-code generation, task views, and filters rather than being promoted in branch cards.

Rationale: the app is for personal memory and control, not team governance.

Alternative considered: expose all Git/workflow metadata directly. That would make the app powerful but too noisy for the core personal-use case.

### Decision 9: Make All Tasks the primary status view

The app should include an All Tasks view that groups every task into practical branch-derived buckets: not started, in progress, in release, and on prod/done. This view should be easier to scan than a raw status table, while still allowing table filters and drawer details.

Rationale: the user needs a quick picture of task health across all projects/branches.

Alternative considered: rely only on dashboard widgets and search. That is useful for action items, but it does not provide a complete task status picture.

### Decision 10: Use semantic status colors for scan speed

Task, branch, and note statuses should be visually distinct with compact colored tags and board/bucket accents. The status key remains the workflow source of truth; color is display metadata and can be customized later from workflow settings.

Default color intent:

- Neutral/gray: draft, planned, archived, closed, cancelled.
- Blue/cyan: active coding or in-progress work.
- Purple/indigo: release or planned transition states.
- Orange/gold: attention states.
- Green: merged into `main` or truly done.
- Red: blocked or failing states.

Rationale: the user scans the app repeatedly to answer "task dang o dau?". Colors should reduce reading effort without replacing the actual status text.

Alternative considered: only show status text. This is compact but makes All Tasks, branch tables, and dashboards harder to scan once there are many records.

## Data Model

Core tables:

- `users`: login identity and password hash.
- `refresh_tokens`: refresh-token persistence and revocation.
- `projects`: project name, code, description, and default repo.
- `task_groups`: user-managed project-scoped groups used in task codes. The system does not require fixed default groups; the user can add groups when needed.
- `repositories`: project repo config, provider, self-hosted GitLab URL, optional GitLab project id/path, default branch name, production branch `main`, and release branch pattern.
- `notes`: quick inbox items with source and conversion state.
- `workflow_statuses`: configurable task/branch statuses, labels, order, enabled flag, and custom color.
- `tasks`: planned work item with code, group, title, description, branch-derived status, priority, type, target date, and done timestamp.
- `branches`: repo branch with lifecycle status, branch type, checkout source branch, source branch record id, lineage id, intended merge target branches, actual merged-into branch, active release branch/cycle reference, base branch, MR URL, release/main merge timestamps, release cycle date, generated checkout command, and aliases.
- `task_branches`: task-branch link history with active/superseded flag. The app enforces one active branch per task while still allowing one branch to link multiple tasks.
- `timeline_events`: audit log for note, task, branch creation/deletion, merge, comment, blocked, and unblocked events.

Recommended indexes:

- `tasks(project_id, status)`
- `tasks(code)`
- `tasks(project_id, group_id)`
- `branches(repo_id, name)`
- `branches(repo_id, branch_type)`
- `branches(status)`
- `task_branches(task_id, branch_id)`
- `timeline_events(project_id, created_at)`

## API Shape

Auth:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

Projects and repositories:

- `GET /api/projects`
- `POST /api/projects`
- `PATCH /api/projects/:id`
- `GET /api/repositories?projectId=`
- `POST /api/repositories`
- `PATCH /api/repositories/:id`
- `GET /api/task-groups?projectId=`
- `POST /api/task-groups`
- `PATCH /api/task-groups/:id`

Notes and tasks:

- `GET /api/notes?projectId=&status=`
- `POST /api/notes`
- `PATCH /api/notes/:id`
- `POST /api/notes/:id/convert-to-task`
- `GET /api/tasks?projectId=&status=&q=&branchId=`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/status`
- `POST /api/tasks/:id/link-branch`

Branches and timeline:

- `GET /api/branches?projectId=&repoId=&status=&q=`
- `POST /api/branches`
- `POST /api/branches/create-from-app`
- `GET /api/branches/:id`
- `PATCH /api/branches/:id`
- `DELETE /api/branches/:id`
- `POST /api/branches/:id/status`
- `POST /api/branches/:id/mark-merged-release`
- `POST /api/branches/:id/mark-merged-main`
- `POST /api/branches/:id/record-merged-into`
- `GET /api/timeline?projectId=&taskId=&branchId=&eventType=`
- `POST /api/timeline/comment`
- `GET /api/workflow-settings?projectId=`
- `PATCH /api/workflow-settings`

Future webhooks:

- `POST /api/webhooks/gitlab`

## Status Rules

Task statuses:

- `PLANNED`: chưa gắn branch nào.
- `IN_PROGRESS`: đang có branch active ở trạng thái đang tiến hành hoặc develop.
- `MERGED_RELEASE`: branch active đã vào release.
- `DONE`: branch active đã theo release vào `main`/prod.

Branch statuses:

- `CODING`: đang tiến hành.
- `MERGED_DEVELOP`: vào develop, vẫn được tính là task đang tiến hành.
- `MERGED_RELEASE`: release.
- `MERGED_MAIN`: main/prod.

Merge rules:

- Marking a feature branch merged to `develop` records progress only; it does not complete tasks.
- Creating or linking a branch to a task moves that task to `IN_PROGRESS` and deactivates any previous active branch link for that same task.
- A task without an active branch is `PLANNED`.
- Task records can be deleted only before the active branch path reaches `MERGED_MAIN`; deletion writes a timeline audit event first, then removes task-branch links through cascade cleanup while keeping branch records intact.
- Marking a feature or hotfix branch merged to the active release branch creates a timeline event and can move linked tasks to `MERGED_RELEASE`, but never to `DONE`.
- The release branch is a separate weekly base branch. It checks out from `main`, receives task branch merges, and later merges back into `main`.
- Release branch cards start in `MERGED_RELEASE`; the only allowed lifecycle movement after that is into `MERGED_MAIN`, which must run the release-to-main workflow rather than a generic status update.
- Release branch cards use a distinct visual treatment in Kanban so the user can separate the weekly release base from task implementation branches at a glance.
- In Kanban, task branches that have merged into a release are displayed as child rows inside the release branch card. Child rows can be manually reordered inside that release parent. While the parent is still in `MERGED_RELEASE`, a child can be corrected by editing its status or dragging it out to a normal lifecycle column; this clears its release assignment and returns linked tasks out of release when no other required branch flow remains in release/main. Once the release parent reaches `MERGED_MAIN`, child branches stay locked under that parent until the parent is rolled back to `MERGED_RELEASE`.
- Branch table, Kanban card, card action menu, and branch drawer controls should prefer disabled states over hiding unavailable actions. This keeps the full workflow visible while still preventing invalid edits.
- Branch detail fields that are state-derived or unsafe to mutate after creation should stay visible but disabled, for example repository/type on existing branches, existing task links, release-child status, and branch identity once the branch is in release/main.
- When recording a task branch as merged to release, the user can choose or change the specific release branch; that target must be a distinct release branch, not the same feature/hotfix branch.
- Marking a release branch merged to `main` is the source of truth for completion. The action propagates main state to task branches attached to that release branch/cycle and evaluates linked tasks.
- There is no separate task-level ready-main gate in the current UI. If a task branch is attached to a release branch and that release branch reaches `main`, the linked task follows the branch-derived status rules.
- If a release branch was moved to `main` by mistake, the user can drag that release branch back to `MERGED_RELEASE`. This correction clears main merge state from the release branch and its child task branches, reopens the release cycle, and moves tasks that are no longer fully represented in `main` back to `MERGED_RELEASE`.
- Branch records can be deleted only before they reach `MERGED_MAIN`. Deletion writes a timeline audit event first, then removes task links and branch aliases through cascade cleanup.
- A release branch cannot be deleted while it still contains child task branches. The user must first move those children to another release branch or delete those children while they are not in `main`.
- A child task branch under a release parent in `MERGED_MAIN` cannot be reassigned to another release, dragged/moved to another lifecycle status, or deleted. If the release parent was moved to `main` by mistake, the parent must be dragged back to `MERGED_RELEASE`; only then can the child branch be corrected or deleted.
- A task becomes `DONE` when its single active branch has entered a release branch/cycle that has been merged into `main`.
- A branch marked `CLOSED` or cancelled never marks tasks done automatically.
- Manual overrides are allowed but must write a timeline event with before/after status.

GitLab branch rules:

- Production branch defaults to `main`.
- Task branches created from the app default to checkout source `main`.
- Release branches are created per configured release cycle or sprint.
- Release branches use a configurable pattern and default to `release/DDMMYYYY`.
- Feature branches use a configurable pattern and default to `feature/{jiraCode}`.
- Hotfix branches use a configurable pattern and default to `hotfix/{jiraCode}-{date}`.
- Feature branches default to intended targets `develop`, active release branch, and `main`.
- Hotfix branches default to intended targets active release branch and `main`.
- Checkout source override and direct task-branch-to-main merge are advanced rule flags and are disabled by default.
- Branch aliases are allowed for existing branch names that do not contain the task code.
- Branches created from the app must record checkout source branch and intended merge target branches as the original plan.
- Branches created from another tracked task branch are not part of the default flow; keep this as a future advanced override if needed.
- If self-hosted GitLab API credentials are not configured, app branch creation creates a local app record and shows the checkout command; it does not pretend the remote branch exists.
- If self-hosted GitLab API credentials are configured, app branch creation can create the real remote branch and then store the app record.

## Risks / Trade-offs

- Branch names may not include task codes -> allow manual linking and branch aliases/search.
- Too many statuses may slow usage -> group statuses visually in dashboard while preserving detailed backend states.
- Configurable statuses can make workflow rules harder -> keep canonical status keys internally and allow labels/colors/order to be configured first.
- Too many custom colors can become noisy -> ship semantic defaults first, then allow per-project overrides in workflow settings.
- Manual merge tracking can be forgotten -> dashboard should highlight branches stuck before release or before `main`; add self-hosted GitLab webhooks after MVP.
- Historical branch links can be confusing -> show only the active branch path in normal task views and keep superseded links as audit history.
- GitLab webhook matching can be wrong -> make webhook integration a later phase and keep timeline logs for review.
- Branch-flow modeling can feel complex -> hide technical modeling terms in the UI and show a simple task path instead.

## Migration Plan

1. Wait for user review and explicit approval of OpenSpec artifacts.
2. Bootstrap frontend/backend structure.
3. Add database schema and seed a first user/project.
4. Implement MVP manual workflows one phase at a time, waiting for review approval between phases.
5. Add self-hosted GitLab webhook integration only after manual branch lifecycle is proven.
6. If starting with SQLite, migrate Prisma datasource to PostgreSQL or another durable database only when needed.

## Open Questions

- None currently. Implementation still waits for user review and explicit approval.
