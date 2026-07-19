---
status: APPROVED
base_sprint: v1
change_pack: v1.7.20-canonical-task-group-headings
source_phase: plan
impacted_phases: [plan, implement]
created: 2026-07-19 18:35
updated: 2026-07-19 19:16
approved_by: khanh-pham
approved_at: 2026-07-19T12:16:17Z
---

# Change Request — v1.7.20-canonical-task-group-headings

## 1. Summary

Add one canonical `### Task Group NN` validation-adapter section for every TG-01–TG-30. Each section exposes the concrete fields consumed by `validate_implementation.py`: User Stories, code ownership zones, repo test delta files and validation commands. The validation-feedback revision also records the minimum authoritative field corrections required to keep that adapter executable and semantically equal to delivery truth.

## 2. Why This Change Exists

The APPROVED Plan expresses its complete task-group contract through normalized matrices. The deterministic implementation validator currently resolves task groups only from `### Task Group <id>` sections, so it reports `task group 'TG-01' not found` before evaluating otherwise valid implementation evidence. This pack supplies the missing parse surface without changing delivery intent.

## 3. Earliest Affected Phase

Plan — document structure and machine-readable implementation handoff only.

## 4. Current Downstream Phase

- Plan: `APPROVED` — add a Plan delta containing the canonical adapter sections.
- Test: `APPROVED` — not impacted because no QA intent, scenario or expected result changes.
- Implement: active on TG-01 — consume the adapter and re-run deterministic spec/quality validation against the effective Plan candidate.

## 5. Scope Notes

- Existing Plan matrices remain authoritative except for the explicit corrections in Plan delta §2: TG-01 ownership/QA refs, TG-04–06 User Stories, target-owning test zones, TC-076 concrete targets and Playwright-discoverable paths.
- Adapter sections repeat validator-facing fields and concrete repo test paths. They must stay semantically equal to the effective base Plan plus APPROVED `v1.7.19-kpi-baseline-deadline` overrides and the explicit corrections in this pack.
- Implement absorption adds pack-cycle trace metadata and replaces the fixed-corpus pseudo-PBT with a seeded/capped `fast-check` round-trip property. `fast-check` becomes a direct backend dev dependency; runtime behavior is unchanged.
- No Product, Design, Architecture, Test-case intent, runtime behavior, coverage threshold, task dependency, effort or deadline changes.
- This project change does not modify PRISM framework source or `validate_implementation.py`.

## 6. Open Questions

None. The owner selected all 30 TGs and additive adapter sections while retaining the matrix model.

## Self-Review Checklist

- [x] Quality Contract refs satisfied: `DOC-1`, `DOC-2`, `DOC-3`, `LINK-1`, `LINK-2`, `ORB-1`, `ORB-2`
- [x] Base sprint, pack id, source/impacted phases and earliest affected phase are explicit
- [x] The validator failure, non-semantic scope and effective-Plan dependency are traceable
- [x] No framework edit or implementation evidence is fabricated; repo-test quality changes are rerun locally
