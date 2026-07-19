# Validate Plan — pack-canonical-task-group-headings

## 1. Target

- Command: `validate plan` as part of `validate changes v1.7.20-canonical-task-group-headings`
- Effective target: base Plan + APPROVED Plan delta `v1.7.19-kpi-baseline-deadline` + candidate pack `v1.7.20-canonical-task-group-headings`
- Target files, sorted:
  - `docs/sprint-v1/changes/v1.7.19-kpi-baseline-deadline/plan-delta-v1.7.19-kpi-baseline-deadline.md`
  - `docs/sprint-v1/changes/v1.7.20-canonical-task-group-headings/change-request.md`
  - `docs/sprint-v1/changes/v1.7.20-canonical-task-group-headings/impact-matrix.md`
  - `docs/sprint-v1/changes/v1.7.20-canonical-task-group-headings/plan-delta-v1.7.20-canonical-task-group-headings.md`
  - `docs/sprint-v1/planning/implementation-plan-v1.md`
- Target fingerprint: `sha256:4aca71a4c217`
- Timestamp (UTC): `2026-07-19T12:09:25Z`
- Independent conduct: a fresh-context reviewer re-derived expectations from the files and standards; the main audit independently re-ran structural, collision, path, and semantic checks.

## 2. Structural Coverage (`DOC-3`)

| Artifact | Required coverage | Result |
|---|---|---|
| Change request | identity, rationale, scope, affected phases, open questions, checklist | Pass |
| Impact matrix | all phases, earliest/downstream phase, generated artifacts, approval rule | Pass |
| Candidate Plan delta | precedence, authoritative corrections, TG-01–TG-30 canonical adapter, synchronization and acceptance rules | Pass |
| Effective Plan | Delivery Traceability Index, full task-group matrices, lanes, dependency graph, QA overrides | Pass |

The adapter is a parser-facing projection; the complete `PLAN-2` field set remains authoritative in the effective Plan matrices. No required Plan section is removed.

## 3. Expectation Sources (`VAL-3`)

- `.prism/core/templates/implementation-plan-template.md`
- `.prism/core/phase-plan.md`
- `.prism/core/phase-quality-standards.md`
- `.prism/core/change-manager.md`
- `.prism/core/change-propagation.md`
- Base Plan, APPROVED v1.7.19 Plan delta, and all candidate pack files listed above
- `playwright.config.ts` and repository manifests for path/command feasibility

## 4. Rule Coverage (`VAL-1`)

| Rule ID | Result | Evidence |
|---|---|---|
| `DOC-1` | Pass | Review-ready numbered sections and citable corrections |
| `DOC-2` | Pass | Exactly 30 unique canonical task-group headings |
| `DOC-3` | Pass | Structural coverage recorded above |
| `LINK-1` | Pass | Concrete base, delta, pack, TG, QA, path, and command references |
| `LINK-2` | Pass | Precedence and effective-truth dependencies are explicit |
| `ORB-1` | Pass | Sprint v1 and origin artifacts are explicit |
| `ORB-2` | Pass | Pack cycle is `pack-canonical-task-group-headings` |
| `SEM-1` | Pass | No remaining contradiction, duplicated intent, terminology drift, stale assumption, cross-pack drift, or out-of-scope behavior change |
| `PLAN-1` | Pass | Delivery Traceability Index remains complete |
| `PLAN-2` | Pass | Canonical projection and authoritative fields agree; corrected ownership, User Stories, QA targets, test paths, and commands are implementable |
| `PLAN-3` | Pass | No effort/day/dependency/lane change or ownership collision introduced |
| `VAL-3` | Pass | Fresh-context reviewer graded current files independently |
| Pack collision gate | Pass | Required scoped collision command resolves the Plan-only pack and reports no collision |

## 5. Semantic Integrity (`SEM-1`)

| Area | Result | Evidence |
|---|---|---|
| Impact derivation | Pass | Independently derived Plan + Implement only; pack matrix agrees |
| Canonical inventory | Pass | 30 headings; all four parser fields occur 30 times |
| User Stories | Pass | TG mappings match effective base truth |
| Ownership | Pass | Explicit corrections reconcile TG-01 and TG-06/08/15–20/28/29 surfaces |
| QA targets | Pass | TG-24/TG-27 preserve concrete TC-076 targets and base targets |
| Command feasibility | Pass | Playwright targets are under configured `tests/e2e/**` paths |
| Scope/dependency | Pass | No functional scope, effort, day, lane, or dependency drift |
| Cross-pack collision | Pass | Both pack-scoped and whole-sprint checks resolve successfully and report no collision |

## 6. Deterministic Evidence

| Check | Result |
|---|---|
| `python3 .prism/core/tools/seal_sprint.py --sprint v1 --check-pack-structure --pack v1.7.20-canonical-task-group-headings` | PASS |
| `python3 .prism/core/tools/seal_sprint.py --sprint v1 --check-overlaps-only` | PASS — whole-sprint sweep reports no collision |
| `python3 .prism/core/tools/seal_sprint.py --sprint v1 --check-overlaps-only --pack v1.7.20-canonical-task-group-headings` | PASS — exit 0, no collision involving the selected pack |
| Canonical heading/field inventory | PASS — 30 unique headings and 30 occurrences of every parser field |
| User Story, ownership, QA target, and repository path comparison | PASS |

## 7. Findings

| Severity | Rule ID | Location | Finding | Required resolution |
|---|---|---|---|---|
| info | `PLAN-2` | Candidate adapter | All 30 canonical headings and parser projections are synchronized with effective Plan truth | None |
| info | `SEM-1` | Effective Plan | Earlier ownership, User Story, QA target, and Playwright path conflicts are resolved | None |
| info | Impact matrix | Candidate pack | Independently re-derived impact matches Plan + Implement | None |

## 8. Conclusion

- blocker: 0
- warn: 0
- info: 3
- latest conclusion: `clean`
