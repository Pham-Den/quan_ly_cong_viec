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

Each shared service instance appears as one node per environment. App/components link to that node. This prevents "App A Redis" and "App B Redis" duplicates when both depend on the same Redis Dev service.

### Decision 6: Make environment filtering authoritative

The graph is scoped by the selected environment. In phase 1, the segmented control offers `Local | Dev`. Later phases may add Staging, Production, and custom environments.

When the environment changes, graph nodes, edges, side panel data, search results, and flow list reflect that environment.

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

## Open Questions

- None for phase 1 UI mock.
