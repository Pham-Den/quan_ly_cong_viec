---
status: APPROVED
version: v1
sprint: 1
phase: architecture
sprint_id: sprint-v1
created: 2026-07-18
updated: 2026-07-19 11:17
approved_by: khanh-pham
---

# Architecture Sprint Brief v1 — API Lab Workflow Orchestration

## 1. Objective

Define an implementation-ready architecture for the approved Product and Design packages of `API_Lab_workflow_orchestration`, preserving the existing Vue/Fastify/Prisma/MySQL stack while replacing environment-scoped Host coupling and synchronous flow execution with explicit domain boundaries, immutable workflow versions, and a persistent worker model.

## 2. Approved Inputs

| Input | Status | Path |
|---|---|---|
| Product package | APPROVED | `../product/API_Lab_workflow_orchestration_PRODUCT.md` |
| Product epic and FR/US/AC | APPROVED | `../product/proposals/epics/EP-001-api-lab-workflow-orchestration-v1.md` |
| Product change pack | APPROVED | `../changes/v1.7.18-api-lab-undo-warning-viewport/` |
| Design system proposal | APPROVED | `../design/proposals/design-system-v1.md` |

## 3. Confirmed Decisions

The table below is the durable transcription of the Architecture answer batch. `recorded_at` is when the evidence was normalized into the repository; it does not claim an external approval system timestamp.

| Decision ID | Confirmed decision | Decision maker | recorded_at | Durable answer evidence |
|---|---|---|---|---|
| ARCH-DEC-001 | Logical Host identity is independent of Environment | `khanh-pham`, project owner | 2026-07-19 | Architecture answer batch `Q1=A` |
| ARCH-DEC-002 | Use a modular monolith in the existing Node.js/TypeScript monorepo | `khanh-pham`, project owner | 2026-07-19 | Architecture answer batch `Q2=A` |
| ARCH-DEC-003 | Long-running execution uses a MySQL-backed worker queue | `khanh-pham`, project owner | 2026-07-19 | Architecture answer batch `Q3=A` |
| ARCH-DEC-004 | Authentication migrates to central OIDC/Keycloak | `khanh-pham`, project owner | 2026-07-19 | Architecture answer batch `Q4=A` |
| ARCH-DEC-005 | Credentials use AES-256-GCM envelope encryption backed by a runtime secret manager | `khanh-pham`, project owner | 2026-07-19 | Architecture answer batch `Q5=A` |
| ARCH-DEC-006 | All target API traffic goes through a Host-bound outbound gateway | `khanh-pham`, project owner | 2026-07-19 | Architecture answer batch `Q6=A` |
| ARCH-DEC-007 | Resource hierarchy is normalized; workflow definitions are immutable versions | `khanh-pham`, project owner | 2026-07-19 | Architecture answer batch `Q7=A` |
| ARCH-DEC-008 | Apply the internal production NFR baseline | `khanh-pham`, project owner | 2026-07-19 | Architecture answer batch `Q8=A` |
| ARCH-DEC-009 | Use Pino, OpenTelemetry, Sentry, Node test/Vitest/Playwright and schema contract tests | `khanh-pham`, project owner | 2026-07-19 | Architecture answer batch `Q9=A` |
| ARCH-DEC-010 | No AI/ML, IoT, webhook, Kafka or fixed partner integration is in v1; target APIs are dynamic `provider` integrations | `khanh-pham`, project owner | 2026-07-19 | Architecture answer batch `Q10=A` |
| ARCH-DEC-011 | No additional Architecture requirement was requested | `khanh-pham`, project owner | 2026-07-19 | Architecture answer batch `Q11=KHONG6`, normalized as “không” |

ADRs and NFRs cite these durable Decision IDs instead of transient option labels. `ARCH-001` separately records the scoped Permission Matrix/STRIDE approval evidence.

## 4. Deliverables

| Deliverable | Purpose |
|---|---|
| `proposals/architecture-v1.md` | C4, boundaries, traceability, topology, security |
| `proposals/project-reference-v1.md` | Code-facing module and dependency contract |
| `proposals/sequence-v1.md` | Core runtime and recovery flows |
| `proposals/erd-v1.md` | Complete logical/physical data model |
| `proposals/adr-v1.md` | Significant decisions and trade-offs |
| `proposals/data-flow-v1.md` | Developer, QA, and operator data flows |
| `proposals/api-specs-v1.md` | REST contracts and error catalog |
| `proposals/events-v1.md` | Explicit no-broker/event decision for v1 |
| `proposals/nfr-v1.md` | Measurable targets and configuration map |
| `assets/c4-model.drawio` | Editable C4 System/Container/Component source |
| `assets/api-lab-data-flow.drawio` | Editable multi-persona DFD source |

## 5. Scope Boundaries

- Architecture only; no source-code or database mutation is performed in this phase.
- Existing routes and schema are migration inputs, not the target contract.
- Product and Design semantics remain authoritative where this package does not explicitly allocate a technical mechanism.
- Architecture approval remains gated by `validate architecture`.

## 6. Architecture Risks

| Risk | Treatment |
|---|---|
| Existing `SystemHost` rows are Environment-scoped, so logical Host grouping can be ambiguous | Preview migration groups by normalized name; collisions require an explicit mapping file before production migration |
| Existing browser auth stores tokens in `localStorage` | Move to OIDC Authorization Code + PKCE and server-set Secure/HttpOnly/SameSite cookies |
| Existing flow run occurs in the HTTP handler | Persist execution + job atomically, then return `202`; worker claims with leases |
| Dynamic target URLs create SSRF/DNS-rebinding risk | Resolve only relative paths against a Host binding; enforce allowlist, DNS/IP checks and egress policy |
| No broker/cache is selected | Use MySQL row leases and polling; capacity/load tests gate production rollout |
| Product RISK-OPEN-002: deadline, team size and internal owner/SLA are not confirmed | After Architecture approval opens the gate, Plan may decompose technical work in DRAFT; Product Owner + Delivery Lead must resolve the inputs before `approve plan`, and Plan cannot claim committed dates, capacity, ownership or internal SLA beforehand |

## 7. Dependency And Next Gate

Architecture depends on approved Product and Design truth. Plan and Test may start only after Architecture is explicitly approved. Product RISK-OPEN-002 does not block DRAFT Plan decomposition after that gate opens, but it blocks `approve plan` and any committed scheduling, capacity, ownership or internal SLA until Product Owner + Delivery Lead resolve it. Implementation remains gated by an approved Plan.
