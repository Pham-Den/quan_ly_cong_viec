## 1. Review Gate

- [x] 1.1 Review this OpenSpec change with the user before implementing application code.
- [x] 1.2 Confirm phase 1 remains frontend mock only: no backend API, no Prisma schema, no scanner, no import.
- [x] 1.3 Confirm Vue Flow dependency is acceptable for phase 1.

## 2. Frontend Dependency And Routing

- [x] 2.1 Add Vue Flow dependency and required Vue Flow CSS imports.
- [x] 2.2 Add `System Manager` sidebar menu item.
- [x] 2.3 Add authenticated `/system-manager` route.
- [x] 2.4 Create `SystemManagerView.vue` as a desktop-first internal tool screen.

## 3. Mock Topology Data

- [x] 3.1 Create mock topology data for `Local` and `Dev` environments.
- [x] 3.2 Model B2P app in collapsed and expanded component forms.
- [x] 3.3 Add B2P components: Web/API, Queue Worker, Scheduler, Consumer.
- [x] 3.4 Add shared services: MariaDB, Redis, Kafka, SAP API, Mail, OCR.
- [x] 3.5 Add dependency edges with config labels such as `DB_HOST`, `REDIS_HOST +3`, `KAFKA_BROKER / publish`, and `KAFKA_BROKER / consume`.
- [x] 3.6 Include mock runtime detail for side panel: host, IP, port, container name, image, notes, and config groups.

## 4. Graph Canvas

- [x] 4.1 Build Vue Flow canvas with left-to-right mock node positions.
- [x] 4.2 Build custom node UI showing name, type, and status.
- [x] 4.3 Build custom edge UI or labels for config keys.
- [x] 4.4 Add MiniMap, Controls, Background, zoom, and pan support.
- [x] 4.5 Support app collapsed view with aggregate B2P dependencies.
- [x] 4.6 Support double click on app node to expand/collapse B2P components.
- [x] 4.7 Keep host grouping off by default in phase 1.

## 5. Side Panel

- [x] 5.1 Open side panel Overview tab when a node is clicked.
- [x] 5.2 Open config/dependency detail when an edge is clicked.
- [x] 5.3 Add side panel tabs: Overview, Runtime, Configs, Dependencies, Flow, Notes.
- [x] 5.4 Group config values by App, DB, Redis, Kafka, External API, and Mail.
- [x] 5.5 Mask sensitive config values by default and add eye reveal behavior.
- [x] 5.6 Add copy action for full config lines such as `DB_HOST=mariadb-dev.local`.

## 6. Search

- [x] 6.1 Add search input to the System Manager toolbar.
- [x] 6.2 Search by app/service name, host, IP, and config key.
- [x] 6.3 Group search results by Apps, Services, Hosts, Configs, and IPs.
- [x] 6.4 Selecting a node result centers/highlights the node and opens side panel detail.
- [x] 6.5 Selecting a config result, such as `DB_HOST`, centers/highlights the related edge and opens config detail.

## 7. Flow Viewer

- [x] 7.1 Add `Start flow` action in the side panel.
- [x] 7.2 Traverse downstream dependencies from B2P or a selected component.
- [x] 7.3 Highlight downstream nodes and edges while dimming unrelated graph items.
- [x] 7.4 List flow steps in the side panel grouped by component.
- [x] 7.5 Show config key and direction/role for each flow step.
- [x] 7.6 Add a clear/reset highlight action.

## 8. Visual Polish And Desktop UX

- [x] 8.1 Use compact internal-tool styling consistent with existing Ant Design Vue app.
- [x] 8.2 Apply status colors: healthy green, warning yellow, down red, unknown gray, maintenance blue, disabled light gray.
- [x] 8.3 Keep text inside graph nodes and buttons from overflowing.
- [x] 8.4 Ensure the graph has stable desktop dimensions and side panel does not overlap controls.
- [x] 8.5 Keep mobile responsive work out of phase 1.

## 9. Verification

- [x] 9.1 Run frontend typecheck.
- [x] 9.2 Run frontend build.
- [x] 9.3 Run existing relevant tests if available.
- [x] 9.4 If a dev server is used, verify `/system-manager` opens and the graph is nonblank.
- [x] 9.5 Manually verify: switch Local/Dev, click node, click edge, search `DB_HOST`, expand/collapse B2P, start flow, reveal/copy config.
- [x] 9.6 Stop for user review before adding backend persistence or scanner.
- [x] 9.7 Add a phase 1 test guide covering automatic and manual review steps.

## 10. Phase 2 Scope Gate

- [x] 10.1 Confirm phase 2 is read-only backend persistence foundation.
- [x] 10.2 Keep CRUD screens, JSON/YAML import, scanner, health checks, incidents, SSH, logs, and Docker actions out of phase 2.
- [x] 10.3 Preserve existing phase 1 graph, side panel, search, and flow behavior while switching data source to API.

## 11. Phase 2 Data Model And Seed

- [x] 11.1 Add Prisma models for System Manager environments, hosts, topology nodes, node config groups, node config values, and dependency edges.
- [x] 11.2 Add relations and indexes for environment-scoped topology lookup.
- [x] 11.3 Add seed data for Local and Dev B2P topology.
- [x] 11.4 Ensure seed upserts shared service nodes rather than duplicating Redis/MariaDB/Kafka per app.
- [x] 11.5 Run Prisma db push/generate workflow for verification.

## 12. Phase 2 Backend Read API

- [x] 12.1 Add authenticated `/api/system-manager/environments` endpoint.
- [x] 12.2 Add authenticated `/api/system-manager/topology?environment=<key>` endpoint.
- [x] 12.3 Return topology DTO compatible with the frontend graph and side panel.
- [x] 12.4 Return 404 or readable error for missing environment key.
- [x] 12.5 Add backend tests for authenticated environment list and topology lookup.

## 13. Phase 2 Frontend API Integration

- [x] 13.1 Add System Manager API service.
- [x] 13.2 Load environments from backend instead of hard-coded environment options.
- [x] 13.3 Load topology from backend when environment changes.
- [x] 13.4 Add loading and error states for topology fetch.
- [x] 13.5 Keep frontend mock data as no longer the primary source for phase 2 UI.
- [x] 13.6 Preserve search, click node, click edge, expand/collapse, and flow viewer behavior.

## 14. Phase 2 Verification And Review

- [x] 14.1 Run backend typecheck/build if available.
- [x] 14.2 Run frontend typecheck and build.
- [x] 14.3 Run backend tests.
- [x] 14.4 Run System Manager Playwright smoke test.
- [x] 14.5 Add a phase 2 test guide covering seed, API, UI load, and review steps.
- [x] 14.6 Stop for user review before CRUD/import/scanner.

## 15. Phase 3 Scope Gate

- [x] 15.1 Define phase 3 as manual topology management from UI backed by authenticated APIs.
- [x] 15.2 Keep JSON/YAML import, scanner, health checks, incidents, SSH, logs, and Docker actions out of phase 3.
- [x] 15.3 Preserve existing graph, side panel, search, and flow behavior after manual changes.

## 16. Phase 3 Backend Write API

- [x] 16.1 Add authenticated create/update/delete endpoints for System Manager environments.
- [x] 16.2 Add authenticated create/update/delete endpoints for hosts scoped to an environment.
- [x] 16.3 Add authenticated create/update/delete endpoints for topology nodes scoped to an environment.
- [x] 16.4 Replace node config groups/items when a node is saved.
- [x] 16.5 Add authenticated create/update/delete endpoints for dependency edges scoped to an environment.
- [x] 16.6 Replace dependency config metadata when a dependency is saved.
- [x] 16.7 Add backend tests for manual environment, host, node, and dependency management.

## 17. Phase 3 Frontend Manual Management UI

- [x] 17.1 Add System Manager API client functions for manual management endpoints.
- [x] 17.2 Add a desktop management drawer from the System Manager screen.
- [x] 17.3 Add environment management form/list.
- [x] 17.4 Add host management form/list for the selected environment.
- [x] 17.5 Add node management form/list with runtime, tags, ports, notes, and grouped config text.
- [x] 17.6 Add dependency management form/list with source/target node selection and edge config text.
- [x] 17.7 Reload environments/topology after save/delete so graph/search/side panel/flow stay in sync.

## 18. Phase 3 Verification And Review

- [x] 18.1 Run backend Prisma validation/db push/build/test.
- [x] 18.2 Run frontend typecheck and build.
- [x] 18.3 Run System Manager Playwright smoke test.
- [x] 18.4 Add a phase 3 test guide covering manual CRUD and graph reload review steps.
- [x] 18.5 Stop for user review before JSON/YAML import or scanner.

## 19. Phase 4 Scope Gate: Global Topology Blueprint

- [x] 19.1 Correct the data model direction: nodes and dependency edges are global, not duplicated per environment.
- [x] 19.2 Keep environment-specific runtime, status, host/IP/port, config values, and service bindings separate from global topology.
- [x] 19.3 Defer JSON/YAML import/export, scanner, settings polish, and health checks until after this correction.

## 20. Phase 4 Backend Model Correction

- [x] 20.1 Add global topology node model or equivalent blueprint storage.
- [x] 20.2 Add global dependency edge model or equivalent blueprint storage.
- [x] 20.3 Add environment-specific node binding/runtime/config model.
- [x] 20.4 Add environment-specific dependency config/binding model.
- [x] 20.5 Migrate/seed B2P so the flow is declared once and Local/Dev values are bindings.
- [x] 20.6 Update read API to return the global flow decorated with selected-environment values.
- [x] 20.7 Update write API so node/dependency creation is global and environment forms edit bindings.
- [x] 20.8 Add backend tests proving one node/dependency can serve multiple environments.

## 21. Phase 4 Frontend Model Correction

- [x] 21.1 Update API client types for global nodes/edges and environment bindings.
- [x] 21.2 Update graph load to keep same logical flow while switching selected-environment values.
- [x] 21.3 Update management drawer so node/dependency creation is global.
- [x] 21.4 Add per-environment runtime/config/binding editing UI.
- [x] 21.5 Preserve search by name, IP, and config key under the selected environment.
- [x] 21.6 Preserve edge click config detail and Start flow behavior.

## 22. Phase 4 Verification And Review

- [x] 22.1 Run Prisma validation/db push/build/test.
- [x] 22.2 Run frontend typecheck/build.
- [x] 22.3 Run System Manager Playwright smoke test.
- [x] 22.4 Add a phase 4 test guide for global topology plus environment binding behavior.
- [x] 22.5 Stop for user review before import/export or scanner.
