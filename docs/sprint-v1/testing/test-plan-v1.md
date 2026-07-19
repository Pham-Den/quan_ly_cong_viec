---
status: APPROVED
version: v1
sprint: 1
phase: test
sprint_id: sprint-v1
created: 2026-07-19
updated: 2026-07-19 18:20
approved_by: khanh-pham
---

# Test Plan — API Lab Workflow Orchestration (Sprint v1)

## 1. Test Strategy Overview

| Attribute | Value |
|---|---|
| Testing approach | AI-first, risk-based, requirement/architecture/design traceable; security and data-integrity first |
| Coverage target | New business code line >=90% and branch >=90%; all Must FR/AC/BR, API contracts, design states and NFR gates |
| Execution ownership | khanh-pham reviews/executes Local Docker Compose and CI evidence; AI authors implementation/tests during Implement |
| Release target | Internal/personal-project use only; independent security review required before external users or commercial deployment |
| External QA | N/A — no external QA or separate automation repository in sprint v1 |

> Effective upstream truth is the APPROVED base Product/Design/Architecture proposal set and APPROVED change packs [`v1.7.18-api-lab-undo-warning-viewport`](../changes/v1.7.18-api-lab-undo-warning-viewport/) and [`v1.7.19-kpi-baseline-deadline`](../changes/v1.7.19-kpi-baseline-deadline/). Phase Test owns QA intent and locks the TC-076 protocol; runnable tests, harnesses and real KPI evidence belong to the approved Plan and Implement pass.

## 2. Scope

### In Scope

| Area | Test Types | Priority |
|---|---|---|
| Host/Environment/API/Workflow/Execution/History | Functional, component intent, integration, E2E, regression | P0 |
| OIDC/session, secrets, SSRF, masking, audit | Authorized security, contract, SIT | P0 |
| Queue/lease/idempotency/retry/retention/DR | Integration, SIT, reliability, controllable-clock | P0 |
| Eight screens and eleven components | Playwright, axe, visual/manual, keyboard/screen reader | P0 |
| NFR-001–009 | Performance, accessibility, quality, policy/evidence checks | P0 |

### Out of Scope

| Area | Reason |
|---|---|
| Production/staging/UAT execution | Personal v1 uses Local Docker Compose + CI; deployment is prohibited by current Plan disposition |
| External penetration test / external QA automation | No external-user/commercial deployment; independent review is a future promotion gate |
| Mobile/tablet/touch editor | Product/Design explicitly support physical desktop screen width >=1280 only |
| Parallel/loop/schedule/webhook execution | Deferred by Product to v2 |
| Runnable test code and generated runtime datasets | Owned by Implement, not Phase Test |

## 2a. Design State Coverage

| Target | Exact state / variant families | Test Case IDs | Mode |
|---|---|---|---|
| SCREEN-001 | `workspace-empty`, `workspace-loading`, `workspace-ready`, `workspace-error`; Host-blocked; unsupported-width | TC-001–003, TC-044–045, TC-072 | automated feature + TC-072 manual |
| SCREEN-002 | `environment-empty`, `environment-loading`, `environment-ready`, `environment-error` | TC-004–006, TC-072 | automated feature + TC-072 manual |
| SCREEN-003 | `api-editor-empty`, `api-editor-loading`, `api-editor-ready`, `api-editor-error` | TC-007–009, TC-072 | automated feature + TC-072 manual |
| SCREEN-004 | `workflow-empty`, `workflow-loading`, `workflow-ready-editor`, `workflow-error`; capacity-rejected | TC-010–18, TC-033–43, TC-049–60, TC-072 | automated feature + TC-072 manual |
| SCREEN-005 | `execution-inspector-empty`, `execution-inspector-running`, `execution-inspector-success`, `execution-inspector-failed` | TC-019–24, TC-028–31, TC-072 | automated feature + TC-072 manual |
| SCREEN-006 | `impact-empty`, `impact-loading`, `impact-ready`, `impact-error` | TC-025–27, TC-036–40, TC-046–48, TC-052, TC-072 | automated feature + TC-072 manual |
| SCREEN-007 | `history-empty`, `history-loading`, `history-table`, `history-error` | TC-028–31, TC-072 | automated feature + TC-072 manual |
| SCREEN-008 | `validation-report-empty`, `validation-report-loading`, `validation-report-ready`, `validation-report-error`; stale | TC-016–18, TC-049–59, TC-072 | automated feature + TC-072 manual |
| DS-COMP-001 | shell normal/collapsed/compact/drawers/capacity/unsupported states | TC-001–003, TC-044–45, TC-060, TC-072 | automated behavior + TC-072 manual |
| DS-COMP-002 | resource variants; empty/loading/populated/mutation-error | TC-003, TC-025–26, TC-046–48, TC-072 | automated behavior + TC-072 manual |
| DS-COMP-003 | split-pane variants; empty/loading/populated/error | TC-007–009, TC-072 | automated behavior + TC-072 manual |
| DS-COMP-004 | selector variants; default/expanded/loading/error/disabled | TC-002, TC-004–006, TC-072 | automated behavior + TC-072 manual |
| DS-COMP-005 | Workflow/Step lifecycle and edit-conflict states | TC-010–24, TC-033–43, TC-049–60, TC-072 | automated behavior + TC-072 manual |
| DS-COMP-006 | variable namespaces/search/no-data; empty/loading/populated/source-error | TC-013–15, TC-035, TC-072 | automated behavior + TC-072 manual |
| DS-COMP-007 | standalone/workflow lifecycle; compact/full | TC-019–24, TC-028–31, TC-072 | automated behavior + TC-072 manual |
| DS-COMP-008 | impact/recovery/checklist variants and scan/validation errors | TC-025–27, TC-036–40, TC-046–59, TC-072 | automated behavior + TC-072 manual |
| DS-COMP-009 | masked/visible/config variants and path-error | TC-006–009, TC-019, TC-028, TC-032, TC-068, TC-072 | automated behavior + TC-072 manual |
| DS-COMP-010 | validation empty/loading/passed/warning/error/stale/load-error | TC-016–18, TC-049–59, TC-072 | automated behavior + TC-072 manual |
| DS-COMP-011 | Workflow Variable empty/loading/ready/error and row default/focus/invalid/dirty | TC-004–006, TC-017, TC-033, TC-051, TC-058, TC-072 | automated behavior + TC-072 manual |
## 2b. Coverage Traceability Index

| FR / NFR | US | Design / API Refs | Project / Boundary Refs | TC IDs | Manual / Auto Mix | Coverage Status / Gap |
|---|---|---|---|---|---|---|
| FR-001 | US-001, US-009 | SCREEN-001/006; API-001/021/022 | PR-002/003/007 | TC-001–003, TC-027, TC-037, TC-044–045, TC-065, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| FR-002 | US-002 | SCREEN-002; API-001/002/023 | PR-002/003 | TC-004–006, TC-032, TC-062, TC-068, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| FR-003 | US-001, US-009 | SCREEN-001/006; API-003–006 | PR-003/007 | TC-003, TC-025–026, TC-046–048, TC-052, TC-071, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| FR-004 | US-003 | SCREEN-003; API-007 | PR-003 | TC-007–009, TC-041, TC-061, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| FR-005 | US-003 | SCREEN-003/005; API-012/014 | PR-003/005/007 | TC-006–009, TC-041, TC-062, TC-068, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| FR-006 | US-004/005 | SCREEN-004; API-008/009 | PR-004/007 | TC-010–015, TC-034/035/038, TC-060, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| FR-007 | US-006 | SCREEN-004/008; API-010/011/013 | PR-004/005/007 | TC-016–018, TC-033/042, TC-049–056, TC-061, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| FR-008 | US-007 | SCREEN-004/005; API-013/014 | PR-005/007 | TC-019–021, TC-031/043, TC-060/063/067, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| FR-009 | US-008 | SCREEN-004/005; API-013/014 | PR-005/006 | TC-008, TC-022–024, TC-062/063/068, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| FR-010 | US-007/010 | SCREEN-005/007; API-014–016 | PR-005/007 | TC-028–031, TC-063/071, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| FR-011 | US-009 | SCREEN-001/006/008; API-004–007/011/021/022 | PR-002–005/007 | TC-025–027, TC-036–040, TC-046–059, TC-060/071, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| FR-012 | US-003/007/010 | SCREEN-002/003/005/007; API-002/007/014/015 | PR-002/003/005/007 | TC-006/007/009/019/028, TC-064/068, TC-072, TC-075 | automated + TC-072 manual where UI | covered |
| NFR-001 | cross-cutting | Architecture NFR-001; related API/Design refs in case | PR-001–008 | TC-066 | automated | covered |
| NFR-002 | cross-cutting | Architecture NFR-002; related API/Design refs in case | PR-001–008 | TC-062, TC-067 | automated | partial — deterministic monthly-SLI, dependency and API-recovery evidence is executable locally; live observation-window and HPA-runtime evidence are accepted gaps under PLAN-DEP-001, owned by khanh-pham, and block any non-local/external/commercial promotion until a deployable platform exists |
| NFR-003 | cross-cutting | Architecture NFR-003; related API/Design refs in case | PR-001–008 | TC-060, TC-063, TC-067 | automated | partial — capacity, lease, idempotency and worker-process behavior are executable locally; TG-21 validates only the non-deployable HPA policy schema, while real HPA scaling remains an accepted PLAN-DEP-001 gap that must close before non-local deployment |
| NFR-004 | cross-cutting | Architecture NFR-004; related API/Design refs in case | PR-001–008 | TC-062, TC-065, TC-068 | automated | covered |
| NFR-005 | cross-cutting | Architecture NFR-005; related API/Design refs in case | PR-001–008 | TC-069 | automated | covered |
| NFR-006 | cross-cutting | Architecture NFR-006; related API/Design refs in case | PR-001–008 | TC-064, TC-070 | automated | covered |
| NFR-007 | cross-cutting | Architecture NFR-007; related API/Design refs in case | PR-001–008 | TC-030, TC-048, TC-071 | automated | covered |
| NFR-008 | cross-cutting | Architecture NFR-008; related API/Design refs in case | PR-001–008 | TC-044–045, TC-072–073 | automated + manual | covered |
| NFR-009 | cross-cutting | Architecture NFR-009; related API/Design refs in case | PR-001–008 | TC-074 | automated | covered |
| Product KPI / RISK-OPEN-001 | cross-cutting | PRD §3.1/§10b; workflow telemetry; change pack `v1.7.19-kpi-baseline-deadline` | PR-004/005/007 | TC-076 | manual baseline + automated telemetry analysis | Test approval locks the protocol; real evidence is mandatory before `approve implement`, never inferred or fabricated |

## 2c. Branch Discovery Summary

| Feature / Flow | Branches Discovered | Contradictions | Resolution / Assumption | TC Areas |
|---|---|---|---|---|
| API deletion | impact → delete → undoable → restored/expired/failed; workflows stay DISABLED | none | server-authoritative 10-second clock and same identity | TC-025/026/046–048/052/071 |
| Validation | Đạt; three advisory Cảnh báo classes; all invalid classes Lỗi; Run/Enable continue/back | none | warning acknowledgement binds saved revision/current environment | TC-016–018/033/042/049–059 |
| Execution | admission/stale report/capacity/idempotency; sequential success/failure/retry; lease recovery | none | MySQL durable queue accepted architecture exception | TC-019–024/060/063/067 |
| Security routing | active/expired/revoked/uncertain identity; signed/stale/invalid manifest; DNS/redirect/key failures | none | fail closed before mutation/credential send | TC-062/065/068 |
| History/retention | latest rerun; 30-day exact boundary; payload truncation; deleted Host evidence | none | controllable clock and isolated dataset | TC-028–030/071/075 |
| Product KPI baseline | manual three-API AS-IS task → observed elapsed/copy-paste baseline → equivalent Workflow task → telemetry/observation comparison | baseline values do not yet exist and must not be fabricated | TC-076 locks cohort/task/evidence/formula; missing or zero baseline blocks KPI conclusion | TC-076 |

## 2d. Accepted-Exception And KPI Closure Matrix

| Source obligation | Required evidence locked by Test | TC IDs | Approval / release gate |
|---|---|---|---|
| `EXC-AUTH-001` | callback state binding/replay rejection, PKCE verifier/challenge, required MFA assurance, CSRF, immediate revocation, >15-minute idle expiry, fail-closed IAM and browser-storage token scan | TC-065, TC-068 | Every branch has executable intent before Test approval; all evidence must pass before release |
| `EXC-STACK-001` | OpenAPI/error compatibility, PR-008 forbidden-import boundary, Node >=20.20 plus supported Fastify 5/Vue 3 major/EOL status, dependency audit and no production source map | TC-061, TC-073 | Missing support metadata or an EOL/unsupported runtime fails the gate; no new standalone service/UI is authorized |
| `EXC-QUEUE-001` | third recovery exhaustion to `DEAD`, immediate alert, terminal Execution, atomic capacity-slot release, inspect evidence, authorized recovery and unauthorized rejection | TC-063 | Any missing transition, leaked slot or authorization bypass blocks release |
| `EXC-RETRY-001` | provider attempts=`1+retryCount` for 0–5, saved fixed delay, full retryable allowlist, current-Step isolation; non-provider at-most-three exponential full-jitter behavior | TC-022–024, TC-062 | Exact count/class/delay evidence is mandatory; standalone remains one attempt |
| `RISK-OPEN-001` | The TC-076 Protocol Contract revision `tc076-v1` freezes the exact provider-stub APIs, fixtures, allowed actions, device capture, reset and exclusion rules; TG-24/TG-27/TG-30 produce one shared versioned evidence set | TC-076 | `approve test` locks protocol `tc076-v1` only. `approve implement` independently selects the greatest attempt sequence, requires selector/hash agreement and accepts only `PASSED`; all other states or selection defects block it |

### 2e. TC-076 Resolution Record Contract

| Producer | Artifact | Required result | Consumer |
|---|---|---|---|
| TG-24 | `docs/evidence/kpi/TC-076/sets/{evidence_set_id}/observation.json` | `tc076-v1`, monotonic sequence/set ID, protocol source/hash, exact fixture/device, observations/counts, IDs, `VALID|EXCLUDED`, exclusion enum/note | TG-27/TG-30 |
| TG-27 | `docs/evidence/observability/TC-076/sets/{evidence_set_id}/telemetry-correlation.json` | Observation hash plus canonical ENT-007/011 IDs/status/timestamps and NFR-006 correlation, without sensitive payload | TG-30 |
| TG-30 | `docs/evidence/release/TC-076/sets/{evidence_set_id}/decision.json` | Immutable decision with input hashes, values/formula and `PASSED|FAILED|KPI_INCONCLUSIVE` | selector + gate |
| TG-30 | `docs/evidence/release/TC-076/current.json` | Atomic selector containing current protocol, greatest sequence/set, paths/hashes, state and evaluated_at | `approve implement` verifies against an independent root scan |

`evidence_set_id=tc076-v1-a{attempt_sequence:04d}`; sequence is allocated once at attempt start, never reused and attempts never overlap. The greatest numeric sequence found across all three evidence roots supersedes every older decision regardless of state. Selector mismatch, duplicate/malformed sequence, unknown protocol, orphan/hash mismatch produces a blocking condition; newest observation without decision is `PENDING`. Only excluded/incomplete attempts may use the next sequence. A valid `PASSED` or `FAILED` is terminal for `tc076-v1`; an unauthorized later attempt is `KPI_INCONCLUSIVE` until a governed protocol revision exists.

The protocol digest is calculated from the unique marker-delimited subsection inside anchored TC-076: raw repository bytes after the BEGIN-marker LF through the LF immediately before the END marker, excluding marker lines. The slice must be valid UTF-8, LF-only, CR-free and end in exactly one LF. TG-24, TG-27 and TG-30 independently reproduce the lowercase SHA-256; any marker, encoding, newline or digest mismatch is `KPI_INCONCLUSIVE`.

Evidence execution order is authoritative: TG-24 starts after TG-22 and publishes the observation; TG-27 starts only after both TG-23 and TG-24, verifies that observation and publishes correlation; TG-30 starts after TG-24/TG-27 and every other declared quality prerequisite. Schedule order alone never substitutes for these dependency edges.

## 3. Test Types & Tools

| Test Type | Purpose | Tool from approved Architecture/context | Run Frequency | Owner |
|---|---|---|---|---|
| Unit | Dev-owned domain/application delta | Node test / Vitest | Every implementation change | AI implements; khanh-pham reviews |
| Component | Vue behavior and state intent | Vitest + Vue Test Utils | PR/CI | AI implements; khanh-pham reviews |
| Integration | Fastify/Prisma/domain boundaries | Fastify inject + Prisma integration | PR/CI | AI implements; khanh-pham reviews |
| E2E | Full browser journeys | Playwright | CI + release candidate | khanh-pham |
| API Contract | OpenAPI/error schemas | JSON Schema/OpenAPI checks | PR/CI | AI implements; khanh-pham reviews |
| Performance | NFR load/resource evidence | Architecture-approved harness delivered by Plan TG-25; OTel metrics | pre-release CI | khanh-pham |
| Security | Safe abuse cases/contracts | Fastify inject, provider/IAM fakes, Playwright scans | CI + promotion review | khanh-pham |
| Accessibility | WCAG 2.2 AA | Playwright + axe; keyboard/screen reader manual | CI + release review | khanh-pham |
| Manual / Exploratory | Visual/copy/screen-reader and high-risk recovery | Manual evidence checklist | release candidate | khanh-pham |

## 4. Test Environment

| Environment | Purpose | Data | Access |
|---|---|---|---|
| Local Docker Compose | Feature, SIT, manual and exploratory | Deterministic synthetic seeds; isolated DB | khanh-pham |
| CI | Automated component/integration/E2E/contract/security/perf | Ephemeral schema, factories, fakes | protected pipeline |
| Staging/UAT/Production | N/A in v1 | No data provisioned | prohibited by Plan disposition |

### Test Data Strategy

- Golden dataset: active/inactive Hosts; DEV/UAT/PROD bindings; three APIs; valid/error/warning workflows; executions and tombstones at clock boundaries.
- Mutation: BVA at 0/1/5 retry, 19/20/21 workflows, 9.999/10/10.001 seconds, 30-day retention and 200 KiB; EP/DT rows follow the proposal matrix.
- PII/sensitive rule: synthetic markers only; no real PII or credential values; markers must be absent from DB projections, DOM and telemetry evidence.
- Isolation: ephemeral schema per suite/case namespace; provider/IAM/key/clock fakes reset between cases.
- Teardown: seed/reset hook removes created resources, executions, jobs and tombstones; rollback assertions apply on rejected branches.
- Performance data: only shape/volume is specified here (1M history rows; 20×20 workflow workload); generator is Implement TG-25.
- No runtime dataset or secret is created in Phase Test.
- KPI study data: the TC-076 Protocol Contract in `test-cases-v1.md` defines the exact `tc076-v1` provider-stub sequence, fixture IDs/outputs, allowed AS-IS/Workflow actions, same-device capture, warm-up/reset and exhaustive exclusion enum. Record raw start/end timestamps, copy/paste counts, workflow/execution IDs, attempt status/reason and protocol source hash; never store clipboard content, credentials or request/response payloads in evidence. Baseline/result numbers remain execution evidence, not authored into this plan.

## 4a. External QA Handoff Summary

| Handoff Need | Detail | Source / Owner | Status |
|---|---|---|---|
| External QA | No external QA/separate repository in sprint v1 | user decision / khanh-pham | N/A |
| Stable selectors | Design stable hooks and semantic labels are implementation obligations | Design DS-COMP-001–011 / TG-15–20 | required for repo E2E |
| API contracts | API-001–023 and typed errors | Architecture / TG-01/23 | required for repo tests |
| Seed/reset hooks | Deterministic Compose seed/reset | Plan TG-22/23 | required before execution |
| Test accounts | Synthetic roles only; secret references stay outside docs | TG-02/26 | required |
| Evidence | CI reports, screenshots for each state, API/OTel/audit artifacts | TG-25–30 | required |

## 5. Entry Criteria

- [x] Product, Design and Architecture are APPROVED; effective truth includes approved change pack.
- [x] 59 AC, BR-001–012, API-001–023, NFR-001–009 and Design states are mapped.
- [x] Manual/automated boundaries, environments, data and reset needs are defined.
- [x] Architecture frameworks are consumed without adding a new framework.
- [x] External QA is explicitly N/A.
- [x] `RISK-OPEN-001` has an execution-ready versioned TC-076 Protocol Contract (`tc076-v1`); no baseline value or KPI pass is claimed before real observation evidence exists.
- [x] `EXC-AUTH-001`, `EXC-STACK-001`, `EXC-QUEUE-001` and `EXC-RETRY-001` are inherited verbatim in §2d and mapped to executable cases.

## 6. Exit Criteria

- [ ] TC-001–TC-076 implemented at their intended level and all P0 cases pass.
- [ ] New business code line coverage >=90% and branch coverage >=90%.
- [ ] Every API-001–023 has happy plus error contract/integration evidence; no undocumented error code.
- [ ] 0 Critical/High open defect; Medium/Low requires owner, due date and accepted risk.
- [ ] Executable local NFR latency/capacity/availability/DR/observability/retention/quality/cost gates pass exactly as TC-066–074; the explicitly accepted NFR-002/003 live-observation/HPA-runtime gaps remain release-blocking for any non-local/external/commercial deployment.
- [ ] Security TC-065/068 pass with zero raw-secret finding; independent review remains required before external/commercial use.
- [ ] TC-072 has zero critical axe violation, WCAG 2.2 AA manual evidence and no visual discrepancy >=5% or material layout shift.
- [ ] Full regression and exploratory P0 journey TC-075 pass; evidence manifest is linked by Plan TG-30.
- [ ] Before `approve implement`, the greatest `tc076-v1` sequence across all evidence roots equals atomic `current.json`, its three paths/hashes match, and its decision is `PASSED`: canonical ENT-007→ENT-011 elapsed time is <=600.000 seconds and reduction is >=80%. `PENDING`, `FAILED`, `KPI_INCONCLUSIVE`, selector/order/orphan/hash defect, missing/zero baseline or protocol/identity/correlation mismatch blocks approval.
- [ ] All §2d exception evidence passes; accepted Architecture exceptions are not treated as waivers.

## 7. Regression Strategy

| Trigger | Scope | Estimate | Owner |
|---|---|---|---|
| PR/change | affected AC cases + API contract + impacted derived obligation | <=45 min automated | AI implements; khanh-pham reviews |
| Shared schema/port migration | TC-060–065 plus affected functional cases | 1–2 h | khanh-pham |
| UI change | affected screen states + TC-072 Chromium/Firefox at 1279/1280/1440, 100/200% | 1–2 h | khanh-pham |
| Release candidate | TC-001–076; TC-072/076 manual; TC-075 exploratory | 4–8 h plus observed KPI task | khanh-pham |
| Security/retry/queue exception change | TC-062–070 plus exact affected functional cases | 2–3 h | khanh-pham |

## 8. Risk-Based Test Priority

| Risk Area | Likelihood | Impact | Priority | Depth |
|---|---|---|---|---|
| Secret leakage/SSRF/session bypass | Medium | Critical | P0 | all fail-closed layers, direct bypass and marker scans |
| Atomic admission/idempotency/lease recovery | Medium | Critical | P0 | race/crash/replay/rollback |
| Dependency deletion/Undo/re-enable | Medium | High | P0 | decision/state/boundary/failure |
| Validation severity and acknowledgement | Medium | High | P0 | every DT row and continue/back |
| Snapshot/version/mapping/retry | Medium | High | P0 | concurrent edit and current-step-only evidence |
| Accessibility/physical viewport | Medium | High | P0 | all states, browsers, widths and zooms |
| Performance/retention/DR/FinOps policies | Low–Medium | High | P0 | numeric boundaries and evidence contracts |
| Unmeasured Product KPI baseline | High until observed | High | P0 | identical-task AS-IS/Workflow observation, immutable raw evidence and formula refutation through TC-076 |

## 9. Defect Management

| Severity | Definition | Response | Release rule |
|---|---|---|---|
| Critical | data loss, auth/secret bypass, core execution corruption | immediate | blocks |
| High | Must flow broken, no safe workaround | same workday | blocks |
| Medium | impaired with safe workaround | within sprint | explicit owner/acceptance |
| Low | cosmetic/content-only | backlog | non-blocking if no accessibility impact |

Every defect records one category, reproducible steps, expected/actual, environment, evidence and linked TC/FR/NFR.

## 10. Test Reporting

| Report | Frequency | Audience | Contents |
|---|---|---|---|
| Planning review | Test approval | owner | coverage, risks, intended automation/manual boundary |
| Implementation checkpoint | per Plan TG | owner | repo delta and cases implemented |
| CI evidence | each PR/release candidate | owner | results, coverage, contracts, security, accessibility |
| Manual evidence | release candidate | owner | screenshots, visual diff, keyboard/screen reader, exploratory notes |
| Generated TSV | after Test artifact change | owner/QC import | deterministic functional/SIT views |

## Self-Review Checklist

- [x] DOC-1/2/3, LINK-1/2, ORB-1 and TEST-1–8 are covered.
- [x] Every Must FR and prioritized NFR maps to concrete TC IDs.
- [x] Every Design state family maps to automated and/or manual observation.
- [x] Tools match approved Architecture; no framework is invented.
- [x] Branch inventory, data, external-QA N/A, regression and numeric exits are explicit.
- [x] Test artifacts do not own runnable tests, runtime datasets or secrets.
- [x] The four accepted Architecture exceptions are covered without reopening or widening their decisions.
- [x] Product KPI measurement is execution-ready and explicitly prohibits fabricated baseline/results.
