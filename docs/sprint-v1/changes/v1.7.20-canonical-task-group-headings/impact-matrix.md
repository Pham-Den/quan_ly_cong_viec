# Impact Matrix — v1.7.20-canonical-task-group-headings

## 1. Overview

- Source phase: Plan
- Earliest affected phase: Plan
- Current downstream phase(s): Implement active on TG-01; Test APPROVED

## 2. Phase Impact

| Phase | Status in current sprint | Impacted? | Action now | Stop / continue |
|---|---|---|---|---|
| Product | APPROVED | no — no requirement, risk or KPI change | none | continue |
| Design | APPROVED | no — no visible state, copy or interaction change | none | continue |
| Architecture | APPROVED | no — no component, API, data or NFR contract change | none | continue |
| Plan | APPROVED | yes — implementation handoff lacks canonical parser sections | absorption note: `plan-delta-v1.7.20-canonical-task-group-headings.md` | continue |
| Test | APPROVED | no — QA cases and expected results are unchanged | none | continue |
| Implement | active | yes — validator handoff, pack trace and property-test evidence require correction | update TG-01 trace/property evidence and re-run against the effective Plan adapter | stop after re-validation |

## 3. Generated Artifacts

- [Change request](./change-request.md)
- [Plan delta](./plan-delta-v1.7.20-canonical-task-group-headings.md)
- Implement absorption updates traceability metadata in `docs/sprint-v1/implementation/tg-01-shared-contracts.md` and TG-01 CODE-1 comments, replaces the fixed-corpus pseudo-PBT with a seeded/capped property, and declares `fast-check` as a direct backend dev dependency. Runtime logic remains unchanged.

## 4. Current Blockers

- Pack remains DRAFT until `validate changes v1.7.20-canonical-task-group-headings` is clean and `approve changes v1.7.20-canonical-task-group-headings` succeeds.
- TG-01 implementation validation must use the candidate adapter and the pre-TG commit as its diff base; a default `HEAD` diff after the feature commit would not represent the TG change set.

## 5. Approval Rule

Approval requires clean Plan and impacted Implement pack-cycle validation, zero pack-structure/collision findings, all 30 headings parseable, and a TG-01 deterministic run that reaches VI-1–VI-5 instead of returning `task group not found`.

## Self-Review Checklist

- [x] Quality Contract refs satisfied: `DOC-1`, `DOC-2`, `DOC-3`, `LINK-1`, `LINK-2`, `ORB-1`, `ORB-2`
- [x] All six phase rows are present and only Plan/Implement are impacted
- [x] Generated artifacts and downstream re-validation target are concrete
- [x] No behavior-bearing downstream phase is falsely marked impacted
