# Detailed Procedure: 02-gen-script-test

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## Pre-DONE Checklist

> **L2 — Dev + QA Lead review required.** Scripts must not be merged/run in CI until "Approved" is received. See the Sign-off section at the end of this file.

- [ ] Script follows 4-layer architecture: TC calls only HighLevel keywords, no direct Browser.* calls
- [ ] No hardcoded URLs, credentials, or secrets — all from ENV_*.yaml
- [ ] Test data sourced from DataTest files, not inline in the script
- [ ] Uses `Browser.Wait For Elements State`, not Sleep
- [ ] L2 sign-off emitted (Dev + QA Lead)
- [ ] Append execution record to `governance/audit-log.md`
- [ ] Update `project/session-state.yaml` → `last_execution`, `pending_sign_offs`

---

# Skill 06 — Gen Script Test

## Quick Reference

| | |
|---|---|
| **Required input** | TC file (TSV/MD) approved from skill 05/06/07 |
| **Recommended input** | qa-config.yaml + test data from skill 08 |
| **Output** | .robot / .py / .ts / .java files ready for CI |
| **Default framework** | Robot Framework (if not specified) |
| **Prerequisite** | qa-automation/01 (setup-automation) has been run first |
| **Time estimate** | 15–30 minutes / TC (depending on complexity) |
| **Sign-off** | L2 — Dev + QA Lead review script before merge |

> **Token optimization:** If generating scripts for only 1-3 TCs, the AI can generate directly from TC content without reading the full skill file. Read in full when generating scripts for an entire module or when new keywords need to be set up.

---

## Required documents to read before generating scripts

1. `references/ai-execution-spec.md` (required — all frameworks)
2. `references/rf-keyword-convention.md` (required — when framework is Robot Framework)
3. `references/automation-framework-policy.md` (reference as needed)

Do not begin generating code without having read `ai-execution-spec.md`.
Do not generate keywords for Robot Framework without having read `rf-keyword-convention.md`.
If a required reference file is missing from the current repo, return `NEEDS_CONTEXT`, state the missing file clearly, and ask the user to provide it or confirm using a fallback.

## Inputs

| Information | Required |
|---|---|
| List of TCs to automate (sequence numbers or file) | ✅ |
| Tech stack / framework | ✅ if no `qa-config.yaml` |
| Base URL / API endpoint | ✅ if no `qa-config.yaml` |
| Auth mechanism (Bearer, API Key, Session...) | ✅ if no `qa-config.yaml` |
| Test data (from skill 08 — qa-core/08-gen-data-test — or provided directly) | Recommended |

If the project has `qa-config.yaml` → read the following fields first, do not ask again (takes precedence over user input):

| Field | Used for |
|---|---|
| `tools.automation.ui` | List of UI frameworks (playwright/cypress/selenium/robotframework) |
| `tools.automation.api` | List of API frameworks (pytest/restassured/postman-newman/robotframework) |
| `environments.staging.url` | Default base URL |
| `environments.staging.auth_required` | Whether auth setup is needed |
| `test_accounts` | Accounts used in beforeAll / fixture |
| `automation_rules.test_level_policy` | Rule mapping test level: component/integration/e2e |

If no config → ask the user about tech stack and base URL before generating.

Fallback rules when no `qa-config.yaml` is available:
- Use user-provided information directly as the primary source.
- If no specific framework is stated, default to proposing Robot Framework and wait for user confirmation before generating scripts.

If any of the following required items are missing, return **NEEDS_CONTEXT** and stop:
1. Source test case list (Functional or SIT)
2. Module/feature
3. Target environment
4. Test data or setup/cleanup rules
5. Test Level for each TC (or a policy sufficient to infer it)

## TC selection and priority handling rules

### Rule 1 — Prioritize TCs marked for automation

If the user does not specify which TCs to generate scripts for:
- Prioritize picking TCs from Functional files (`testing-output/test-cases/functional/`) **and** SIT files (`testing-output/test-cases/sit/`) that have the column `Auto=Y` (or equivalent).
- Do not automatically pick TCs with `Auto=N` unless the user explicitly requests it.
- If no TCs have `Auto=Y` → notify the user and ask whether to generate for all TCs before continuing.

### Rule 2 — Follow user specification

If the user specifies explicitly (TC list by sequence number, group rule, module, specific file, or any defined scope):
- Strictly follow that specification — do not override with Rule 1.
- Do not add or remove TCs outside the scope specified by the user.
- If a user-specified TC has `Auto=N`, still generate but note it in the mapping matrix.

### Rule 3 — Ask when configuration information is missing

When any of the following required information is absent and `qa-config.yaml` does not provide it:
- **API endpoint / domain**: ask clearly for the base URL and specific path of the module under test.
- **Test accounts**: ask for the username/role needed (do not ask for the password — require the user to inject it via env var or secrets).
- **Auth mechanism**: ask for the auth type (Bearer token, API key, session cookie) and how to obtain the token.
- **DB / environment**: ask for the target environment (staging/UAT) if unclear.

**Do not assume values for any of the above items.** List each missing item clearly and ask the user before generating any code.

## Supported frameworks

> **Primary preference: Robot Framework** — unified API + UI automation (keyword-driven, easy to maintain, suitable for QA)

| Framework | Language | Best suited for | Notes |
|---|---|---|---|
| **Robot Framework** | Python | UI, API, E2E (unified) | ✅ **Preferred — both API + UI in one framework** |
| Playwright | JS / TS | UI E2E, API | UI-focused, weaker API support than Robot |
| Pytest + Requests | Python | API, Backend | API-only |
| RestAssured | Java | API, Spring Boot | API-only, Java-specific |
| Cypress | JS | UI E2E, Component | UI-only, JavaScript |
| k6 | JS | Standalone performance scripts | Skill 11 defaults to JMeter; k6 scripts can be generated freely but have no integrated template in skill 11 |

**Mobile native scope:**
- ✅ Supports Robot Framework + AppiumLibrary for Android/iOS native apps.
- When test type is mobile, also read the **Mobile Appium** section below.
- Mobile web/PWA running in a browser → still use the Browser library (Playwright) normally.

---

## Mobile Appium — Additional rules

Applies when `tools.automation.mobile` is present in qa-config or the user requests native mobile testing.

### Import and Setup

```robot
*** Settings ***
Library    AppiumLibrary    run_on_failure=AppiumLibrary.Capture Page Screenshot
Library    ../../Libs/ScrollAppMoblie.py         # Android scroll
Library    ../../Libs/ScrollIOSMoblie.py          # iOS scroll
```

### Capabilities — read from `Variables/CONFIG_MOBILE.yaml`

```yaml
# CONFIG_MOBILE.yaml — DO NOT hardcode in test
PLATFORM_NAME:     Android                        # or iOS
APP_PACKAGE:       com.example.app
APP_ACTIVITY:      .MainActivity
DEVICE_NAME:       emulator-5554
APPIUM_URL:        http://localhost:4723/wd/hub
```

### Locator Priority (Mobile)

1. `accessibility_id=element-accessibility-id` ← highest priority
2. `id=com.package.name:id/element_id`
3. `xpath=//android.widget.Button[@text='Đăng nhập']`
4. `class chain` / `predicate string` (iOS)

### LowLevel Mobile Keywords — pattern

```robot
*** Keywords ***
Tap Button Ten on TenTrang Screen
    [Documentation]    Tap the Ten button on the TenTrang screen
    Wait Until Element Is Visible    accessibility_id=ten-button    timeout=10s
    Click Element    accessibility_id=ten-button

Enter Text Ten on TenTrang Screen
    [Arguments]    ${value}
    Wait Until Element Is Visible    id=com.package:id/input_ten    timeout=10s
    Clear Text    id=com.package:id/input_ten
    Input Text    id=com.package:id/input_ten    ${value}

Swipe Up to Find More on TenTrang Screen
    Scroll Down    0.5    0.2    500        # uses ScrollAppMoblie.py
```

### HighLevel Mobile Keywords — pattern

```robot
*** Keywords ***
Login with valid credentials on Login Screen
    [Arguments]    ${username}    ${password}
    Tap Button Dang Nhap on Login Screen
    Enter Text Username on Login Screen    ${username}
    Enter Text Password on Login Screen    ${password}
    Tap Button Xac Nhan on Login Screen
    Wait Until Element Is Visible    accessibility_id=home-screen    timeout=15s
```

### Suite Setup/Teardown Mobile

```robot
*** Settings ***
Suite Setup       Open Mobile Application
Suite Teardown    Close All Applications

*** Keywords ***
Open Mobile Application
    Open Application    ${APPIUM_URL}
    ...    platformName=${PLATFORM_NAME}
    ...    deviceName=${DEVICE_NAME}
    ...    appPackage=${APP_PACKAGE}
    ...    appActivity=${APP_ACTIVITY}
    ...    automationName=UiAutomator2
    ...    noReset=False
```

### Output path Mobile

```
testing-output/automation/
├── Projects/{Module}/
│   └── test_{Module}_Mobile.robot
├── KeywordLibraries/{Module}/
│   ├── LowLevelKeywords/
│   │   └── Mobile_{Module}.resource        # Mobile LowLevel
│   ├── HighLevelKeywords/
│   │   └── HighLevelKeywords_{Module}.resource
│   └── VerificationKeywords/
│       └── VerificationKeywords_{Module}.resource
└── Variables/
    └── CONFIG_MOBILE.yaml                  # capabilities per env
```

### Additional DoD for Mobile

- [ ] Capabilities sourced from `CONFIG_MOBILE.yaml` — NO hardcoding
- [ ] Wait Until Element Is Visible instead of Sleep
- [ ] Scroll uses `ScrollAppMoblie.py` (Android) or `ScrollIOSMoblie.py` (iOS)
- [ ] `AppiumLibrary.Capture Page Screenshot` for `run_on_failure`
- [ ] Each test resets app state via `noReset=False` or a cleanup keyword
- [ ] Tags `mobile` and `android`/`ios` on each test case

---

## Code generation principles

- **Page Object Model** for UI tests — separate locators from test logic
- **Clear assertions** — do not use `expect(true).toBe(true)`
- **Data-driven** — read data from files/fixtures, do not hardcode in tests
- **CI-ready** — executable with `npm test` / `pytest` / `mvn test` without additional configuration
- **Cleanup** — each test self-cleans data after running (`afterEach` / `teardown`)
- **Independent** — tests do not depend on execution order of other tests
- **Descriptive** — `describe` / `it` / `test name` accurately reflects the TC scenario

## AI-first mandatory standards

A **mapping matrix** must be created before generating code.

The result must contain exactly 3 parts:
1. Mapping matrix (source TC -> script)
2. List of output files with standard paths
3. DoD pass/fail checklist

Scripts must not be generated without the mapping matrix.

## Output directory structure

**Save to:** `output_paths.automation` from qa-config (default: `testing-output/automation/`)

```
testing-output/automation/
├── fixtures/          # test data files (JSON/CSV)
│   └── {feature}.json
├── pages/             # Page Objects (UI — Playwright/Cypress)
│   └── {PageName}.ts
├── specs/             # test files (Playwright/Cypress)
│   └── {feature}.spec.ts
├── robot/             # Robot Framework suites
│   ├── {feature}.robot
│   └── resources/{feature}-keywords.resource
├── tests/api/         # API tests (Pytest)
│   └── test_{feature}.py
└── helpers/           # utils, auth setup
    └── auth.ts
```

For projects using the standard Robot Framework architecture, prefer the following output paths:

1. `testing-output/automation/Projects/<FeatureGroup>/<Feature>_<Channel>.robot`
2. `testing-output/automation/KeywordLibraries/<Module>/HighLevelKeywords/<Module>_High.resource`
3. `testing-output/automation/KeywordLibraries/<Module>/LowLevelKeywords/<Module>_Low.resource`
4. `testing-output/automation/KeywordLibraries/<Module>/VerificationKeywords/<Module>_Verification.resource`
5. `testing-output/automation/DataTest/<Module>/<Feature>_data.<csv|json|yaml>`

Grouping rules:
- Use Projects directory by functional/business group (Auth, Payment, Order, Search...).
- Classify tests by type (api/ui/sit/smoke/regression) using Tags, not Projects subdirectories.

## Pre-export checklist

- [ ] Code runs with the framework's default command
- [ ] Has `beforeAll` / `afterEach` setup and teardown
- [ ] Assertions are sufficiently specific (status code, response body, UI element)
- [ ] No hardcoded credentials — uses `process.env` or fixture
- [ ] Comments explain complex steps
- [ ] Dependency versions noted in file header comment

## Fixed output format

### 1) Mapping Matrix

| Source TC | Type | Test Level | Precondition | Business steps | Expected result | Test suite file | High-level keyword | Low-level keyword | Data used | Environment |
|---|---|---|---|---|---|---|---|---|---|---|

### 2) File Output Plan

- `<path 1>`
- `<path 2>`
- `<path 3>`

### 3) DoD Pass/Fail

**Common (all frameworks):**
- [ ] All source TCs fully mapped to scripts
- [ ] Each mapping row has a Test Level (component/integration/e2e)
- [ ] Correct standard output path
- [ ] No sensitive data hardcoded
- [ ] Tags smoke/regression/module present
- [ ] Separate data file present
- [ ] Env config used instead of fixed URLs
- [ ] Smoke path runs on at least 1 environment

**Robot Framework — additional (read `references/rf-keyword-convention.md`):**
- [ ] Keywords named per convention for each layer (Low/High/Verification)
- [ ] LowLevel — each keyword has exactly 1 action, no IF/FOR logic
- [ ] HighLevel — combines Low into business flows, no direct Browser.* calls
- [ ] VerificationKeywords — uses only `Browser.Wait For Elements State`, no business assertions
- [ ] File header has `Documentation` + `Author` in the correct format
- [ ] Locators prioritize `data-autoid` → chain (`>>`) → id → xpath → css → text
- [ ] No Sleep — replaced with `Browser.Wait For Elements State` or `Wait For Load State`
- [ ] General resource file updated with new module import
- [ ] Test case imports only General resource (no direct Low/High/Verification imports)

Status: `PASS` or `FAIL`

## CI/CD integration guidance (basic level)

The goal of the output is CI-ready. If the project requires specific integration, add one sample file per the existing CI system:

- **GitHub Actions**: `.github/workflows/test-automation.yml`
- **GitLab CI**: `.gitlab-ci.yml`
- **Jenkins**: `Jenkinsfile`

Minimum CI checklist:
1. Install dependencies + cache (npm/pip/maven)
2. Inject environment variables (`BASE_URL`, token, secret) via CI secret store
3. Run the default test command for the framework
4. Export report artifacts (junit/html/log) for traceability

If the user has not requested a specific pipeline, document this only as guidance; do not auto-generate detailed CI files.

---

## Sign-off Request (L2)

```
---
⏳ SIGN-OFF REQUEST — qa-automation/02-gen-script-test (Level 2 — Dev + QA Lead)
Dev reviewer: [team.dev_lead from qa-config]
QA reviewer: [team.qc_lead from qa-config]
SLA: 24 hours
Output: testing-output/automation/Projects/.../*.robot
Review checklist: Script runs, 4-layer compliance, no hardcoded secrets
Action: Reply "Approved" or "Needs fix: [details]"
---
```

After receiving Approved → update `project/session-state.yaml`: remove item from `pending_sign_offs`.

---

## Completion Status

- **DONE** — Script runs with the default command, has setup/teardown, assertions specific enough, no hardcoded credentials
- **DONE_WITH_CONCERNS** — Complete but: {Some complex TCs could not be automated / Missing data fixture / CI config needs further adjustment}
- **BLOCKED** — Cannot generate due to: {Tech stack not confirmed / No base URL / Auth mechanism unclear}
- **NEEDS_CONTEXT** — Additional input needed: {List of TCs to automate / Framework to use / Base URL and auth mechanism}
