# Automation Framework Policy (Robot Framework + Playwright)

Objective: Full architecture standard for automation scripts, used as a reference for development, review, and onboarding.

## Scope

1. Robot Framework is the primary test execution framework.
2. Supports API + UI + SIT.
3. UI prioritizes Browser library (Playwright engine).
4. Scripts are generated from Functional/SIT test cases.
5. Data-driven, no hardcoding.
6. Supports multiple environments.

## 4-Layer Architecture

1. Layer 1: Test Cases
- Only calls high-level keywords.
- No direct SQL.

2. Layer 2: High-Level Keywords
- Describes business flows.
- May assert business logic.

3. Layer 3: Low-Level Keywords
- Atomic technical operations.
- Must not assert business logic.

4. Layer 4: Libraries/Connectors
- Robot libs + custom Python libs + connectors.

## Dependency Rules

1. Layer 1 -> Layer 2 -> Layer 3 -> Layer 4.
2. Layer 1 must not call Layer 3/4 directly.
3. Layer 3 must not assert business logic.

## Data and Environment

1. Data is stored at `testing-output/automation/DataTest/` (CSV/JSON/YAML).
2. No hardcoded URLs, tokens, credentials, or secrets.
3. Use `Variables/ENV_<ENV>.yaml` for DEV/QC/UAT/STG.

## Standard Naming and Output Paths

1. Test suite:
- `testing-output/automation/Projects/<FunctionalGroup>/<Feature>.robot`

2. High-level:
- `testing-output/automation/KeywordLibraries/<Module>/HighLevelKeywords/<Module>_High.resource`

3. Low-level:
- `testing-output/automation/KeywordLibraries/<Module>/LowLevelKeywords/<Module>_Low.resource`

4. Verification:
- `testing-output/automation/KeywordLibraries/<Module>/VerificationKeywords/<Module>_Verification.resource`

5. Data:
- `testing-output/automation/DataTest/<Module>/<Feature>_data.<csv|json|yaml>`

6. Results:
- `testing-output/reports/<yyyy-mm-dd>/<run-id>/`

Additional rules:
1. Folder names inside `Projects/` must follow functional/business grouping (Auth, Payment, Order...).
2. Test type (api/ui/sit/smoke/regression) is classified by tags, not by folder structure under `Projects/`.

## Rules for AI Script Generation

1. A mapping matrix must be created before writing code.
2. Each expected result must have a corresponding verify step.
3. If data or environment is missing: stop and request the missing information.
4. Must pass the DoD checklist in pass/fail format before handover.
