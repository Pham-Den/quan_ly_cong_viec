---
name: rf-ui-rule
description: >
  Mandatory rules when generating Robot Framework keywords for UI testing using the
  robotframework-browser (Playwright) library. Applies to all UI web projects.
  Read this file before generating any UI keyword.
---

# Robot Framework — Detailed UI Keyword Rules (Browser/Playwright)

> Must read when generating UI keywords with `robotframework-browser` (Playwright).
> Read alongside `rf-keyword-convention.md` (3-layer overview).

---

## 4-Layer Architecture

```
LowLevelKeywords/UI_PageName.resource         ← single action, no logic
HighLevelKeywords/HighLevel_PageName.resource ← compose Low keywords into 1 business flow
VerificationKeywords/Verify_PageName.resource ← verify state/content only
{ProjectName}General.resource                 ← hub import, test cases use only this file
```

---

## Layer 1 — LowLevel (`UI_PageName.resource`)

### File name
`UI_PageName.resource` — e.g. `UI_EmployeeManagement.resource`, `UI_Login.resource`

### Naming convention
`Verb + Description + on + PageName + Page`

| Verb | When to use |
|---|---|
| `Enter` | Type text into an input/textarea |
| `Click` | Click a button, link, icon, or menu item |
| `Select` | Choose an option in a dropdown/combobox |
| `Check` / `Uncheck` | Checkbox |
| `Upload` | Upload a file |
| `Get` | Retrieve text/attribute for later use |

**Correct examples:**
- `Enter Full Name on Employee Management Page`
- `Click Create Button on Employee Management Page`
- `Select Status on Create Employee Page`

### Mandatory header
```robot
*** Settings ***
Documentation     Description : Keywords for interacting with the [Page Name] page
...
...    Author: {author name}
Resource          ../../CommonKeyword/BrowserCore.resource
```

### Mandatory rules
- Each keyword performs exactly **1 single action** — do not combine 2 actions into 1 keyword
- Use `Browser.` prefix for all browser actions: `Browser.Fill Text`, `Browser.Click`, `Browser.Select Options By`
- **No** IF/FOR, assertions, or calls to other keywords
- **No** `Sleep` — use Wait strategy (see Wait section below)
- **No** result assertions — that is the responsibility of VerificationKeywords

### Full example
```robot
*** Settings ***
Documentation     Description : Keywords for interacting with the Employee Management page
...
...    Author: QA-Team
Resource          ../../CommonKeyword/BrowserCore.resource

*** Keywords ***
# ===== FILTER =====

Enter Ho va ten on Quan Ly Nhan Vien Page
    [Documentation]    Enter full name into the filter field
    ...
    [Arguments]    ${ho_va_ten}
    Browser.Fill Text    [data-autoid='forms-input-table-sales_platform_user-inline-fullName']    ${ho_va_ten}

Click Trang Thai on Quan Ly Nhan Vien Page
    [Documentation]    Click the Status filter dropdown
    ...
    Browser.Click    [data-autoid='forms-select-table-sales_platform_user-inline-status']

Click Trang Thai on Trang Thai dropdown on Quan Ly Nhan Vien Page
    [Documentation]    Select a value in the status filter dropdown
    ...
    [Arguments]    ${trang_thai}
    Browser.Click    //div[@role="listbox"]//div[contains(text(),'${trang_thai}')]

# ===== ACTION BUTTONS =====

Click Button Tao Moi on Quan Ly Nhan Vien Page
    [Documentation]    Click the Create button on the list page
    ...
    Browser.Click    sd-button[title="Tạo mới"]

# ===== CREATE FORM =====

Enter Ho va ten on Tao Moi Nhan Vien Page
    [Documentation]    Enter full name on the create form
    ...
    [Arguments]    ${ho_va_ten}
    Browser.Fill Text    input[placeholder="Họ và tên"]    ${ho_va_ten}

Select Trang Thai value on Tao Moi Nhan Vien Page
    [Documentation]    Select a status in the dropdown on the create form
    ...
    [Arguments]    ${trang_thai}
    Browser.Click    [data-autoid="forms-select-sales_platform_user_status"]
    Browser.Click    role=option[name="${trang_thai}"]

Click Button Luu on Tao Moi Nhan Vien Page
    [Documentation]    Click the Save button on the create form
    ...
    Browser.Click    [data-autoid="button-sales_platform_user_btn_save"]
```

---

## Layer 2 — HighLevel (`HighLevelKeywords_PageName.resource`)

### File name
`HighLevelKeywords_PageName.resource` — e.g. `HighLevelKeywords_EmployeeManagement.resource`

### Naming convention
`Composite_action + on + PageName + Page`

**Correct examples:**
- `Search Employee by Full Name on Employee Management Page`
- `Fill Create Employee Form on Create Employee Page`
- `Select Status on Employee Management Page`

### Mandatory header
```robot
*** Settings ***
Documentation     Description : High-level keywords for the [Page Name] page
...
...    Author: {author name}
Resource    ../../{ProjectName}/LowLevelKeywords/UI_PageName.resource
```

### Mandatory rules
- Compose multiple LowLevel keywords into **1 complete business flow**
- May use IF/FOR to handle conditional logic
- Optional parameters use default values: `${param}=${EMPTY}` or `${param}=${None}`
- Import the correct corresponding LowLevel resource in Settings
- Call `Focus mouse out` after entering data into an input (to trigger blur/validation)
- Call `Wait for networkidle on NSP Page` after an action that requires waiting for an API response

### Full example
```robot
*** Settings ***
Documentation     Description : High-level keywords for the Employee Management page
...
...    Author: QA-Team

Resource    ../../YourProject/LowLevelKeywords/UI_QuanLyNhanVien.resource
Resource    ../LowLevelKeywords/UI_Utils.resource


*** Keywords ***
Search Nhan Vien by Ho va ten on Quan Ly Nhan Vien Page
    [Documentation]    Search for an employee by full name
    ...    Arguments: ${ho_va_ten} — full name to search for
    [Arguments]    ${ho_va_ten}
    Enter Ho va ten on Quan Ly Nhan Vien Page    ${ho_va_ten}
    Focus mouse out
    Wait for networkidle on NSP Page

Select Trang Thai on Quan Ly Nhan Vien Page
    [Documentation]    Select one or more filter statuses. Multiple values separated by commas (,)
    ...    Arguments: ${trang_thai} — e.g. "Hoạt động" or "Hoạt động,Ngừng hoạt động"
    [Arguments]    ${trang_thai}
    Click Trang Thai on Quan Ly Nhan Vien Page
    ${values}    Split String    ${trang_thai}    ,
    FOR    ${item}    IN    @{values}
        ${item_trimmed}    Strip String    ${item}
        Click Trang Thai on Trang Thai dropdown on Quan Ly Nhan Vien Page    ${item_trimmed}
    END
    Focus mouse out
    Wait for networkidle on NSP Page

Fill Form Tao Moi Nhan Vien on Tao Moi Nhan Vien Page
    [Documentation]    Flow to create a new employee: click Create → enter information → Save
    ...    Arguments:
    ...        ${ho_va_ten}     — employee full name
    ...        ${email}         — employee email
    ...        ${so_dien_thoai} — phone number (optional)
    ...        ${trang_thai}    — Active / Inactive (default: Hoạt động)
    [Arguments]    ${ho_va_ten}    ${email}    ${so_dien_thoai}=${EMPTY}    ${trang_thai}=Hoạt động
    Click Button Tao Moi on Quan Ly Nhan Vien Page
    Enter Ho va ten on Tao Moi Nhan Vien Page    ${ho_va_ten}
    Enter Email on Tao Moi Nhan Vien Page    ${email}
    Select Trang Thai value on Tao Moi Nhan Vien Page    ${trang_thai}
    IF    '${so_dien_thoai}' != '${EMPTY}'
        Enter So Dien Thoai on Tao Moi Nhan Vien Page    ${so_dien_thoai}
    END
    Click Button Luu on Tao Moi Nhan Vien Page
```

---

## Layer 3 — VerificationKeywords (`VerificationKeywords_PageName.resource`)

### File name
`VerificationKeywords_PageName.resource` — e.g. `VerificationKeywords_EmployeeManagement.resource`

### Naming convention
`Verify + Description + on + PageName + Page`

**Correct examples:**
- `Verify Employee is displayed on Employee Management Page`
- `Verify Employee Status on Employee Management Page`
- `Verify Error message is displayed on Login Page`

### Mandatory header
```robot
*** Settings ***
Documentation     Description : Keywords for verifying the [Page Name] page
...
...    Author: {author name}
Resource          ../../CommonKeyword/BrowserCore.resource
```
> Import `BrowserCore.resource` — do **NOT** import LowLevel.

### Mandatory rules
- Use `Browser.Wait For Elements State` to verify element **visible/hidden/enabled**
- Use `Browser.Get Text` + `Should Contain` / `Should Be Equal As Strings` to verify **text content**
- **No** IF/FOR or business logic — only verify state and values
- **No** LowLevel resource imports

### Two verify patterns

**Pattern A — Verify element visibility:**
```robot
Browser.Wait For Elements State    <locator>    state=visible    timeout=${TIMEOUT}
Browser.Wait For Elements State    <locator>    state=hidden     timeout=${TIMEOUT}
Browser.Wait For Elements State    <locator>    state=detached   timeout=${TIMEOUT}
```

**Pattern B — Verify text content:**
```robot
${text}    Browser.Get Text    <locator>
Should Contain    ${text}    ${expected_value}
# or:
Should Be Equal As Strings    ${text}    ${expected_value}
```

### Full example
```robot
*** Settings ***
Documentation     Description : Keywords for verifying the Employee Management page
...
...    Author: QA-Team
Resource          ../../CommonKeyword/BrowserCore.resource

*** Keywords ***
# ===== VERIFY LIST PAGE =====

Verify Nhan Vien hien thi on Quan Ly Nhan Vien Page
    [Documentation]    Check that the employee is displayed in the list table by full name
    ...
    [Arguments]    ${ten_nhan_vien}
    Browser.Wait For Elements State    //td//a[contains(text(),'${ten_nhan_vien}')]    state=visible    timeout=${TIMEOUT}

Verify Nhan Vien khong hien thi on Quan Ly Nhan Vien Page
    [Documentation]    Check that the employee is NOT displayed in the list table
    ...
    [Arguments]    ${ten_nhan_vien}
    Browser.Wait For Elements State    //td//a[contains(text(),'${ten_nhan_vien}')]    state=detached    timeout=${TIMEOUT}

Verify Trang Thai Nhan Vien on Quan Ly Nhan Vien Page
    [Documentation]    Check the status of an employee in the table by employee name
    ...
    [Arguments]    ${ten_nhan_vien}    ${trang_thai}
    Browser.Wait For Elements State
    ...    //td//a[contains(text(),'${ten_nhan_vien}')]/ancestor::tr//td[contains(text(),'${trang_thai}')]
    ...    state=visible    timeout=${TIMEOUT}

Verify Table Nhan Vien is loaded on Quan Ly Nhan Vien Page
    [Documentation]    Check that the list table has finished loading (at least 1 data row)
    ...
    Browser.Wait For Elements State    //table//tr[contains(@class,'row')]    state=visible    timeout=${TIMEOUT}

Verify Ket Qua Tim Kiem Empty on Quan Ly Nhan Vien Page
    [Documentation]    Check that the list table is empty (no search results)
    ...
    Browser.Wait For Elements State    text=Không có kết quả phù hợp    state=visible

# ===== VERIFY DETAIL FORM =====

Verify Ho Va Ten on Chi Tiet Nhan Vien Page
    [Documentation]    Check that the full name is displayed correctly on the detail page
    ...
    [Arguments]    ${ho_va_ten}
    Browser.Wait For Elements State    sd-input[autoid="sales_platform_user_full_name"] div.T14M:has-text("${ho_va_ten}")    state=visible

Verify Trang Thai on Chi Tiet Nhan Vien Page
    [Documentation]    Check that the status is displayed correctly on the detail page (using Get Text)
    ...
    [Arguments]    ${trang_thai}
    ${text}    Browser.Get Text    sd-select[autoid="sales_platform_user_status"] >> span.c-badge-title >> nth=0
    Should Be Equal As Strings    ${text}    ${trang_thai}
```

---

## Layer 4 — General Resource (`{ProjectName}General.resource`)

Central hub that imports all HighLevel and Verification resources for the project.

```robot
*** Settings ***
# Auto-generated — add imports when creating a new module
Resource    ../../KeywordLibraries/{ProjectName}/HighLevelKeywords/HighLevelKeywords_Login.resource
Resource    ../../KeywordLibraries/{ProjectName}/HighLevelKeywords/HighLevelKeywords_QuanLyNhanVien.resource
Resource    ../../KeywordLibraries/{ProjectName}/VerificationKeywords/VerificationKeywords_Login.resource
Resource    ../../KeywordLibraries/{ProjectName}/VerificationKeywords/VerificationKeywords_QuanLyNhanVien.resource
```

**Test cases import only one line:**
```robot
Resource    ../../KeywordLibraries/{ProjectName}/{ProjectName}General.resource
```

> When creating a new module, **you must update** the General file — do not let test cases import HighLevel/Verification directly.

---

## Layer 5 — Test Case (`test_ModuleName.robot`)

```robot
*** Settings ***
Resource    ../../KeywordLibraries/{ProjectName}/{ProjectName}General.resource

*** Test Cases ***
NSP-TC-001 Search employee by name successfully
    [Documentation]    Verify that searching for an employee by name displays the correct result
    [Tags]    smoke    regression    quan-ly-nhan-vien
    Search Nhan Vien by Ho va ten on Quan Ly Nhan Vien Page    Nguyen Van A
    Verify Nhan Vien hien thi on Quan Ly Nhan Vien Page    Nguyen Van A

NSP-TC-002 Create new employee successfully
    [Documentation]    Verify that creating a new employee with complete information works correctly
    [Tags]    regression    quan-ly-nhan-vien
    Fill Form Tao Moi Nhan Vien on Tao Moi Nhan Vien Page
    ...    ho_va_ten=Test User Autotest
    ...    email=test.autotest@company.com
    ...    trang_thai=Hoạt động
    Verify Nhan Vien hien thi on Quan Ly Nhan Vien Page    Test User Autotest
    Verify Trang Thai Nhan Vien on Quan Ly Nhan Vien Page    Test User Autotest    Hoạt động
```

---

## Locator Priority

| Priority | Type | Syntax | Notes |
|---|---|---|---|
| 1 | data-autoid | `[data-autoid='element-name']` | Highest priority — most stable |
| 2 | id | `id=element-id` | Use when a fixed id is available |
| 3 | Chain selector | `parent >> child >> nth=0` | Highly recommended — mix multiple types |
| 4 | XPath | `//tag[@attr='value']` | For complex DOM traversal |
| 5 | CSS | `div.class-name` | Standard CSS selector |
| 6 | Text | `text=Content` or `"Content"` | Last resort — brittle when labels change |

### Chain Selector (`>>`) — preferred

```robot
# Get the first input in a table
table[role="table"] >> input >> nth=0

# Parent button of a text node
text=Project name >> .. >> button

# Mix CSS + XPath
css=div.header >> xpath=//button[@type='submit']

# data-autoid chain
[data-autoid='table-list'] >> tbody >> tr >> nth=1 >> td >> nth=2
```

### Strict Mode notes
- **Strict Mode** is **on** by default — if a locator matches multiple elements → FAIL.
- Use `nth=` or a chain selector to isolate the target element.
- Selectors starting with `//` or `..` → automatically treated as XPath.
- Selectors wrapped in `"..."` → automatically treated as Text selectors.
- **Shadow DOM**: `css=` automatically pierces shadow roots (good for Angular/Material).
- **Iframe**: use `>>>` to switch frame: `id=iframe-name >>> css=button`.
- Escape `#` as `\#` when using a CSS ID selector.

---

## Wait Strategy (no Sleep)

| Keyword | When to use |
|---|---|
| `Browser.Wait For Elements State <sel> state=visible timeout=Xs` | Wait for an element to appear |
| `Browser.Wait For Elements State <sel> state=hidden timeout=Xs` | Wait for an element to be hidden |
| `Browser.Wait For Elements State <sel> state=detached timeout=Xs` | Wait for an element to be removed from the DOM |
| `Browser.Wait For Load State networkidle timeout=25s` | Wait for network idle after an action |
| `Wait for networkidle on NSP Page` | After entering data and focusing out (used in HighLevel) |
| `Wait for loading table on NSP Page` | Wait for a data table to finish loading |
| `Focus mouse out` | Click outside to close a dropdown/combobox |

> **Only use Sleep when truly necessary** (e.g. fixed animations with no DOM event).
> If Sleep is used, add a comment explaining why.

---

## New Module Creation Process (6 steps)

1. **Scan the page** — Identify all fields, buttons, dropdowns, tables, and modals on the page
2. **Create LowLevel** — `UI_PageName.resource` — one action keyword per element
3. **Create HighLevel** — `HighLevelKeywords_PageName.resource` — compose Low keywords into business flows
4. **Create Verification** — `VerificationKeywords_PageName.resource` — verify state and content
5. **Update General** — Add HighLevel + Verification imports to `{ProjectName}General.resource`
6. **Create Test Case** — `test_ModuleName.robot` imports General, writes TCs using HighLevel + Verification

---

## Pre-export Checklist

- [ ] LowLevel: each keyword has only 1 action, no IF/FOR, no assertions
- [ ] HighLevel: correct LowLevel imported, calls `Focus mouse out` + wait after actions
- [ ] Verification: uses `Wait For Elements State` (visibility) or `Get Text` (content), no IF/FOR
- [ ] General: HighLevel + Verification imports for the new module have been added
- [ ] Test Case: imports only the General resource, no direct Low/High/Verify imports
- [ ] Locator: priority order `data-autoid` → chain → id → xpath → css → text
- [ ] No Sleep used
- [ ] Documentation + Author header in correct format in every .resource file

---

## Reference Documentation

- RF Browser library docs: https://marketsquare.github.io/robotframework-browser/Browser.html
- Playwright locators: https://playwright.dev/docs/locators
- Playwright other locators: https://playwright.dev/docs/other-locators
