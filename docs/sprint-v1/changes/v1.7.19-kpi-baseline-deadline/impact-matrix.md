# Impact Matrix — v1.7.19-kpi-baseline-deadline

## 1. Overview

- Source phase: Product
- Earliest affected phase: Product
- Current downstream phases: Plan APPROVED and Test DRAFT

## 2. Phase Impact

| Phase | Status in current sprint | Impacted? | Action now | Stop / continue |
|---|---|---|---|---|
| Product | APPROVED | yes — `RISK-OPEN-001` lifecycle gate changes | delta: `product-delta-v1.7.19-kpi-baseline-deadline.md` | continue |
| Design | APPROVED | no — no visible flow, copy or instrumentation surface changes | none | continue |
| Architecture | APPROVED | no — KPI targets, events and telemetry data contract remain unchanged | none | continue |
| Plan | APPROVED | yes — evidence ownership and final quality gate change | absorption note: `plan-delta-v1.7.19-kpi-baseline-deadline.md` | continue |
| Test | DRAFT | yes — approval boundary and execution evidence deadline change | absorbed directly into `testing/test-plan-v1.md` and `testing/proposals/test-cases-v1.md` | stop after Test absorption |
| Implement | not started | no — no current artifact exists | none now; future Implement consumes effective Product/Plan/Test truth | stop |

## 3. Generated Artifacts

- [Change request](./change-request.md)
- [Product delta](./product-delta-v1.7.19-kpi-baseline-deadline.md)
- [Plan absorption note](./plan-delta-v1.7.19-kpi-baseline-deadline.md)
- Direct Test absorption: `docs/sprint-v1/testing/test-plan-v1.md` and `docs/sprint-v1/testing/proposals/test-cases-v1.md`

## 4. Current Blockers

- Pack remains DRAFT until `validate changes v1.7.19-kpi-baseline-deadline` is clean and `approve changes v1.7.19-kpi-baseline-deadline` succeeds.
- Real KPI evidence is deliberately not a pack-approval prerequisite; it is an Implement completion prerequisite and must block `approve implement` if absent, inconclusive or below target.

## 5. Approval Rule

Change approval requires clean Product, Plan and Test effective-truth validation, clean pack structure/collision checks and no regression against the existing TC-076 protocol. It does not authorize synthetic KPI values.

## Self-Review Checklist

- [x] Quality Contract refs satisfied: `DOC-1`, `DOC-2`, `DOC-3`, `LINK-1`, `LINK-2`, `ORB-1`, `ORB-2`
- [x] All six phase rows are present and propagation follows current artifact state
- [x] Every impacted phase has one concrete absorption action
- [x] Future evidence gate is distinguished from change-pack approval

