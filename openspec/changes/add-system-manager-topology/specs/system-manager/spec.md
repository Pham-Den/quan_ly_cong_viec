## ADDED Requirements

### Requirement: User can open System Manager
The system SHALL provide an authenticated `System Manager` menu item and `/system-manager` route for a desktop-first system topology dashboard.

#### Scenario: Open System Manager route
- **WHEN** an authenticated user opens `/system-manager`
- **THEN** the system shows the System Manager topology screen with toolbar, graph canvas, search, and side panel area

#### Scenario: Require authentication
- **WHEN** an unauthenticated user tries to open System Manager
- **THEN** the system uses the existing auth routing behavior and redirects/rejects access consistently with other protected routes

### Requirement: User can view mock topology by environment
The system SHALL provide phase 1 frontend mock topology data for `Local` and `Dev` environments.

#### Scenario: Switch environment
- **WHEN** the user selects `Local` or `Dev`
- **THEN** the graph, search results, side panel data, and flow details reflect the selected environment

#### Scenario: Keep phase 1 frontend-only
- **WHEN** the user opens System Manager phase 1
- **THEN** the displayed topology comes from frontend mock data without requiring backend API or database persistence

### Requirement: System Manager topology can be loaded from backend
The system SHALL provide authenticated read APIs for persisted System Manager environments and topology data.

#### Scenario: List environments
- **WHEN** an authenticated user opens System Manager after phase 2
- **THEN** the frontend can load available environments from the backend

#### Scenario: Load topology by environment
- **WHEN** the frontend requests topology for `local` or `dev`
- **THEN** the backend returns nodes, edges, config groups, runtime details, and dependency metadata for that environment

#### Scenario: Reject unauthenticated topology request
- **WHEN** an unauthenticated request calls the System Manager topology API
- **THEN** the backend rejects it using the existing auth guard

#### Scenario: Seed B2P topology
- **WHEN** the database seed runs
- **THEN** the system creates or updates the B2P Local/Dev sample topology used by the System Manager UI

### Requirement: Topology structure is global while runtime/config is environment-specific
The system SHALL model app/component/service nodes and dependency flow once globally, while storing runtime, status, host/IP/port, config values, and service bindings per environment.

#### Scenario: Create node once for all environments
- **WHEN** the user creates a topology node such as `B2P Web/API`
- **THEN** that node belongs to the global topology blueprint and can appear in Local, Dev, Staging, Production, or custom environments without being recreated per environment

#### Scenario: Create dependency once for all environments
- **WHEN** the user creates a dependency such as `B2P Web/API -> Redis` with config key `REDIS_HOST`
- **THEN** the dependency flow exists globally and is reused across all environments

#### Scenario: Switch environment binding
- **WHEN** the user switches from Local to Dev
- **THEN** the graph keeps the same logical flow but shows Dev runtime/config/status/binding values instead of Local values

#### Scenario: Keep global node names
- **WHEN** the user views the graph in any environment
- **THEN** service nodes use global names such as `Redis`, `MariaDB`, and `Kafka` rather than environment-suffixed names such as `Redis Local`

#### Scenario: Configure dependency per environment
- **WHEN** the user edits `REDIS_HOST` for Dev
- **THEN** only the Dev config value and service binding change; the global dependency `B2P Web/API -> Redis` remains unchanged

#### Scenario: Show dependency environment config editor
- **WHEN** the user opens dependency management for a global edge
- **THEN** the UI shows an environment selector so the user can view or edit that edge's config values for Local, Dev, or another environment

#### Scenario: Edit edge config using env syntax
- **WHEN** the user edits dependency edge config
- **THEN** the UI accepts `.env` style lines such as `REDIS_HOST=redis-dev.company.local` and `REDIS_PASSWORD=secret:value`

### Requirement: User can manually manage topology data
The system SHALL provide authenticated manual management for System Manager environments, hosts, topology nodes, node config groups, dependency edges, and dependency config metadata.

#### Scenario: Create custom environment
- **WHEN** the user creates an environment with key, name, description, color, and sort order
- **THEN** the environment appears in the System Manager environment selector and can load its own topology

#### Scenario: Use configured environment color
- **WHEN** the user configures a color for an environment
- **THEN** the environment selector uses that configured color and the graph background is tinted with the selected environment color

#### Scenario: Manage hosts in selected environment
- **WHEN** the user creates, edits, or deletes a host in an environment
- **THEN** nodes in that environment can reference that host and topology runtime detail reflects host name and IP

#### Scenario: Manage topology node
- **WHEN** the user creates or edits an app, component, or service node
- **THEN** the graph can render that global node with type and notes, plus selected-environment status, runtime fields, tags, ports, and grouped config values

#### Scenario: Manage dependency edge
- **WHEN** the user creates or edits a dependency between two existing nodes in the same environment
- **THEN** the graph renders a global node-to-node edge where config key belongs to the edge blueprint and config value belongs to the selected environment binding

#### Scenario: Reload graph after save
- **WHEN** the user saves a manual management change
- **THEN** the System Manager graph, search results, side panel, and flow viewer reload from the backend data

### Requirement: User can view dependency graph
The system SHALL render a left-to-right Vue Flow graph where app/components appear on the left and dependent services appear on the right.

#### Scenario: Render graph nodes
- **WHEN** the graph loads
- **THEN** each node shows name, type, and status

#### Scenario: Render graph edges with config labels
- **WHEN** a component depends on a service through a config key
- **THEN** the graph shows a node-to-node edge with the config key on the edge label

#### Scenario: Show compact label for multiple config keys
- **WHEN** multiple config keys from the same component point to the same service
- **THEN** the graph renders one edge with a compact label such as `REDIS_HOST +3`

### Requirement: User can collapse and expand an app
The system SHALL support a collapsed app node and expanded runtime component nodes for the B2P mock app.

#### Scenario: View collapsed app dependencies
- **WHEN** B2P is collapsed
- **THEN** the graph still shows aggregate dependencies from B2P to related services

#### Scenario: Expand app components
- **WHEN** the user double clicks the B2P app node
- **THEN** the graph expands B2P into Web/API, Queue Worker, Scheduler, and Consumer component nodes with component-level dependencies

#### Scenario: Collapse app components
- **WHEN** the user double clicks the expanded B2P app area or app node control
- **THEN** the graph returns to the collapsed B2P aggregate dependency view

### Requirement: User can inspect node detail
The system SHALL open a side panel when the user clicks a graph node.

#### Scenario: Click service node
- **WHEN** the user clicks a service node such as Redis Dev
- **THEN** the side panel opens the Overview tab with service identity, status, environment, and summary details

#### Scenario: View runtime details
- **WHEN** the user opens the Runtime tab
- **THEN** the side panel shows mock host, IP, port, container name, image, and related runtime notes for that node

#### Scenario: View dependencies
- **WHEN** the user opens the Dependencies tab
- **THEN** the side panel shows upstream and downstream dependencies for the selected node in the selected environment

### Requirement: User can inspect edge config detail
The system SHALL open config/dependency detail when the user clicks an edge or config label.

#### Scenario: Click DB_HOST edge
- **WHEN** the user clicks the `DB_HOST` edge between B2P Web/API and MariaDB Dev
- **THEN** the side panel shows from node, to node, config key, config value, connection type, port, and direction

#### Scenario: Click multi-config edge
- **WHEN** the user clicks an edge labelled `REDIS_HOST +3`
- **THEN** the side panel lists all related config lines for that dependency

### Requirement: User can view and copy config values
The system SHALL show config values grouped by domain and allow copying full config lines.

#### Scenario: Group config values
- **WHEN** the user opens the Configs tab
- **THEN** config values are grouped by App, DB, Redis, Kafka, External API, and Mail

#### Scenario: Mask sensitive values
- **WHEN** a sensitive config value is shown
- **THEN** the UI masks the value by default and offers an eye control to reveal it

#### Scenario: Copy full config line
- **WHEN** the user clicks copy for a config value
- **THEN** the copied text includes the full config line such as `DB_HOST=mariadb-dev.local`

### Requirement: User can search topology data
The system SHALL provide search for app/service name, host, IP, and config key.

#### Scenario: Show grouped search results
- **WHEN** the user types a search query
- **THEN** results are grouped by Apps, Services, Hosts, Configs, and IPs

#### Scenario: Select config search result
- **WHEN** the user selects a config result such as `DB_HOST`
- **THEN** the graph centers/highlights the related edge and opens config detail in the side panel

#### Scenario: Select node search result
- **WHEN** the user selects an app, service, host, or IP result
- **THEN** the graph centers/highlights the related node and opens node detail in the side panel

### Requirement: User can start dependency flow trace
The system SHALL provide a `Start flow` action that highlights downstream dependencies and lists flow steps grouped by component.

#### Scenario: Start flow from B2P
- **WHEN** the user starts flow from B2P
- **THEN** the graph highlights B2P downstream dependencies and dims unrelated graph elements

#### Scenario: List flow steps by component
- **WHEN** a flow trace is active
- **THEN** the side panel lists flow steps grouped by B2P component with target service, config key, and direction/role

#### Scenario: Clear flow highlight
- **WHEN** the user clears the active flow trace
- **THEN** graph nodes and edges return to their normal visual state

### Requirement: System Manager phase 1 uses fixed visual defaults
The system SHALL use phase 1 visual defaults without building a settings UI.

#### Scenario: Apply status colors
- **WHEN** a node has status `healthy`, `warning`, `down`, `unknown`, `maintenance`, or `disabled`
- **THEN** the node uses the agreed status color mapping

#### Scenario: Keep host group disabled
- **WHEN** System Manager phase 1 loads
- **THEN** host grouping is disabled by default

#### Scenario: Show Vue Flow controls
- **WHEN** the graph loads
- **THEN** Vue Flow controls such as zoom/pan support, minimap, controls, and background are available
