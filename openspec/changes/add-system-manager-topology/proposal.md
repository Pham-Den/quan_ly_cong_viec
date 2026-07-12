## Why

Khi làm việc với nhiều app nội bộ, người dùng cần một bản đồ trực quan để biết app nào chạy ở môi trường nào, phụ thuộc service nào, config key nào tạo ra kết nối đó, và service đó nằm ở host/IP/port nào. Hiện tại thông tin này dễ bị rải trong `.env`, `docker-compose`, ghi chú cá nhân, hoặc trí nhớ của dev.

System Manager giúp dev nhìn tổng thể topology và trace dependency flow mà không phải lục nhiều repo/config khi debug.

## What Changes

- Add a new global `System Manager` menu at `/system-manager`.
- Build a desktop-first Vue Flow topology canvas for phase 1 with frontend mock data only.
- Show app/service dependency graph with `Local | Dev` environment switch.
- Use B2P as the phase 1 mock app with Web/API, Queue Worker, Scheduler, and Consumer components.
- Show centralized service nodes such as MariaDB, Redis, Kafka, SAP API, Mail, and OCR.
- Support collapsed app view where `B2P` still shows aggregate dependencies to shared services.
- Support expanded app view where dependencies are shown from runtime components.
- Display config keys on edges, such as `DB_HOST`, `REDIS_HOST +3`, and `KAFKA_BROKER / publish`.
- Open a side panel on node/edge click with Overview, Runtime, Configs, Dependencies, Flow, and Notes tabs.
- Provide search grouped by Apps, Services, Hosts, Configs, and IPs.
- Support `Start flow` from the side panel to highlight downstream dependencies and list flow steps grouped by component.
- Keep backend API, database schema, scanner, JSON/YAML import, health checks, incidents, SSH, logs, and Docker actions out of phase 1.
- Add a later manual management phase where the user can create/update/delete environments, hosts, topology nodes, node config groups, and dependency edges from the System Manager UI.
- Keep JSON/YAML import, scanner, health checks, incidents, SSH, logs, and Docker actions out of the manual management phase.
- Correct the persistence model so topology nodes and dependency flow are global, while runtime/config/status/host/IP values are bound per environment.

## Capabilities

### New Capabilities

- `system-manager`: Global system topology dashboard for dev-focused infrastructure visibility, dependency graph, config-aware edges, side panel details, search, and dependency flow tracing.

### Modified Capabilities

- Navigation: add a `System Manager` menu item in the authenticated shell.

## Impact

- Frontend: add Vue Flow dependency, `/system-manager` route, System Manager view, mock topology data, graph nodes/edges, side panel, search, and flow highlight interactions.
- Backend: no backend API changes in phase 1.
- Database: no Prisma schema changes in phase 1.
- Phase 2: add read-only backend persistence and seed APIs.
- Phase 3: add authenticated manual CRUD APIs and a management drawer inside System Manager.
- Phase 4: replace environment-duplicated topology behavior with global topology blueprint plus per-environment bindings.
- Phase 5: add local UI settings plus safe JSON/YAML import/export with preview before apply.
- Phase 6: make import preview item-level and add JSON/YAML topology templates before scanner work.
- Security: phase 1 uses mock data. Later phases may allow secrets; phase 1 should show masked values with an eye reveal behavior in UI.
- Testing: add frontend typecheck/build coverage and, if feasible, Playwright smoke coverage for opening System Manager, switching environments, searching config keys, clicking node/edge, and starting a flow.
