---
status: APPROVED
version: v1
sprint: 1
phase: plan
sprint_id: sprint-v1
change_pack: v1.7.20-canonical-task-group-headings
base_artifact: docs/sprint-v1/planning/implementation-plan-v1.md
created: 2026-07-19
updated: 2026-07-19 19:16
approved_by: khanh-pham
approved_at: 2026-07-19T12:16:17Z
---

# Plan Delta — v1.7.20-canonical-task-group-headings

## 1. Rationale And Precedence

The base Plan matrices and every APPROVED Plan delta remain authoritative except for the explicit field corrections in §2. The canonical sections in §3 are a machine-readable adapter for `validate_implementation.py`; they introduce no independent feature behavior, effort, day or dependency scope. On conflict, validation must fail and the adapter must be refreshed from effective Plan truth rather than silently overriding it.

Each concrete test path refines the matching effective `repo_test_delta_target` into files the task group must add. Additional in-scope tests remain allowed. Shared validation commands are intentionally limited to commands supported by repository manifests and the existing Playwright `tests/e2e` discovery root.

## 2. Effective Authoritative Field Corrections

These corrections close contradictions exposed by the first pack validation. They do not change Product/Test intent: they align Plan ownership with its already-declared deliverables, restore the base User Story mappings, preserve APPROVED TC-076 obligations and correct the stale TG-01 QA allocation.

| TG | Corrected field | Effective value / addition | Reason |
|---|---|---|---|
| TG-01 | `code_ownership_zones` | add `backend/src/modules/execution/application/response-schema-reader.ts`, `backend/package.json`, `package-lock.json` | Matrix A already assigns the response-schema contract; direct `fast-check` dev dependency is required for the gated property test |
| TG-01 | `qa_test_refs` | `TC-061, TC-067` | TC-061 covers public module boundaries; TC-067 owns the exact 24-hour/65,536-byte idempotency bounds implemented by TG-01. This replaces the stale v1.7.19 TG-01 row only |
| TG-04 | `User Stories` | `US-002, US-009` | exact base Matrix A mapping |
| TG-05 | `User Stories` | `US-001, US-003` | exact base Matrix A mapping |
| TG-06 | `User Stories` | `US-004, US-005` | exact base Matrix A mapping |
| TG-06 | `code_ownership_zones` | add `backend/src/modules/workflow-definition/workflow-persistence.integration.test.ts` | required test target must be writable by its owning TG |
| TG-08 | `code_ownership_zones` | add `backend/src/modules/workflow-definition/application/workflow-validation.contract.test.ts` | required test target must be writable by its owning TG |
| TG-15–TG-20 | `code_ownership_zones` | add each TG's exact `tests/e2e/api-lab-*.spec.ts` target declared below | required browser test target must be writable by its owning TG |
| TG-24 | `repo_test_delta_target` | require base journey file plus `tests/e2e/api-lab-workflow/kpi-baseline/tc-076-kpi-baseline.spec.ts` | preserves APPROVED v1.7.19 TC-076 runner/observation checks |
| TG-27 | `repo_test_delta_target` | require base observability file plus `tests/observability/TC-076/tc-076-telemetry-correlation.test.ts` | preserves APPROVED v1.7.19 canonical-field/correlation checks |
| TG-28 | `code_ownership_zones`, `repo_test_delta_target` | add/use `tests/e2e/accessibility/api-lab-accessibility.spec.ts` | keeps the target inside Playwright `testDir` |
| TG-29 | `code_ownership_zones`, `repo_test_delta_target` | add/use `tests/e2e/security/api-lab-browser-security.spec.ts` | keeps the target inside Playwright `testDir` |

All other authoritative Plan fields, including effort, day allocation, `blocks`, `blocked_by`, architecture obligations and delivery scope, remain unchanged.

## 3. Canonical Implementation Validator Adapter

### Task Group 01 — Shared contracts

- **User Stories**: N/A — infrastructure.
- **code_ownership_zones**:
  - `backend/src/modules/execution/application/idempotency/**`
  - `backend/src/modules/execution/application/response-schema-reader.ts`
  - `backend/src/modules/execution/index.ts`
  - `backend/src/modules/workflow-definition/index.ts`
  - `backend/src/modules/system-catalog/index.ts`
  - `backend/src/shared/unit-of-work/**`
  - `backend/package.json`
  - `package-lock.json`
- **repo_test_delta_target**:
  - Add: `backend/src/modules/execution/application/idempotency/shared-contracts.contract.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/modules/execution/application/idempotency/shared-contracts.contract.test.ts`

### Task Group 02 — Identity boundary

- **User Stories**: N/A — infrastructure enabling protected US.
- **code_ownership_zones**:
  - `backend/src/modules/identity/**`
  - `frontend/src/core/auth/**`
- **repo_test_delta_target**:
  - Add: `backend/src/modules/identity/identity.contract.test.ts`
- **validation commands to run**:
  - `npm run typecheck`
  - `node --import tsx --test backend/src/modules/identity/identity.contract.test.ts`

### Task Group 03 — Error and observability foundation

- **User Stories**: N/A — infrastructure.
- **code_ownership_zones**:
  - `backend/src/platform/audit/**`
  - `backend/src/platform/observability/**`
  - `backend/src/shared/errors/**`
  - `backend/src/app.ts`
  - `frontend/src/core/api/**`
  - `frontend/src/core/observability/**`
- **repo_test_delta_target**:
  - Add: `backend/src/shared/errors/error-observability.contract.test.ts`
- **validation commands to run**:
  - `npm run typecheck`
  - `node --import tsx --test backend/src/shared/errors/error-observability.contract.test.ts`

### Task Group 04 — System Catalog

- **User Stories**: US-002, US-009.
- **code_ownership_zones**:
  - `backend/src/modules/system-catalog/**`
  - `backend/prisma/schema.prisma`
  - `backend/prisma/migrations/*system_catalog*`
- **repo_test_delta_target**:
  - Add: `backend/src/modules/system-catalog/system-catalog.integration.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/modules/system-catalog/system-catalog.integration.test.ts`

### Task Group 05 — API Workspace persistence

- **User Stories**: US-001, US-003.
- **code_ownership_zones**:
  - `backend/src/modules/api-workspace/**`
  - `backend/prisma/schema.prisma`
  - `backend/prisma/migrations/*api_workspace*`
- **repo_test_delta_target**:
  - Add: `backend/src/modules/api-workspace/api-workspace.integration.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/modules/api-workspace/api-workspace.integration.test.ts`

### Task Group 06 — Workflow persistence and mapping

- **User Stories**: US-004, US-005.
- **code_ownership_zones**:
  - `backend/src/modules/workflow-definition/domain/**`
  - `backend/src/modules/workflow-definition/infrastructure/**`
  - `backend/src/modules/workflow-definition/application/saveWorkflow.ts`
  - `backend/src/modules/workflow-definition/application/workflowImpactService.ts`
  - `backend/prisma/schema.prisma`
  - `backend/prisma/migrations/*workflow_definition*`
  - `backend/src/modules/workflow-definition/workflow-persistence.integration.test.ts`
- **repo_test_delta_target**:
  - Add: `backend/src/modules/workflow-definition/workflow-persistence.integration.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/modules/workflow-definition/workflow-persistence.integration.test.ts`

### Task Group 07 — Atomic lifecycle and Undo

- **User Stories**: US-001, US-009.
- **code_ownership_zones**:
  - `backend/src/modules/api-workspace/application/deleteApi.ts`
  - `backend/src/modules/api-workspace/application/undoApiDeletion.ts`
  - `backend/src/modules/api-workspace/application/changeApiMethod.ts`
  - `backend/src/modules/system-catalog/application/changeHostLifecycle.ts`
  - `backend/src/modules/execution/application/idempotency/**`
- **repo_test_delta_target**:
  - Add: `backend/src/modules/execution/application/idempotency/lifecycle-atomicity.integration.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/modules/execution/application/idempotency/lifecycle-atomicity.integration.test.ts`

### Task Group 08 — Workflow validation and recovery

- **User Stories**: US-006, US-009.
- **code_ownership_zones**:
  - `backend/src/modules/workflow-definition/application/validateWorkflow.ts`
  - `backend/src/modules/workflow-definition/application/enableWorkflow.ts`
  - `backend/src/modules/workflow-definition/domain/validation/**`
  - `backend/src/modules/workflow-definition/delivery/*validation*`
  - `backend/src/modules/workflow-definition/application/workflow-validation.contract.test.ts`
- **repo_test_delta_target**:
  - Add: `backend/src/modules/workflow-definition/application/workflow-validation.contract.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/modules/workflow-definition/application/workflow-validation.contract.test.ts`

### Task Group 09 — Execution admission

- **User Stories**: US-003, US-006, US-007.
- **code_ownership_zones**:
  - `backend/src/modules/execution/application/admission/**`
  - `backend/src/modules/execution/domain/execution/**`
  - `backend/src/modules/execution/domain/capacity/**`
  - `backend/src/modules/execution/infrastructure/*Admission*`
  - `backend/prisma/schema.prisma`
  - `backend/prisma/migrations/*execution_admission*`
- **repo_test_delta_target**:
  - Add: `backend/src/modules/execution/application/admission/execution-admission.integration.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/modules/execution/application/admission/execution-admission.integration.test.ts`

### Task Group 10 — Execution query and rerun

- **User Stories**: US-006, US-007, US-010.
- **code_ownership_zones**:
  - `backend/src/modules/execution/application/query/**`
  - `backend/src/modules/execution/application/history/**`
  - `backend/src/modules/execution/application/rerun/**`
  - `backend/src/modules/execution/application/responseSchema/**`
  - `backend/src/modules/execution/delivery/*Execution*`
- **repo_test_delta_target**:
  - Add: `backend/src/modules/execution/application/query/execution-query.contract.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/modules/execution/application/query/execution-query.contract.test.ts`

### Task Group 11 — Execution runner

- **User Stories**: US-005, US-007.
- **code_ownership_zones**:
  - `backend/src/modules/execution/application/runner/**`
  - `backend/src/modules/execution/domain/step/**`
  - `backend/src/modules/execution/domain/attempt/**`
  - `backend/src/worker.ts`
- **repo_test_delta_target**:
  - Add: `backend/src/modules/execution/application/runner/execution-runner.integration.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/modules/execution/application/runner/execution-runner.integration.test.ts`

### Task Group 12 — Outbound gateway and retry

- **User Stories**: US-003, US-007, US-008.
- **code_ownership_zones**:
  - `backend/src/platform/outbound/**`
  - `backend/src/modules/execution/application/attempt/**`
  - `backend/src/modules/execution/infrastructure/*Artifact*`
- **repo_test_delta_target**:
  - Add: `backend/src/platform/outbound/provider-gateway.contract.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/platform/outbound/provider-gateway.contract.test.ts`

### Task Group 13 — Scheduler and recovery

- **User Stories**: US-009, US-010.
- **code_ownership_zones**:
  - `backend/src/platform/scheduler/**`
  - `backend/src/modules/execution/infrastructure/ExecutionRetentionRepository.ts`
  - `backend/src/modules/execution/infrastructure/JobLeaseRepository.ts`
  - `deploy/cronjobs/**`
- **repo_test_delta_target**:
  - Add: `backend/src/platform/scheduler/execution-recovery.integration.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/platform/scheduler/execution-recovery.integration.test.ts`

### Task Group 14 — Backup and audit retention

- **User Stories**: N/A — platform obligation.
- **code_ownership_zones**:
  - `deploy/mysql/backup/**`
  - `deploy/mysql/restore/**`
  - `deploy/mysql/binlog/**`
  - `backend/src/platform/audit/retention/**`
  - `docs/runbooks/backup-restore.md`
  - `docs/runbooks/audit-retention.md`
- **repo_test_delta_target**:
  - Add: `backend/src/platform/audit/retention/audit-retention.integration.test.ts`
- **validation commands to run**:
  - `npm --workspace backend run typecheck`
  - `node --import tsx --test backend/src/platform/audit/retention/audit-retention.integration.test.ts`

### Task Group 15 — Workspace shell and Resource Tree

- **User Stories**: US-001, US-009.
- **code_ownership_zones**:
  - `frontend/src/pages/**/api-lab/**`
  - `frontend/src/features/api-lab-workspace/shell/**`
  - `frontend/src/features/api-lab-workspace/resource-tree/**`
  - `frontend/src/features/api-lab-workspace/impact/**`
  - `frontend/src/features/api-lab-workspace/undo/**`
  - `frontend/src/shared/layout/api-lab/**`
  - `tests/e2e/api-lab-workspace-shell.spec.ts`
- **repo_test_delta_target**:
  - Add: `tests/e2e/api-lab-workspace-shell.spec.ts`
- **validation commands to run**:
  - `npm --workspace frontend run typecheck`
  - `npx playwright test tests/e2e/api-lab-workspace-shell.spec.ts`

### Task Group 16 — Environment and API editor UI

- **User Stories**: US-002, US-003.
- **code_ownership_zones**:
  - `frontend/src/features/api-lab-workspace/environment/**`
  - `frontend/src/features/api-lab-workspace/api-editor/**`
  - `frontend/src/features/api-lab-workspace/api/**`
  - `frontend/src/pages/**/environments/**`
  - `tests/e2e/api-lab-environment-editor.spec.ts`
- **repo_test_delta_target**:
  - Add: `tests/e2e/api-lab-environment-editor.spec.ts`
- **validation commands to run**:
  - `npm --workspace frontend run typecheck`
  - `npx playwright test tests/e2e/api-lab-environment-editor.spec.ts`

### Task Group 17 — Workflow editor and variables

- **User Stories**: US-004, US-005.
- **code_ownership_zones**:
  - `frontend/src/features/workflow-editor/**`
  - `frontend/src/pages/**/workflows/**/index.*`
  - `tests/e2e/api-lab-workflow-editor.spec.ts`
- **repo_test_delta_target**:
  - Add: `tests/e2e/api-lab-workflow-editor.spec.ts`
- **validation commands to run**:
  - `npm --workspace frontend run typecheck`
  - `npx playwright test tests/e2e/api-lab-workflow-editor.spec.ts`

### Task Group 18 — Validation and recovery UI

- **User Stories**: US-006, US-009.
- **code_ownership_zones**:
  - `frontend/src/features/workflow-validation/**`
  - `frontend/src/features/workflow-editor/recovery/**`
  - `frontend/src/pages/**/validation/**`
  - `tests/e2e/api-lab-workflow-validation.spec.ts`
- **repo_test_delta_target**:
  - Add: `tests/e2e/api-lab-workflow-validation.spec.ts`
- **validation commands to run**:
  - `npm --workspace frontend run typecheck`
  - `npx playwright test tests/e2e/api-lab-workflow-validation.spec.ts`

### Task Group 19 — Execution Inspector UI

- **User Stories**: US-003, US-007, US-008.
- **code_ownership_zones**:
  - `frontend/src/features/execution-inspector/**`
  - `tests/e2e/api-lab-execution-inspector.spec.ts`
- **repo_test_delta_target**:
  - Add: `tests/e2e/api-lab-execution-inspector.spec.ts`
- **validation commands to run**:
  - `npm --workspace frontend run typecheck`
  - `npx playwright test tests/e2e/api-lab-execution-inspector.spec.ts`

### Task Group 20 — Execution History UI

- **User Stories**: US-007, US-010.
- **code_ownership_zones**:
  - `frontend/src/features/execution-history/**`
  - `frontend/src/pages/**/history/**`
  - `tests/e2e/api-lab-execution-history.spec.ts`
- **repo_test_delta_target**:
  - Add: `tests/e2e/api-lab-execution-history.spec.ts`
- **validation commands to run**:
  - `npm --workspace frontend run typecheck`
  - `npx playwright test tests/e2e/api-lab-execution-history.spec.ts`

### Task Group 21 — Availability and FinOps policy

- **User Stories**: N/A — platform obligation.
- **code_ownership_zones**:
  - `deploy/kubernetes/**`
  - `infra/**`
  - `scripts/validate-iac.*`
  - `docs/runbooks/availability.md`
  - `docs/runbooks/finops.md`
- **repo_test_delta_target**:
  - Add: `scripts/validate-iac.test.ts`
- **validation commands to run**:
  - `node --import tsx --test scripts/validate-iac.test.ts`

### Task Group 22 — Docker Compose runtime

- **User Stories**: N/A — integration infrastructure.
- **code_ownership_zones**:
  - `compose*.yml`
  - `deploy/docker/**`
  - `scripts/migrate.*`
  - `scripts/seed.*`
  - `scripts/reset.*`
  - `scripts/smoke.*`
  - `docs/runbooks/local-api-lab.md`
- **repo_test_delta_target**:
  - Add: `scripts/smoke.test.ts`
- **validation commands to run**:
  - `node --import tsx --test scripts/smoke.test.ts`

### Task Group 23 — Backend SIT

- **User Stories**: US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010.
- **code_ownership_zones**:
  - `tests/sit/backend/**`
  - `tests/fixtures/api-lab/**`
  - `scripts/verify-backend-sit.*`
- **repo_test_delta_target**:
  - Add: `tests/sit/backend/api-lab-workflow.sit.test.ts`
- **validation commands to run**:
  - `node --import tsx --test tests/sit/backend/api-lab-workflow.sit.test.ts`

### Task Group 24 — Browser integration and KPI observation

- **User Stories**: US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010.
- **code_ownership_zones**:
  - `tests/e2e/api-lab-workflow/**`
  - `frontend/tests/integration/**`
  - `tests/e2e/api-lab-workflow/kpi-baseline/**`
  - `docs/evidence/kpi/TC-076/**`
- **repo_test_delta_target**:
  - Add: `tests/e2e/api-lab-workflow/workspace-history.spec.ts`
  - Add: `tests/e2e/api-lab-workflow/kpi-baseline/tc-076-kpi-baseline.spec.ts`
- **validation commands to run**:
  - `npx playwright test tests/e2e/api-lab-workflow/workspace-history.spec.ts tests/e2e/api-lab-workflow/kpi-baseline/tc-076-kpi-baseline.spec.ts`

### Task Group 25 — Performance and capacity

- **User Stories**: US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010.
- **code_ownership_zones**:
  - `tests/performance/**`
  - `scripts/verify-performance.*`
  - `docs/evidence/performance/**`
- **repo_test_delta_target**:
  - Add: `tests/performance/api-lab-performance.test.ts`
- **validation commands to run**:
  - `node --import tsx --test tests/performance/api-lab-performance.test.ts`

### Task Group 26 — Security refutation

- **User Stories**: US-002, US-003, US-007, US-008, US-009, US-010.
- **code_ownership_zones**:
  - `tests/security/auth/**`
  - `tests/security/outbound/**`
  - `tests/security/execution/**`
  - `scripts/verify-security.*`
  - `docs/evidence/security/**`
- **repo_test_delta_target**:
  - Add: `tests/security/execution/api-lab-security.test.ts`
- **validation commands to run**:
  - `node --import tsx --test tests/security/execution/api-lab-security.test.ts`

### Task Group 27 — Observability and stack refutation

- **User Stories**: US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010.
- **code_ownership_zones**:
  - `tests/observability/**`
  - `scripts/verify-observability.*`
  - `scripts/verify-supported-stack.*`
  - `docs/evidence/observability/**`
  - `tests/observability/TC-076/**`
  - `docs/evidence/observability/TC-076/**`
- **repo_test_delta_target**:
  - Add: `tests/observability/api-lab-observability.test.ts`
  - Add: `tests/observability/TC-076/tc-076-telemetry-correlation.test.ts`
- **validation commands to run**:
  - `node --import tsx --test tests/observability/api-lab-observability.test.ts tests/observability/TC-076/tc-076-telemetry-correlation.test.ts`

### Task Group 28 — Accessibility and viewport

- **User Stories**: US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010.
- **code_ownership_zones**:
  - `tests/accessibility/**`
  - `tests/e2e/viewport/**`
  - `tests/e2e/accessibility/**`
  - `docs/evidence/accessibility/**`
- **repo_test_delta_target**:
  - Add: `tests/e2e/accessibility/api-lab-accessibility.spec.ts`
- **validation commands to run**:
  - `npx playwright test tests/e2e/accessibility/api-lab-accessibility.spec.ts`

### Task Group 29 — Browser and build security

- **User Stories**: US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010.
- **code_ownership_zones**:
  - `tests/security/browser/**`
  - `tests/e2e/security/**`
  - `scripts/verify-production-build.*`
  - `docs/evidence/browser-security/**`
- **repo_test_delta_target**:
  - Add: `tests/e2e/security/api-lab-browser-security.spec.ts`
- **validation commands to run**:
  - `npx playwright test tests/e2e/security/api-lab-browser-security.spec.ts`

### Task Group 30 — Final quality and release evidence

- **User Stories**: US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010.
- **code_ownership_zones**:
  - `scripts/verify-quality.*`
  - `docs/evidence/release/**`
  - `docs/evidence/release/TC-076/**`
- **repo_test_delta_target**:
  - Add: `scripts/verify-quality.test.ts`
- **validation commands to run**:
  - `node --import tsx --test scripts/verify-quality.test.ts`

## 4. Effective-Truth Synchronization Rules

- TG-24, TG-27 and TG-30 include the APPROVED `v1.7.19-kpi-baseline-deadline` ownership additions and preserve its effective dependency ordering.
- TG-01 `qa_test_refs=TC-061,TC-067` is the effective correction for this pack; it replaces only the stale TG-01 row in APPROVED v1.7.19 and leaves every other QA mapping unchanged.
- A future Plan change that modifies any validator-facing task field must update both its authoritative matrix row and the matching adapter section in one pack.
- `validate implementation` invokes the deterministic tool with this candidate/effective Plan adapter and a diff base preceding the selected TG commit. It must not use default `HEAD` after that TG has already been committed.
- A missing declared test file remains an intentional VI-1 blocker; a different test filename requires governed Plan feedback rather than an undocumented implementation substitution.

## 5. Acceptance Notes

Pass when all 30 headings resolve, TG-01 parsing returns VI findings rather than `task group not found`, and Plan semantic validation confirms no scope/effort/dependency drift. Fail on missing/duplicate TG heading, placeholder/glob-only test file, nonexistent command, matrix mismatch or any behavior-bearing downstream change.

## Self-Review Checklist

- [x] TG-01–TG-30 each have exactly one canonical `### Task Group NN` heading
- [x] Every section contains User Stories, code ownership zones, one or more concrete repo test files and runnable validation commands
- [x] Explicit authoritative corrections are isolated in §2; no Product behavior, dependency, effort or timeline changes
- [x] APPROVED KPI delta ownership and required test targets for TG-24/TG-27/TG-30 are represented
- [x] Adapter paths are concrete so VI-1 can distinguish absent evidence from parser ambiguity
