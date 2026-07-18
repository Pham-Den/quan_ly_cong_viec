# Detailed Procedure: 01-setup-automation

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## Pre-DONE Checklist

- [ ] 4-layer structure complete in `testing-output/automation/`
- [ ] ENV_*.yaml created for the required environments
- [ ] General.resource and base keyword scaffold in place
- [ ] Append execution record to `governance/audit-log.md`
- [ ] Update `project/session-state.yaml` → `last_execution`, `notes`

---

# Skill 00 — Setup Automation Project

## Purpose

Create a complete Robot Framework automation folder structure for a new project/module in
`testing-output/automation/`, based on the template at `assets/automation-template/`.

Run this skill **only once** when beginning automation for a project/module that has never had automation before.

**Language rule:** Vietnamese descriptions with diacritics. Technical terms/IDs/file paths without diacritics.

---

## Inputs

| Information | Required | Where to find |
|---|---|---|
| Project name / project code | ✅ | `qa-config.yaml` > `project.code` or ask user |
| First module | Recommended | Ask user if unclear |
| Tech type (ui/api/mobile/mixed) | ✅ | `qa-config.yaml` > `tools.automation` or ask |

### Read qa-config first
If `testing-output/qa-config.yaml` exists:
- `project.code` → ProjectName (uppercase, e.g.: `YourProject`)
- `tools.automation.ui` / `tools.automation.api` → determine framework

---

## Template source

```
assets/automation-template/
├── KeywordLibraries/CommonKeyword/    ← copy all 7 files
├── KeywordLibraries/KeyCloak/         ← copy Api_KeyCloak_Token.resource
├── Libs/                              ← copy all Python libs
├── Variables/ENV_*.yaml               ← copy 4 environments
├── .gitignore
└── requirements.txt
```

---

## Output structure

```
testing-output/automation/
├── .gitignore
├── requirements.txt
├── DataTest/
│   └── {Module}/
│       └── {feature}_data.yaml        # placeholder data file
├── KeywordLibraries/
│   ├── CommonKeyword/                 # copy from template
│   │   ├── ApiCore.resource
│   │   ├── BrowserCore.resource
│   │   ├── CommonVariable.resource
│   │   ├── Utils.resource
│   │   ├── WebBaseLibraries.resource
│   │   ├── WebBrowserLibraries.resource
│   │   └── WebCore.resource
│   ├── KeyCloak/
│   │   └── Api_KeyCloak_Token.resource
│   └── {ProjectName}/                 # create new
│       ├── HighLevelKeywords/
│       │   └── HighLevelKeywords_{Module}.resource   # scaffold
│       ├── LowLevelKeywords/
│       │   ├── UI_{Module}.resource                  # UI scaffold
│       │   ├── Api_{Module}.resource                 # API scaffold
│       │   └── UI_Utils.resource                 # copy from template if UI
│       ├── VerificationKeywords/
│       │   └── VerificationKeywords_{Module}.resource # scaffold
│       └── {ProjectName}General.resource             # import hub
├── Libs/                              # copy from template
├── Projects/
│   └── {Module}/
│       └── test_{Module}.robot        # scaffold test suite
└── Variables/
    ├── ENV_DEV.yaml                   # copy + add URL placeholder
    ├── ENV_QC.yaml
    ├── ENV_UAT.yaml
    └── ENV_PRD.yaml
```

---

## Scaffold file contents

### `{ProjectName}General.resource`

```robot
*** Settings ***
Documentation    General resource hub for {ProjectName}.
...              Test cases only need to import this file to access all keywords.
...              Add new imports here when creating a new module.

Resource    ../../CommonKeyword/BrowserCore.resource
Resource    ../../CommonKeyword/ApiCore.resource
Resource    ../../CommonKeyword/Utils.resource
Resource    ../../CommonKeyword/CommonVariable.resource

# === ADD NEW MODULES HERE ===
# Resource    ../HighLevelKeywords/HighLevelKeywords_{Module}.resource
# Resource    ../VerificationKeywords/VerificationKeywords_{Module}.resource
```

### `LowLevelKeywords/UI_{Module}.resource` (scaffold)

```robot
*** Settings ***
Documentation    LowLevel UI keywords for the {Module} screen.
...              1 keyword = 1 action. NO IF/FOR. NO business assertions.
...              All Browser.* actions must be prefixed with Browser.

Resource          ../../CommonKeyword/BrowserCore.resource

*** Keywords ***
# TODO: Add keyword for each element on the page
# Pattern: {Action} {ElementName} on {Module} Page
#
# Example:
# Enter Ten on {Module} Page
#     [Arguments]    ${value}
#     Browser.Fill Text    [data-autoid='input-ten']    ${value}
#
# Click Button Luu on {Module} Page
#     Browser.Click    [data-autoid='btn-luu']
#
# Click Trang Thai Dropdown on {Module} Page
#     Browser.Click    [data-autoid='dropdown-trang-thai']
```

### `LowLevelKeywords/Api_{Module}.resource` (scaffold)

```robot
*** Settings ***
Documentation    LowLevel API keywords for module {Module}.
...              Each keyword calls 1 API endpoint. Sets RESPONSE to a test variable.
...              NO assertions in low-level.

Resource          ../../CommonKeyword/ApiCore.resource

*** Keywords ***
# TODO: Add keyword for each API endpoint
# Pattern: Api {METHOD} /v1/{path}
#
# Example:
# Api POST /v1/{module}
#     [Arguments]    ${payload}    ${token}
#     &{headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
#     METHOD POST    /v1/{module}    ${payload}    headers=${headers}
#     Set Test Variable    ${RESPONSE}    ${response}
#
# Api GET /v1/{module}/{id}
#     [Arguments]    ${id}    ${token}
#     &{headers}=    Create Dictionary    Authorization=Bearer ${token}
#     METHOD GET    /v1/{module}/${id}    headers=${headers}
#     Set Test Variable    ${RESPONSE}    ${response}
```

### `HighLevelKeywords/HighLevelKeywords_{Module}.resource` (scaffold)

```robot
*** Settings ***
Documentation    HighLevel keywords for module {Module}.
...              Combines multiple LowLevel keywords into a single business flow.
...              MAY use IF/FOR. DO NOT call Browser.* or REST directly.

Resource    ../LowLevelKeywords/UI_{Module}.resource
Resource    ../LowLevelKeywords/Api_{Module}.resource
Resource    ../LowLevelKeywords/UI_Utils.resource

*** Keywords ***
# TODO: Add keyword describing a business flow
# Pattern: {ActionSummary} on {Module} Page
#
# Example:
# Search {Module} by Ten on {Module} Page
#     [Arguments]    ${ten}=${EMPTY}
#     Enter Ten on {Module} Page    ${ten}
#     Wait for networkidle on NSP Page
#     Wait for loading table on NSP Page
```

### `VerificationKeywords/VerificationKeywords_{Module}.resource` (scaffold)

```robot
*** Settings ***
Documentation    Verification keywords for module {Module}.
...              Only checks UI state. NO business logic. NO LowLevel calls.
...              Use Browser.Wait For Elements State or Should Be Equal.

Resource    ../../CommonKeyword/BrowserCore.resource

*** Keywords ***
# TODO: Add verification keyword
# Pattern: Verify {Description} on {Module} Page
#
# Example:
# Verify Ten hien thi on {Module} Page
#     [Arguments]    ${ten}
#     Browser.Wait For Elements State    text=${ten}    visible    timeout=10s
#
# Verify Table is Not Empty on {Module} Page
#     Browser.Wait For Elements State    [data-autoid='table-row']    visible    timeout=10s
```

### `Projects/{Module}/test_{Module}.robot` (scaffold)

```robot
*** Settings ***
Documentation    Test suite for module {Module} — {ProjectName}.
...              Import only {ProjectName}General.resource.
...              Test cases call only HighLevel and Verification keywords.

Resource    ../../../KeywordLibraries/{ProjectName}/{ProjectName}General.resource

Suite Setup      Open Browser And Login
Suite Teardown   Close Browser

*** Variables ***
${ENV}           DEV

*** Test Cases ***
# TODO: Add test cases
# Pattern: TC{N}: [Positive/Negative] Test case description
#
# Example:
# TC01: [Positive] Search successfully by name
#     [Tags]    smoke    regression    {module}
#     Search {Module} by Ten on {Module} Page    Nguyễn Văn A
#     Verify Ten hien thi on {Module} Page       Nguyễn Văn A

*** Keywords ***
Open Browser And Login
    # TODO: Implement login flow
    Log    Open browser and log in to the system
```

### `DataTest/{Module}/{feature}_data.yaml` (scaffold)

```yaml
# Test data for module {Module}
# Do not hardcode credentials — use environment variables for sensitive data

valid_data:
  - name: Nguyễn Văn A
    email: test.user.a@example.com
    phone: "0912345678"

invalid_data:
  - case: empty_name
    name: ""
    expected_error: Họ và tên không được để trống
  - case: invalid_email
    email: not-an-email
    expected_error: Email không hợp lệ
```

---

## File copy rules

| Action | Condition |
|---|---|
| Copy file from template | File does not yet exist in testing-output/automation/ |
| Skip (do not overwrite) | File already exists |
| Create new scaffold | File is a placeholder for a new module |
| Ask user | File exists but differs significantly from the template |

---

## Result report

```
✅ Automation initialized successfully for {ProjectName}

📁 Created:
  - testing-output/automation/KeywordLibraries/CommonKeyword/  (7 files from template)
  - testing-output/automation/KeywordLibraries/{ProjectName}/  (new scaffold)
  - testing-output/automation/Libs/                            (N Python libs)
  - testing-output/automation/Projects/{Module}/               (scaffold test suite)
  - testing-output/automation/Variables/ENV_*.yaml             (4 environments)

⚠️  Files requiring update:
  1. Variables/ENV_DEV.yaml    → fill in actual URL{PROJECT_CODE}
  2. Variables/ENV_QC.yaml     → fill in actual URL{PROJECT_CODE}
  3. testing-output/qa-config.yaml → fill in project information (if not yet done)

🚀 Next step:
  Run Skill 06 (gen-script-test) to generate scripts from test cases in:
  testing-output/test-cases/functional/
```

---

## Completion Status

- **DONE** — Structure complete, scaffold files created
- **DONE_WITH_CONCERNS** — Complete but some files could not be copied (specify)
- **NEEDS_CONTEXT** — Missing: project name / qa-config.yaml
- **SKIPPED** — testing-output/automation/ already has a complete structure, no re-initialization needed
