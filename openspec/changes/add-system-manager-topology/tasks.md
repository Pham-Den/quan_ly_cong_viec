## 1. Review Gate

- [ ] 1.1 Review this OpenSpec change with the user before implementing application code.
- [ ] 1.2 Confirm phase 1 remains frontend mock only: no backend API, no Prisma schema, no scanner, no import.
- [ ] 1.3 Confirm Vue Flow dependency is acceptable for phase 1.

## 2. Frontend Dependency And Routing

- [ ] 2.1 Add Vue Flow dependency and required Vue Flow CSS imports.
- [ ] 2.2 Add `System Manager` sidebar menu item.
- [ ] 2.3 Add authenticated `/system-manager` route.
- [ ] 2.4 Create `SystemManagerView.vue` as a desktop-first internal tool screen.

## 3. Mock Topology Data

- [ ] 3.1 Create mock topology data for `Local` and `Dev` environments.
- [ ] 3.2 Model B2P app in collapsed and expanded component forms.
- [ ] 3.3 Add B2P components: Web/API, Queue Worker, Scheduler, Consumer.
- [ ] 3.4 Add shared services: MariaDB, Redis, Kafka, SAP API, Mail, OCR.
- [ ] 3.5 Add dependency edges with config labels such as `DB_HOST`, `REDIS_HOST +3`, `KAFKA_BROKER / publish`, and `KAFKA_BROKER / consume`.
- [ ] 3.6 Include mock runtime detail for side panel: host, IP, port, container name, image, notes, and config groups.

## 4. Graph Canvas

- [ ] 4.1 Build Vue Flow canvas with left-to-right mock node positions.
- [ ] 4.2 Build custom node UI showing name, type, and status.
- [ ] 4.3 Build custom edge UI or labels for config keys.
- [ ] 4.4 Add MiniMap, Controls, Background, zoom, and pan support.
- [ ] 4.5 Support app collapsed view with aggregate B2P dependencies.
- [ ] 4.6 Support double click on app node to expand/collapse B2P components.
- [ ] 4.7 Keep host grouping off by default in phase 1.

## 5. Side Panel

- [ ] 5.1 Open side panel Overview tab when a node is clicked.
- [ ] 5.2 Open config/dependency detail when an edge is clicked.
- [ ] 5.3 Add side panel tabs: Overview, Runtime, Configs, Dependencies, Flow, Notes.
- [ ] 5.4 Group config values by App, DB, Redis, Kafka, External API, and Mail.
- [ ] 5.5 Mask sensitive config values by default and add eye reveal behavior.
- [ ] 5.6 Add copy action for full config lines such as `DB_HOST=mariadb-dev.local`.

## 6. Search

- [ ] 6.1 Add search input to the System Manager toolbar.
- [ ] 6.2 Search by app/service name, host, IP, and config key.
- [ ] 6.3 Group search results by Apps, Services, Hosts, Configs, and IPs.
- [ ] 6.4 Selecting a node result centers/highlights the node and opens side panel detail.
- [ ] 6.5 Selecting a config result, such as `DB_HOST`, centers/highlights the related edge and opens config detail.

## 7. Flow Viewer

- [ ] 7.1 Add `Start flow` action in the side panel.
- [ ] 7.2 Traverse downstream dependencies from B2P or a selected component.
- [ ] 7.3 Highlight downstream nodes and edges while dimming unrelated graph items.
- [ ] 7.4 List flow steps in the side panel grouped by component.
- [ ] 7.5 Show config key and direction/role for each flow step.
- [ ] 7.6 Add a clear/reset highlight action.

## 8. Visual Polish And Desktop UX

- [ ] 8.1 Use compact internal-tool styling consistent with existing Ant Design Vue app.
- [ ] 8.2 Apply status colors: healthy green, warning yellow, down red, unknown gray, maintenance blue, disabled light gray.
- [ ] 8.3 Keep text inside graph nodes and buttons from overflowing.
- [ ] 8.4 Ensure the graph has stable desktop dimensions and side panel does not overlap controls.
- [ ] 8.5 Keep mobile responsive work out of phase 1.

## 9. Verification

- [ ] 9.1 Run frontend typecheck.
- [ ] 9.2 Run frontend build.
- [ ] 9.3 Run existing relevant tests if available.
- [ ] 9.4 If a dev server is used, verify `/system-manager` opens and the graph is nonblank.
- [ ] 9.5 Manually verify: switch Local/Dev, click node, click edge, search `DB_HOST`, expand/collapse B2P, start flow, reveal/copy config.
- [ ] 9.6 Stop for user review before adding backend persistence or scanner.
