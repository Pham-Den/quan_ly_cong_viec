## Context

The app is a Vue 3 + Vite + TypeScript frontend with Ant Design Vue, Vue Router, Pinia, and a Fastify/Prisma backend. System Manager phase 1 is intentionally frontend-only with mock data so the user can review whether the topology experience is useful before investing in persistence, import, scanner, or operational integrations.

The product goal is not an ops-heavy CMDB. The goal is a dev-focused map: open the module, see the app dependency picture, click a node or edge, inspect config/runtime details, search by name/IP/config key, and trace downstream dependency flow.

## Goals / Non-Goals

**Goals:**

- Add a `System Manager` sidebar item and `/system-manager` route.
- Build a desktop-first topology canvas using Vue Flow.
- Use `Local | Dev` segmented environment switch in phase 1.
- Render B2P mock data with app collapsed by default and expandable runtime components.
- Show dependencies left-to-right, app/components on the left and services on the right.
- Show node name, type, and status on graph nodes.
- Show config keys on graph edges and open config detail when an edge is clicked.
- Use a single shared service node per environment, so multiple app/components link to the same Redis/MariaDB/Kafka node instead of declaring separate copies.
- Provide side panel tabs: Overview, Runtime, Configs, Dependencies, Flow, Notes.
- Provide grouped search results for Apps, Services, Hosts, Configs, and IPs.
- Provide `Start flow` action in the side panel that highlights downstream dependencies and lists flow steps grouped by component.
- Keep settings UI hard-coded in phase 1 while preserving clear defaults for later settings.

**Non-Goals:**

- Do not implement backend APIs, database models, CRUD screens, scanner, JSON/YAML import, health checks, incidents, Docker exec/logs/inspect, or SSH in phase 1.
- Do not optimize for mobile in phase 1.
- Do not build a production operations console.
- Do not replace future persistent topology management; phase 1 is a visual/mock validation step.

## Decisions

### Decision 1: Use Vue Flow for phase 1

Use Vue Flow because the needed experience is a topology/workflow canvas: zoom, pan, drag nodes, custom nodes, custom edges, edge labels, click handlers, minimap/controls, and n8n-like interaction.

Alternative considered: Cytoscape.js or AntV G6. They are stronger for graph analysis or very large topology graphs, but phase 1 benefits more from a Vue-native canvas that is fast to integrate and easy to customize.

### Decision 2: Keep phase 1 frontend-only with mock data

System Manager should first prove the visual model with B2P mock data in Local and Dev. No backend or DB changes are needed until the user approves the UI behavior.

Rationale: the user wants a clear dev-focused visual tool. Mock data lets the user validate graph density, edge labels, side panel content, search, and flow highlight before schema/API work.

### Decision 3: Model dependency as node-to-node edges with config metadata

Graph edges connect a source app/component node to a target service node. Config keys are labels/metadata on the edge, not separate nodes.

Example:

```text
B2P Web/API ───── DB_HOST ─────▶ MariaDB Dev
```

Clicking the edge opens config/dependency detail in the side panel.

If multiple config keys from the same component point to the same service, render one edge with a label such as `REDIS_HOST +3`, and list all config keys in the side panel.

### Decision 4: Support app collapsed and expanded states

Collapsed app view still shows aggregate app dependencies:

```text
B2P -- DB_HOST --> MariaDB Dev
B2P -- REDIS_HOST +3 --> Redis Dev
B2P -- SAP_URL --> SAP API Dev
```

Expanded app view shows runtime component dependencies:

```text
B2P Web/API -- DB_HOST --> MariaDB Dev
B2P Queue Worker -- KAFKA_BROKER / publish --> Kafka Dev
B2P Consumer -- KAFKA_BROKER / consume --> Kafka Dev
```

Double clicking the app node toggles expand/collapse.

### Decision 5: Keep service registry centralized in the visual model

The service registry should be centralized at the topology blueprint level. `Redis` is declared once as a service node. Environment-specific runtime/config bindings describe which host/IP/config value that same `Redis` node uses in Local, Dev, Staging, or Production.

This prevents "App A Redis" and "App B Redis" duplicates, and also prevents duplicating the entire topology per environment.

### Decision 6: Make environment filtering authoritative

The graph is filtered by the selected environment, but the topology structure is global.

When the environment changes:

- The same global app/component/service nodes and dependency flow remain conceptually the same.
- Graph node names remain global, such as `Redis`, not `Redis Local` or `Redis Dev`.
- Runtime details, host/IP/port, container/image, status, config values, and service instance binding switch to the selected environment.
- Search results and side panel data reflect the selected environment values.

### Decision 7: Side panel is the detail surface

Nodes should stay compact: name, type, status. Host/IP/container/config detail goes into the side panel.

Side panel tabs:

- Overview.
- Runtime.
- Configs.
- Dependencies.
- Flow.
- Notes.

Click node opens Overview. Click edge opens Config detail.

### Decision 8: Search jumps to graph context

Search results are grouped by Apps, Services, Hosts, Configs, and IPs. Selecting a result centers/highlights the relevant node or edge and opens the side panel. Searching `DB_HOST` should jump to the B2P-to-MariaDB edge, not merely to a node.

### Decision 9: Flow viewer highlights dependency flow

The `Start flow` action is placed in the side panel. It highlights downstream dependencies on the graph and lists flow steps grouped by component.

Example:

```text
B2P Web/API
  -> MariaDB Dev       DB_HOST
  -> Redis Dev         REDIS_HOST +3
  -> SAP API Dev       SAP_URL

B2P Queue Worker
  -> Redis Dev         REDIS_QUEUE
  -> Kafka Dev         KAFKA_BROKER / publish
```

### Decision 10: Use phase 1 visual defaults

- Layout: left-to-right.
- Host group: off by default.
- Settings UI: not implemented in phase 1; defaults are hard-coded.
- Status colors:
  - healthy: green.
  - warning: yellow.
  - down: red.
  - unknown: gray.
  - maintenance: blue.
  - disabled: light gray.
- Secret/config values: masked by default, eye button reveals actual mock value.

## Mock Data Shape

Phase 1 mock app:

- B2P.
- B2P Web/API.
- B2P Queue Worker.
- B2P Scheduler.
- B2P Consumer.

Phase 1 mock environments:

- Local.
- Dev.

Phase 1 mock services:

- MariaDB.
- Redis.
- Kafka.
- SAP API.
- Mail.
- OCR.

Mock nodes should include enough fields to populate the side panel:

- id.
- name.
- type.
- status.
- environment.
- host.
- ip.
- port.
- container name.
- image.
- notes.
- config groups.
- dependencies.

Mock edges should include:

- id.
- source.
- target.
- config keys.
- label.
- direction/role such as request, read, write, publish, consume, proxy.
- connection type.
- port.
- description.

## Risks / Trade-offs

- Graph can become visually dense -> start with one app and collapsed aggregate edges; expand for details.
- Edge labels can get long -> use compact labels such as `REDIS_HOST +3`.
- Mock data may hide persistence complexity -> keep phase 1 explicit as UI validation and plan backend/API later.
- Secrets shown in mock UI may train risky behavior -> mask by default and reveal only on user action.
- Vue Flow may be less ideal for very large graph analysis later -> reassess Cytoscape.js or AntV G6 if topology size or algorithm needs grow.

## Migration Plan

Phase 1 is additive frontend work:

1. Add Vue Flow dependency.
2. Add authenticated route/menu for `System Manager`.
3. Add mock topology data module.
4. Build desktop-first graph shell, toolbar, search, side panel, and flow interactions.
5. Validate with user before adding persistence or scanner.

Rollback strategy: remove the sidebar route and Vue Flow view. No backend/database migration exists in phase 1.

Phase 2 adds a read-only persistence foundation:

1. Add Prisma models for environments, hosts, topology nodes, configs, and dependencies.
2. Seed the same B2P Local/Dev topology into SQLite through the existing seed workflow.
3. Add authenticated backend read APIs for environments and topology.
4. Switch the System Manager frontend from hard-coded mock data to backend topology data.
5. Keep CRUD, JSON/YAML import, scanner, health checks, and incidents out of phase 2.

Phase 2 rollback strategy: disable backend route registration and point the frontend back to local mock data. Prisma model additions are additive.

Phase 3 adds manual management:

1. Add authenticated write APIs for System Manager environments, hosts, topology nodes, node config groups, dependencies, and dependency config metadata.
2. Add a System Manager management drawer so the dev can manually declare topology without leaving the graph screen.
3. Keep the graph as the source of review: after saving, reload environment/topology data from the backend and reuse existing graph, search, side panel, and flow behavior.
4. Keep shared services centralized by linking dependencies to existing service nodes instead of embedding service declarations inside app config.
5. Keep JSON/YAML import, source scanner, health checks, incidents, SSH, logs, Docker inspect/exec, and production permission workflows out of phase 3.

Phase 3 rollback strategy: remove the write routes and management drawer. Existing read API and seeded topology remain usable.

Phase 4 corrects the persistence model:

1. Split global topology blueprint from environment-specific bindings.
2. Store app/component/service nodes once globally.
3. Store dependency edges once globally.
4. Store node runtime/config/status per environment.
5. Store dependency config values and target service binding per environment.
6. Update management UI so creating a node/dependency happens once, and per-environment settings are edited separately.
7. Keep the graph environment selector, but make it switch bindings/config values rather than switch to a separate duplicated topology.

Phase 4 rollback strategy: keep the phase 3 environment-scoped tables until the new blueprint/binding read path is verified. Migrate seed data first, then switch UI/API.

Phase 5 adds settings and safe import/export:

1. Add local persistent settings for graph/debug behavior only.
2. Export System Manager data as a topology document that keeps nodes/dependencies global and stores runtime/config as environment bindings.
3. Import JSON/YAML only through preview-before-apply.
4. Apply import as non-destructive upsert; missing records are not deleted in phase 5.
5. Keep scanner, health checks, incidents, SSH, logs, and Docker actions deferred.

Phase 5 rollback strategy: hide the settings/import/export UI and disable the new import/export routes. Existing manual management and topology data remain usable.

Phase 6 improves import review:

1. Keep the same import document shape from phase 5.
2. Extend preview with item-level create/update rows grouped by entity type.
3. Show environment scope for hosts and bindings so the user can verify the selected environment impact.
4. Provide downloadable JSON/YAML templates that are valid import documents.
5. Keep apply disabled when preview has blocking errors.
6. Keep scanner deferred until detailed preview is comfortable to review.

Phase 6 rollback strategy: hide detailed preview rows and template buttons while keeping phase 5 summary preview/apply intact.

## Open Questions

- None for phase 1 UI mock.
- None for phase 2 read-only persistence foundation.
- None for phase 3 manual management.
- Phase 4 needs confirmation of exact naming in UI, but the model direction is clear: global node/dependency blueprint plus environment-specific runtime/config bindings.
- None for phase 5 settings/import/export foundation; scanner and operational integrations remain future work.
- None for phase 6 detailed preview/templates.
