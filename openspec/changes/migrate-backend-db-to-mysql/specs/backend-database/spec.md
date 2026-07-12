## ADDED Requirements

### Requirement: Backend can resolve MySQL database configuration
The backend SHALL support local MySQL database configuration through `DB_*` environment variables.

#### Scenario: Build MySQL URL from DB variables
- **WHEN** `DB_CONNECTION=mysql` and the required `DB_*` values are set
- **THEN** the backend can derive a Prisma-compatible MySQL `DATABASE_URL`

#### Scenario: Use explicit DATABASE_URL override
- **WHEN** `DATABASE_URL` is explicitly set
- **THEN** the backend uses it as the database URL override

### Requirement: Backend database can migrate to MySQL
The backend SHALL be able to run Prisma schema setup, seed, tests, and local dev against MySQL.

#### Scenario: Run MySQL schema setup
- **WHEN** the backend runs database setup after provider migration
- **THEN** Prisma creates or updates schema objects in MySQL

#### Scenario: Run seed against MySQL
- **WHEN** the backend seed command runs with MySQL configuration
- **THEN** required bootstrap/sample data is created in the MySQL database

#### Scenario: Run tests against isolated MySQL database
- **WHEN** backend tests run after migration
- **THEN** they use an isolated MySQL test database and do not depend on SQLite files

### Requirement: Existing SQLite data is protected during migration
The migration SHALL not delete existing SQLite database files until MySQL migration is verified.

#### Scenario: Preserve SQLite backup
- **WHEN** the backend switches to MySQL
- **THEN** existing SQLite `.db` files remain available for rollback or data export
