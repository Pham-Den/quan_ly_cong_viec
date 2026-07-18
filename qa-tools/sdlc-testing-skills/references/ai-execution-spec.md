# AI Execution Spec (Automation Script)

Objective: A concise mandatory reference used when requesting AI to generate automation scripts.

## 1. 10 Mandatory Rules

1. Follow the 4-layer architecture.
2. Test cases must not call low-level keywords or libraries directly.
3. No direct SQL in test cases.
4. Low-level keywords must not assert business logic.
5. Each expected result must have a corresponding verify step.
6. No hardcoded URLs, tokens, credentials, or secrets.
7. Data must be sourced from DataTest files.
8. UI must use Browser/Playwright with waits instead of sleep.
9. Output paths must conform to the standard convention.
10. Must pass the DoD checklist before handover.

Test level scope:
1. component
2. integration
3. e2e

Notes:
- Unit tests are outside the scope of this skill suite (they belong to the dev workflow).

## 2. Input Convention

1. Source test case set: Functional or SIT.
2. Metadata: module, test type, priority, environment.
3. Test data: input, expected result, setup/cleanup.

## 3. Output Convention

1. Robot test suite:
- testing-output/automation/Projects/<FunctionalGroup>/<Feature>_<Channel>.robot
2. High-level keywords:
- testing-output/automation/KeywordLibraries/<Module>/HighLevelKeywords/<Module>_High.resource
3. Low-level keywords:
- testing-output/automation/KeywordLibraries/<Module>/LowLevelKeywords/<Module>_Low.resource
4. Verification keywords:
- testing-output/automation/KeywordLibraries/<Module>/VerificationKeywords/<Module>_Verification.resource
5. Data file:
- testing-output/automation/DataTest/<Module>/<Feature>_data.<csv|json|yaml>
6. If needed, a new ENV file:
- testing-output/automation/Variables/ENV_<ENV>.yaml

Rules:
1. Folders inside Projects must be organized by functional/business group (Auth, Payment, Order...).
2. Test type (api/ui/sit/smoke/regression) is classified by tags, not by folder name under Projects.

## 4. Mapping Matrix Template

| Source TC | Type | Test Level | Precondition | Business step | Expected result | Test suite file | High-level keyword | Low-level keyword | Data used | Environment |
|---|---|---|---|---|---|---|---|---|---|---|
| FUNC_LOGIN_01 | Functional | e2e | User active | Login with valid credentials | Navigate to Dashboard | testing-output/automation/Projects/Auth/Login_UI.robot | Login With Valid User | Ui Input Username, Ui Click Login | testing-output/automation/DataTest/Auth/login_valid.csv | DEV, QC |

## 5. DoD pass/fail

- [ ] Mapping matrix is complete.
- [ ] Each mapping row has a Test Level (component/integration/e2e).
- [ ] All files exist at the standard output paths.
- [ ] No sensitive data is hardcoded.
- [ ] Test cases do not call low-level keywords or libraries directly.
- [ ] Low-level keywords do not assert business logic.
- [ ] Tags smoke/regression/module are present.
- [ ] UI does not use fixed sleep.
- [ ] A separate data file exists.
- [ ] ENV config is used instead of hardcoded URLs.
- [ ] Smoke path is executable in at least 1 environment.

If any item remains unchecked, the status is FAIL.
