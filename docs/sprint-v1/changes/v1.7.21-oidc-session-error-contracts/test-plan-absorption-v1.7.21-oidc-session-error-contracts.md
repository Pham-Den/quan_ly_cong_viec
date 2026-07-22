---
status: DRAFT
version: v1
sprint: 1
phase: test
sprint_id: sprint-v1
change_pack: v1.7.21-oidc-session-error-contracts
base_artifact: docs/sprint-v1/testing/test-plan-v1.md
created: 2026-07-20
updated: 2026-07-20 16:20
approved_by:
---

# Test Plan Absorption — v1.7.21-oidc-session-error-contracts

This sprint-scoped process artifact extends the approved Test Plan for the selected candidate pack only. It does not merge into Living Truth and does not replace unrelated approved Test Plan content.

## 1. Test Plan §2a Design State Coverage Addendum

| Component | Required states / variants | TC IDs | Automation boundary |
|---|---|---|---|
| SCREEN-009 + DS-COMP-012 CallbackAuthenticationRecovery | public root-auth-shell Login/Callback-processing/Recovery/Invalid states with no protected content; pre-claim Waiting/Ready/Exhausted; exhausted clear-to-login performs zero network request and clears callback/retry/error state; post-claim Waiting/Ready/Navigation-error; malformed-contract fail-closed state; MSG-046/047/048; `Retry-After-1/0`; focus/live-region; exactly one same-callback retry or one fresh API-017 per permitted explicit activation with zero unsafe callback resubmission | TC-065, TC-072 | executable contract + Playwright screenshot/focus evidence |

## 2. Test Plan §2b Coverage Traceability Index Override

| FR / NFR | US | Design / API Refs | Project / Boundary Refs | TC IDs | Manual / Auto Mix | Coverage Status / Gap |
|---|---|---|---|---|---|---|
| NFR-010 | cross-cutting | Architecture NFR-010; API-017–020/024; FLOW-004; ENT-022/023; ADR-006 public pre-session POST contract | PR-001/008 | TC-065, TC-070 | automated | covered — exact login/status budgets, zero status cache/retry, key-reference-only configuration, callback recovery, API-017/018 JSON-body/no-store/no-cache/no-prefetch controls and API-024 generator/runtime routing |

## 3. Test Plan §2c Branch Discovery Addendum

| Derived category | Candidate branches | Failure boundary | TC IDs |
|---|---|---|---|
| AuthZ boundary | active/inactive/unknown session; 401 versus 503; API-019/020 no 404 | stop before protected handler/read/write | TC-065 |
| Dependency failure | callback store failure before versus after claim; IAM/key/store distinction | pre-claim rollback permits callback retry; post-claim requires fresh login | TC-065, TC-070 |
| Configured parameter | exact state TTL, idle timeout, activity-write interval, login timeout/retry, status timeout/cache and two distinct key-reference IDs | missing/non-canonical startup config fails before listen/dependency access; request budgets fail closed | TC-065 |
| Contract compatibility | retry detail integer 1..86400; body/header equality; endpoint inheritance; pre-release aliases rejected | generator/check/runtime refuses drift | TC-070 |

## 4. Test Plan Gate Absorption

- Base Test Plan §2 summary row `Eight screens and eleven components` is replaced by `Nine screens and twelve components`; its NFR range is replaced from `NFR-001–009` to `NFR-001–010`.
- Base Test Plan §8 API-contract row, §10 traceability checklist and §10 exit gate replace every aggregate range `API-001–023` with `API-001–024`. These are exact candidate overrides, not additive notes; the old counts/ranges are stale when this pack is selected.
- Entry inventory becomes `API-001–024`, `NFR-001–010`, `FLOW-001–004`, `ENT-001–023`, `SCREEN-001–009`; Design coverage adds SCREEN-009 and all seven DS-COMP-012 valid and malformed-contract recovery states.
- Security/Observability regression set is `TC-062, TC-064, TC-065, TC-068, TC-070`; it includes claim rollback/race, callback restart-login, exact config and generated/runtime error routing.
- Exit requires TC-065/070 to prove the exact contracts above with zero secret/key-material finding. Independent security review remains required before external/public/commercial deployment.
- External QA remains N/A for Sprint v1; execution owner remains `khanh-pham`.

## 5. Preview Export Exception

While this pack is DRAFT, candidate-effective exports live under the pack `generated/` folder and use `vX` to prevent collision with approved canonical `testing/generated/*-v1` artifacts. The reproducible source command is `python3 .prism/core/tools/effective_truth.py --phase testing --project-root . --preview --include-draft docs/sprint-v1/changes/v1.7.21-oidc-session-error-contracts/testing-delta-v1.7.21-oidc-session-error-contracts.md`; the pack persists that exact selected-draft output as a noncanonical validation snapshot, then `export_test_cases.py` generates and checks the TSV/manifest from it. The tool-owned preview banner's generic “never written to disk” phrase means the interactive composer does not mutate Living Truth; for this explicitly documented evidence path, the output is intentionally captured under the pack and remains neither sealed nor canonical. Approval/seal regeneration alone emits canonical `v1` names from approved truth.
