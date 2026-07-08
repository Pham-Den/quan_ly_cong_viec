## Why

Nguoi dung dang quan ly qua nhieu yeu cau nho, Git branch ngan gon va luong merge phuc tap, nen thuong khong ro task nao dang nam o feature branch, release branch hay da vao `main`, va task nao thuc su da done. Can mot mini app gon de gom note, lap plan, lien ket task voi branch, va cap nhat trang thai theo lifecycle merge.

## What Changes

- Add authenticated personal task management with project separation.
- Add inbox notes for quick capture and conversion into planned tasks.
- Add task tracking with status, priority, type, target date, and detail drawer workflows.
- Add repository and Git branch tracking, allowing one active branch per task while still allowing one branch to contain multiple tasks.
- Add app-assisted branch creation at any time using configurable Git flow rules for trust source branch, branch naming, intended merge targets, active release branch, and task completion.
- Add branch lifecycle actions for tracking task progress from feature/hotfix branch to develop/release and from release branch to `main`.
- Add timeline/audit events for important task and branch changes.
- Add dashboard/search/all-task views to quickly see task status by group, code, title, branch name, project, and status.
- Add Vietnamese UI copy, configurable workflow/status metadata, custom status colors, and task code grouping.
- Add backend APIs and persistence for all app data.
- Add local-first Docker Compose support for repeatable local startup.
- Defer automatic self-hosted GitLab webhooks until after the manual MVP workflow is reviewed and usable.
- Require user review/approval before implementation starts and before each phase proceeds.

## Capabilities

### New Capabilities

- `auth-session`: Login, logout, current user lookup, and API protection.
- `project-workspace`: Project and repository organization for tasks and branches.
- `inbox-task-planning`: Quick note capture, conversion to tasks, and task planning workflow.
- `branch-lifecycle`: Git branch records, app-assisted branch creation, checkout source tracking, intended/actual merge target tracking, active release assignment, task-branch linking, feature/hotfix-to-release lifecycle, release-to-main lifecycle, and merge-driven task status rules.
- `timeline-audit`: Timeline events and comments for traceability across notes, tasks, branches, and merges.
- `work-visibility`: Dashboard, search, filters, task table/board, and branch table/board for day-to-day visibility.
- `workflow-settings`: Configurable task statuses, branch statuses, task code groups, status colors, release branch pattern, and future UI preferences such as dark mode.

### Modified Capabilities

- None. This is a new application with no existing OpenSpec capability baseline.

## Impact

- Creates a Vue 3 frontend app with Ant Design Vue UI patterns.
- Creates a compact Fastify backend API with authentication, CRUD endpoints, workflow actions, and persistence.
- Uses SQLite for the local MVP while keeping Prisma and configuration ready to switch to another database driver later.
- Adds database schema for users, projects, task groups, repositories, notes, tasks, branches, task-branch links, workflow settings, timeline events, and refresh tokens.
- Adds workflow rules that affect task status when linked branches are marked merged to release branches or `main`.
- Adds self-hosted GitLab release tracking with production branch `main` and release branches matching `release/DDMMYYYY`, for example `release/08072026`.
- Adds branch source/target fields so each task can show where its branch was checked out from, which release branch it entered, and whether that release reached `main`.
- Adds configurable Git flow rules so default branch source, feature/hotfix naming, intended targets, and active release branch can change without rewriting existing branch history.
- Adds future extension points for self-hosted GitLab webhooks after MVP.
