## ADDED Requirements

### Requirement: User can manage projects
The system SHALL allow the authenticated user to create, view, update, and select projects used to group notes, tasks, repositories, branches, and timeline events.

#### Scenario: Create project
- **WHEN** the user creates a project with a name and code
- **THEN** the project is available in project filters and can own tasks and branches

#### Scenario: Select project
- **WHEN** the user selects a project from the main layout
- **THEN** task, branch, note, dashboard, and timeline views are filtered to that project by default

### Requirement: User can manage repositories per project
The system SHALL allow repositories to be associated with projects and configured with provider, self-hosted GitLab URL, default branch, production branch name, and release branch pattern.

#### Scenario: Add repository
- **WHEN** the user adds a repository to a project
- **THEN** branches can be created or linked under that repository

#### Scenario: Configure release branches
- **WHEN** the user sets production branch `main` and release pattern `release/DDMMYYYY`
- **THEN** merge actions and future GitLab webhook matching use those values as release targets

#### Scenario: Self-hosted GitLab repository
- **WHEN** the user creates a repository with provider `GITLAB_SELF_HOSTED`
- **THEN** the system stores the internal GitLab URL for future webhook integration

#### Scenario: Configure GitLab project for branch creation
- **WHEN** the user adds a self-hosted GitLab project id or project path to a repository
- **THEN** the system can use that repository configuration for app-assisted branch creation when API credentials are available

### Requirement: Project codes support task numbering
The system SHALL use project codes and optional task group codes as the prefix for generated task codes.

#### Scenario: Generate task code
- **WHEN** the user creates a task in project code `CRM`
- **THEN** the system assigns a readable code such as `CRM-001` according to the project's next sequence

#### Scenario: Generate grouped task code
- **WHEN** the user creates a task in project `CRM` and group `BE`
- **THEN** the system assigns a readable code such as `CRM-BE-001` according to the project's group sequence

### Requirement: User can manage task groups
The system SHALL allow the user to self-manage project-scoped task groups that can be created, updated, disabled, and used in task code generation.

#### Scenario: Create task group
- **WHEN** the user creates task group `FE` under project `CRM`
- **THEN** the group is available when creating tasks for that project
