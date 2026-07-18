# Robot Framework Automation Project Template

## Introduction

This framework provides a **versatile automation toolkit** for:
- UI Web testing using **SeleniumLibrary** or **Browser (Playwright)**
- API testing using **RESTinstance**
- Mobile testing using **AppiumLibrary**

The goal is to establish a **standard project template structure** that is easy to scale, with ready-made resource files for each technology.

---STT	Summary	Test Level	Precondition	Test Data	Step summary	Expected result	Priority
EH-123 Bereavement Leave							
TC-001	[EH-123][AC1][BasicFlow] Verify E2E flow: create + approve + auto-confirm Bereavement Leave	e2e	"- Employee VB PERNR=800110 (or VE — BA confirmed VE eligible)
- Direct manager logs in separately to approve
- EH-113 bereavement leave quota remaining >= 3 days"	"PERNR=800110 (VB)
Leave Type='Bereavement Leave'
Period: 20/05/2026 → 22/05/2026 (3 days = max)
Approver=default direct manager
Reason='Family bereavement', Comment='Grandfather's passing'"	"1. Login employee PERNR=800110
2. Open Homepage → tap module 'Leave'
3. Tap 'Bereavement Leave'
4. Select period 20/05-22/05 (3 days max)
5. Enter Reason, Comment, select Approver
6. Tap 'Submit Request'
7. Logout, login direct manager
8. Open pending list, tap 'Approve'
9. Wait for auto-confirm
10. Verify SAP push code PN03"	"- Step 6: state=Pending; employee receives in-app notification
- Step 8: state=Approved (1 level sufficient since 3<10 days)
- Step 9: state=Confirmed
- Step 10: SAP has record with code PN03-Personal Leave (bereavement/wedding) with PERNR + leave period"	High
TC-002	[EH-123][AC1][Display] Verify 'Bereavement Leave' form displays 6 fields	component	Employee VA/VB/VE logged in	"PERNR=800110
Form not submitted, only check structure"	"1. Open Leave module
2. Tap 'Bereavement Leave' to open form
3. Count and verify each field"	"- 6 fields displayed:
  Leave Type (Dropdown, R, default 'Bereavement Leave')
  Bereavement Leave (Date picker, default current_date, min 0.5 day block 4h, max 3 days)
  Approver (Dropdown, R, default per EH-112)
  Leave Quota (Number readonly from EH-113)
  Reason (Dropdown, R)
  Comment (Text 500 characters, R)"	High
TC-003	[EH-123][AC2][Decision] Verify Employment Contract — VA, VB, VE eligible (BA override 2026-05-14)	component	8 employees with 8 different contract types	"[Case-VA] Fixed-term contract → visible
[Case-VB] Indefinite-term contract → visible
[Case-VE] Probationary contract → visible (BA confirmed 2026-05-14 override original Req 'no probation')
[Case-VC] Seasonal contract → NOT visible (service contract)
[Case-VD] Apprenticeship → NOT visible
[Case-VF/VG/VH] Service contract → NOT visible"	"1. Login each employee by contract type
2. Open Leave module
3. Open Leave Type dropdown
4. Verify visibility of 'Bereavement Leave'"	"- VA, VB, VE: 'Bereavement Leave' visible (BA override original Req)
- VC, VD, VF, VG, VH (service contracts): NOT visible
- Consistent with LEAVE_MODULE_SUMMARY.md v1.1"	High
TC-004	[EH-123][BR][BVA] Verify min 0.5 day + max 3 days	component	"- Employee VB
- Standard shift 8:00-17:00"	"PERNR=800110
[BVA-min-eq] Period = 4h from 8:00-12:00 → accept
[BVA-min-1] Period = 3h59 → reject
[BVA-1d] Period = 1 full day → accept
[BVA-max-eq] Period = 3 days → accept
[BVA-max+1] Period = 4 days → reject 'Maximum 3 days'
[BVA-half-day] Period = 0.5 day → accept"	"1. Submit each case
2. Verify validation"	"- BVA-min-eq, BVA-1d, BVA-max-eq, BVA-half-day: accept
- BVA-min-1: error 'Minimum 0.5 day'
- BVA-max+1: error 'Maximum 3 days'"	High
TC-005	[EH-123][BR][CornerCase] Verify warning when logging on public holiday/weekend	component	"- Public holidays 30/04, 01/05/2026
- Weekend within test range
- 'Exclude' = 'Yes' (Req:32)"	"PERNR=800110
[Case-with-holiday] Period = 30/04-02/05 (contains holiday + weekend)
[Case-with-weekend] Period = 17/05 (Sunday only)
[Case-no-holiday] Period = 19/05-21/05 (regular Mon-Wed)"	"1. Submit each case
2. Observe warning popup"	"- Case-with-holiday, Case-with-weekend: display warning 'Leave period contains public holiday/weekend'; still allows submit if user confirms
- Case-no-holiday: submit OK without warning"	Medium
TC-006	[EH-123][AC2.Function][Decision] Verify approval levels — since max 3 days → always 1 level direct manager	component	"- Employee VB
- Max period = 3 days (capped per BR)"	"PERNR=800110
Period = 3 days (= max)"	"1. Employee submits 3-day request
2. Direct manager opens pending list, taps 'Approve'
3. Verify state Approved
4. Verify NO level 2/3 approval required"	"- 1 level sufficient for Approve (since max 3 < 10 days)
- BVA level 2 (>=10 days) and level 3 (>=30 days) DO NOT apply to EH-123 due to 3-day cap
- NO level 2/3 in pending list"	High
TC-007	[EH-123][AC3][StateTransition] Verify Submit/Approve/Reject + SAP push PN03	integration	—	"PERNR=800110
[Case-approve] Period 3 days → approved → SAP PN03
[Case-reject] Period 3 days → manager rejects with reason → no SAP"	"1. Test Case-approve:
   1.1 Employee submits
   1.2 Manager approves
   1.3 Wait for auto-confirm
   1.4 Verify SAP PN03
2. Test Case-reject:
   2.1 Employee submits
   2.2 Manager rejects with reason 'Conflicts with project plan'
   2.3 Verify state Rejected, no SAP"	"- Case-approve: state chain Pending → Approved → Confirmed; SAP has record with code PN03
- Case-reject: state Pending → Rejected; NO SAP push; employee receives notification with reason"	High
TC-008	[EH-123][CornerCase] Verify backdate current period + previous (TBD) + NO cross-year	component	Today = 14/05/2026	"PERNR=800110
[Case-current] Period starting 10/05 → accept
[Case-prev] Period starting 20/04 → accept
[Case-old] Period starting 10/03 → reject
[Case-cross-year] 28/12/2025-30/12/2025 (crossing to 01/01/2026) → reject"	"1. Submit each case
2. Verify validation"	"- Case-current, Case-prev: accept
- Case-old: reject 'Exceeds backdate period'
- Case-cross-year: reject 'Cross-year logging not allowed'"	Medium
TC-009	[EH-123][Impact] Verify EH-113 quota updates 'Used' after Confirmed (NO impact on EH-93 pool)	integration	"- Before Confirmed: EH-113 'Used'=0
- 3-day request already Confirmed
- EH-93 (5 standard pools) NOT affected since Bereavement Leave is not in the 5 pools"	"PERNR=800110
Period = 3 days, already Confirmed"	"1. Snapshot EH-113 + EH-93 before
2. Confirm request (via TC-007 Case-approve)
3. Snapshot after"	"- EH-113 'Used'+=3
- EH-93 (5 pools) NOT changed (Bereavement Leave not in these 5 pools)
- 'Quota' field in Bereavement Leave form reflects new value when reopened"	High
TC-010	[EH-123][CornerCase] Verify SAP push fail → idempotency	integration	Mock SAP EH-35 returns 500	"PERNR=800110
Request Approved 3 days"	"1. Employee submits + manager approves → Approved
2. Mock SAP fail
3. Trigger auto-confirm
4. Verify state does NOT transition to Confirmed
5. Mock SAP recovery
6. Trigger retry
7. Verify state + SAP records"	"- Step 4: state remains Approved
- Step 7: state Confirmed after retry; SAP has exactly 1 record
- Synchronized with Q8 leave-business-flow"	High
TC-011	[EH-123][AC1][BVA] Verify Comment 500	component	—	"PERNR=800110
[BVA-eq] 500 characters
[BVA-over] 501 characters
[BVA-empty] '' (empty)"	"1. Enter Comment for each case
2. Submit"	"- BVA-eq: OK
- BVA-over: error 'Maximum 500 characters' or auto-truncate (BA confirmation needed)
- BVA-empty: error 'Comment is required'"	Medium
TC-012	[EH-123][AC1.Function] Verify filter + remove approver	component	Approver dropdown open	"[Case-code] Search by PERNR
[Case-name] Search by name 'Nguyen'
[Case-empty] Empty search
[Case-remove] Tap X on selected person"	"1. Open dropdown
2. Test 4 search cases
3. Select person + tap X to remove
4. Verify field reset"	"- Case-code/name: filter works correctly
- Case-empty: display default list
- Case-remove: field returns to empty"	Medium
TC-013	[EH-123][CornerCase] Verify multiple requests in same year — frequency limit	component	Employee PERNR=800110 already has 1 Confirmed Bereavement Leave request in 2026 (3 days)	"PERNR=800110
[Case-2nd-in-year] Submit 2nd request in same year with 3-day period"	"1. Submit 2nd request in same year
2. Verify validation"	"- BA confirmation needed on rule: is there a limit on number of Bereavement Leave requests per year (e.g.: 3 times/year)
- Default behavior: allow submit, validate via EH-113 quota (if quota is cumulative)
- Or reject if BA specifies strict limit"	Low
TC-014	[EH-123][Regression] Verify no impact on other pending requests	component	Employee PERNR=800110 has 2 other pending requests of different types (WFH, Late arrival)	"PERNR=800110
Bereavement leave period = 3 days"	"1. Snapshot 2 other pending requests
2. Submit + approve Bereavement Leave request
3. Verify old pending requests"	- Old pending requests retain their state	Medium
TC-015	[EH-123][Non-Functional][Security] Verify cross-PERNR	component	Endpoint POST /v1/leave-request	"[Case-no-token] No Authorization
[Case-cross-create] PERNR_caller=800110, body PERNR=800111
[Case-self-approve] Employee submits + self-approves their own request"	"1. Send each case via API
2. Verify response status code"	"- Case-no-token: HTTP 401
- Case-cross-create: HTTP 403 or auto-override per token
- Case-self-approve: HTTP 403"	High
TC-016	[EH-123][Checklist-Based][Mobile] Verify form on iPhone SE 4.7\" + Layout/Color/Objects	e2e	Device iPhone SE 4.7\"	"PERNR=800110
Test full form"	"1. Open app on iPhone SE
2. Tap Leave → 'Bereavement Leave'
3. Test Date picker, dropdown
4. Observe layout, color, touch target"	"- Form fully visible on SE
- Date picker no overflow
- Touch target for Submit + X remove button >= 44x44pt
- Color contrast WCAG AA >= 4.5:1"	Low
[Exploratory Testing]	[EH-123] Charter: BA override original Req 'no probation' → verify VE is truly eligible end-to-end	"- Actual VE probationary employee logs in
- Test full Bereavement Leave flow"	"Free exploration:
- Login VE
- Verify visibility of 'Bereavement Leave' in dropdown
- Submit form
- Verify manager can approve
- Verify SAP push succeeds with VE flag
- Test edge case: employee whose probation just ended while request is pending"	"Free exploration:
- VE eligibility BA override
- SAP behavior with VE flag
- Edge case when VE transitions to permanent while pending"	"Notes:
- VE eligibility BA override
- Contract status change race
Time-box: 30 minutes"	High	"EH-123
LEAVE_MODULE_SUMMARY.md v1.1"

## Actual Directory Structure

```
robot-base-autotest/
│
├─ .git/                     # Git history
├─ .gitlab-ci.yml           # CI/CD (GitLab)
├─ .vscode/                  # VSCode configuration
├─ DataTest/                 # Test data (CSV, JSON, …)
├─ ExternalSystem/           # Mock / wrapper for external systems
├─ KeywordLibraries/        # Robot Framework keyword libraries
│   ├─ CommonKeyword/        # Shared keywords for Web, API, Mobile
│   │   ├─ ApiCore.resource
│   │   ├─ BrowserCore.resource
│   │   ├─ CommonVariable.resource
│   │   ├─ Utils.resource
│   │   ├─ WebBaseLibraries.resource
│   │   ├─ WebBrowserLibraries.resource
│   │   └─ WebCore.resource
│   ├─ KeyCloak/            # Keywords related to KeyCloak (auth)
│   └─ YourProject/         # Keywords for project business logic (example)
├─ Libs/                     # Supporting Python libraries (helpers, utils)
├─ Projects/                 # Sub-projects / large suites
├─ Report/                   # Test result reports (HTML, XML)
├─ Variables/                # Global variables (URL, credentials, env)
│   └─ *.yaml                # Variable definitions in YAML format
│
├─ .gitignore                # Files/dirs excluded from Git
├─ quick_*.bat               # Convenient batch scripts for quick runs
├─ project.test.js           # Example JavaScript test (optional)
├─ requirements.txt          # Python dependencies
├─ readme.md                # <‑‑ Project documentation (you are reading this)
└─ results/                 # Directory for storing test run results
```

## Environment Requirements

1. **Python 3.9+**
2. **Node.js** (required for Browser/Playwright)
3. **Java 11+** (optional, if using Selenium Java bindings)
4. **Android/iOS SDK** (for Appium)
5. Chrome / Firefox / Edge browser (for Selenium)

## Installation

```bat
:: Clone repository
git clone https://gitlab.id.vin/qc/robot-base-autotest.git
cd robot-base-autotest

:: Create Python virtual environment - Optional - or use default installation
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

:: Install Playwright browsers (only needed if using Browser library)
rfbrowser init   :: downloads Playwright browsers automatically
```

> **Tip**: `requirements.txt` already includes the packages:
> `robotframework`, `robotframework-seleniumlibrary`, `robotframework-browser`, `restinstance`, `robotframework-appiumlibrary`.

## Running Tests

```bat
:: Run the entire suite
robot -d results tests\
```

### Running via IDE (VSCode)
- Instructions at: https://your-company.atlassian.net/wiki/spaces/YOUR_SPACE/pages/Run+Tests+Using+Visual+Studio+Code



## Usage Examples (within `KeywordLibraries/CommonKeyword`)

### SeleniumLibrary

```robot
*** Settings ***
Resource   ../../KeywordLibraries/CommonKeyword/WebCore.resource

*** Test Cases ***
Open Browser And Login
    Open Browser    ${BASE_URL}    Chrome
    Login With Credentials    ${USERNAME}    ${PASSWORD}
    Capture Page Screenshot    ${OUTPUT_DIR}\login.png
```

### Browser (Playwright)

```robot
*** Settings ***
Resource   ../../KeywordLibraries/CommonKeyword/BrowserCore.resource

*** Test Cases ***
Open Playwright Page
    New Browser    headless=False
    New Page    ${BASE_URL}
    Fill Text    input[name="user"]    ${USERNAME}
    Click    button[type="submit"]
    Wait For Elements State    h1.title    visible
```

### RESTinstance (API)

```robot
*** Settings ***
Resource   ../../KeywordLibraries/CommonKeyword/ApiCore.resource

*** Test Cases ***
Get Member Information
    ${member}=    Api PSS Get member by id    12345
    Log    ${member}
```

### AppiumLibrary (Mobile)

#### Prerequisites

```bat
:: Install Appium server
npm install -g appium
appium driver install uiautomator2   :: Android
appium driver install xcuitest       :: iOS

:: Install Python dependencies
pip install robotframework-appiumlibrary

:: Check ADB detects device
adb devices
```

Requirement: **Android SDK** (`ANDROID_HOME` variable) + USB-connected device or running emulator.

#### Capabilities configuration — `Variables/CONFIG_MOBILE.yaml`

Do not hardcode capabilities in tests. Declare everything in the YAML file:

```yaml
# Variables/CONFIG_MOBILE.yaml
APPIUM_URL:     http://localhost:4723/wd/hub
PLATFORM_NAME:  Android                          # or iOS
DEVICE_NAME:    emulator-5554                    # serial from `adb devices`
APP_PACKAGE:    com.example.app
APP_ACTIVITY:   .MainActivity
AUTOMATION_NAME: UiAutomator2                    # or XCUITest for iOS
NO_RESET:       False
```

#### Starting Appium server

```bat
:: Start manually (separate terminal)
appium --base-path /wd/hub

:: Check server is running
curl http://localhost:4723/wd/hub/status
```

The framework also supports auto-starting Appium via `Libs/RobotSTF.py` when using the STF device farm (see STF section below).

#### Test file structure

```robot
*** Settings ***
Library    AppiumLibrary    run_on_failure=AppiumLibrary.Capture Page Screenshot
Library    ../../Libs/ScrollAppMoblie.py
Library    ../../Libs/ScrollIOSMoblie.py
Variables  ../../Variables/CONFIG_MOBILE.yaml

Suite Setup       Open Mobile Application
Suite Teardown    Close All Applications

*** Keywords ***
Open Mobile Application
    Open Application    ${APPIUM_URL}
    ...    platformName=${PLATFORM_NAME}
    ...    deviceName=${DEVICE_NAME}
    ...    appPackage=${APP_PACKAGE}
    ...    appActivity=${APP_ACTIVITY}
    ...    automationName=${AUTOMATION_NAME}
    ...    noReset=${NO_RESET}

*** Test Cases ***
TC001 - Successful Login
    [Tags]    mobile    android    smoke
    Wait Until Element Is Visible    accessibility_id=username-input    timeout=10s
    Input Text    accessibility_id=username-input    ${USERNAME}
    Input Text    accessibility_id=password-input    ${PASSWORD}
    Click Element    accessibility_id=login-button
    Wait Until Element Is Visible    accessibility_id=home-screen    timeout=15s
```

#### Locator priority

| Priority | Locator | Example |
|---|---|---|
| 1 | `accessibility_id` | `accessibility_id=login-button` |
| 2 | `id` | `id=com.example:id/btn_login` |
| 3 | `xpath` | `xpath=//android.widget.Button[@text='Login']` |
| 4 | `class chain` / `predicate string` | iOS only |

#### Running tests

```bat
:: Run 1 mobile suite
robot -d results -v ENV:QC Projects/YourModule/test_YourModule_Mobile.robot

:: Run by tag
robot -d results --include mobile Projects/

:: Run in parallel (multiple devices)
pabot --processes 2 -v ENV:QC --include mobile --outputdir results Projects/
```

#### STF Device Farm (shared within team)

When no local device is available, use `Libs/RobotSTF.py` to lock a device from the farm at `http://<YOUR_STF_HOST>`:

```robot
*** Settings ***
Library    Libs/RobotSTF.py

*** Test Cases ***
Run On STF Device
    ${device}=    Lock Device    requirements={"version":"10"}
    Setup Appium    ${device}
    Open Application    ${appium_remote}
    ...    platformName=Android    appPackage=${APP_PACKAGE}
    ...    appActivity=${APP_ACTIVITY}    automationName=UiAutomator2
    [Teardown]    Release Device    ${device}
```

Set the `STF_TOKEN` environment variable before running:

```bat
set STF_TOKEN=your_token_here
robot -d results Projects/YourModule/test_Mobile.robot
```

#### Mandatory rules

- Use `Wait Until Element Is Visible` — **DO NOT** use `Sleep`
- Scroll using `ScrollAppMoblie.py` (Android) or `ScrollIOSMoblie.py` (iOS)
- Capabilities sourced from `CONFIG_MOBILE.yaml` — **DO NOT** hardcode in tests
- Tag each test case with `mobile` and `android`/`ios`




