## ADDED Requirements

### Requirement: User can set up the first account
The system SHALL show a first-run setup screen when no user exists so the personal user can create the initial local account.

#### Scenario: First run setup
- **WHEN** the app starts and no user account exists
- **THEN** the system shows a setup account screen instead of the normal login screen

#### Scenario: Create first account
- **WHEN** the user submits valid first-account details
- **THEN** the system creates the account and allows the user to log in

### Requirement: User can log in with protected session
The system SHALL allow the configured personal user to log in with email and password, receive an authenticated session, and access protected application routes and APIs. The data model SHALL retain user ownership fields so the app can expand to multiple users later.

#### Scenario: Successful login
- **WHEN** the user submits valid credentials
- **THEN** the system returns an authenticated session and loads the main application layout

#### Scenario: User ownership is stored
- **WHEN** the user creates protected data after login
- **THEN** the system stores ownership information that can support future multi-user expansion

#### Scenario: Invalid login
- **WHEN** the user submits invalid credentials
- **THEN** the system rejects the login and does not expose protected data

### Requirement: User can log out
The system SHALL allow the authenticated user to log out and invalidate the active client session.

#### Scenario: Logout from main layout
- **WHEN** the user selects logout from the user menu
- **THEN** the system clears the session and redirects the user to the login screen

### Requirement: APIs require authentication
The backend SHALL protect project, note, task, branch, repository, and timeline APIs from unauthenticated access.

#### Scenario: Unauthenticated API request
- **WHEN** a request without a valid session calls a protected API
- **THEN** the backend returns an authentication error and performs no data mutation
