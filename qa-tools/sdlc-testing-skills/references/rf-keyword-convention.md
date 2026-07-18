# Robot Framework — Keyword 3-Layer Rules

> The automate skill reads this file when generating Robot Framework scripts.
> Applies to all projects using `robotframework-browser` (Playwright) as the UI library.

---

## 3-Layer Architecture

```
LowLevelKeywords/     ← smallest single action, no logic
HighLevelKeywords/    ← compose Low keywords into a business flow
VerificationKeywords/ ← verify element/data state only
```

---

## Layer 1 — LowLevel (`UI_PageName.resource`)

**File name:** `UI_PageName.resource`
(e.g. `UI_EmployeeManagement.resource`, `UI_Login.resource`)

**Naming convention:** `Verb + Description + on PageName Page`
- `Enter Full Name on Employee Management Page`
- `Click Status on Employee Management Page`
- `Select Date of Birth on Employee Management Page`

**Mandatory rules:**
- Each keyword performs exactly **1 single action** (Enter, Click, Select, Get Text…)
- Use `Browser.` prefix for all browser actions: `Browser.Fill Text`, `Browser.Click`…
- **No** conditional logic (IF/FOR)
- **No** business assertions
- **No** Sleep — use Wait instead (see Wait section)

**Mandatory header:**
```robot
*** Settings ***
Documentation     Description : Keywords for interacting with the [Page Name] page
...
...    Author: {author name}
Resource          ../../CommonKeyword/BrowserCore.resource
```

**Example:**
```robot
Enter Name on [PageName] Page
    [Documentation]    Enter a name into the name field on the [PageName] page
    ...
    [Arguments]    ${name}
    Browser.Fill Text    [data-autoid='input-ten']    ${name}

Click Save on [PageName] Page
    [Documentation]    Click the Save button on the [PageName] page
    ...
    Browser.Click    [data-autoid='btn-luu']
```

---

## Layer 2 — HighLevel (`HighLevelKeywords_PageName.resource`)

**File name:** `HighLevelKeywords_PageName.resource`

**Naming convention:** `Composite action + on PageName Page`
- `Search Employee by Name on Employee Management Page`
- `Select Status on Employee Management Page`
- `Fill Create Form on Employee Management Page`

**Mandatory rules:**
- Compose multiple LowLevel keywords into **1 complete business flow**
- May use IF/FOR for logic handling
- Optional parameters should have default values where appropriate: `${param}=${EMPTY}`
- Import the corresponding LowLevel resource:

```robot
*** Settings ***
Resource    ../../{ProjectName}/LowLevelKeywords/UI_PageName.resource
```

**Example:**
```robot
Search by Name on [PageName] Page
    [Documentation]    Search by name on the [PageName] page
    ...    Arguments: ${name} — name to search for
    [Arguments]    ${name}
    Enter Name on [PageName] Page    ${name}
    Focus mouse out
    Wait for networkidle on NSP Page
```

---

## Layer 3 — Verification (`VerificationKeywords_PageName.resource`)

**File name:** `VerificationKeywords_PageName.resource`

**Naming convention:** `Verify + Description + on PageName Page`
- `Verify Name is displayed on Employee Management Page`
- `Verify Status is on Employee Management Page`
- `Verify Error message is displayed on Login Page`

**Mandatory rules:**
- Use `Browser.Wait For Elements State` to verify element visible/hidden/enabled (do not use Sleep as a substitute)
- May use `Browser.Get Text` + `Should Contain` / `Should Be Equal As Strings` to assert text content
- **No** conditional business logic (IF/FOR) — only check states and values
- Import `BrowserCore.resource` (do not import LowLevel)

**Mandatory header:**
```robot
*** Settings ***
Documentation     Description : Keywords for verifying the [Page Name] page
...
...    Author: {author name}
...
Resource          ../../CommonKeyword/BrowserCore.resource
```

**Example:**
```robot
Verify Name is displayed on [PageName] Page
    [Documentation]    Check that the name is displayed correctly on the [PageName] page
    ...
    [Arguments]    ${name}
    Browser.Wait For Elements State    //td[contains(text(),'${name}')]    state=visible    timeout=10s

Verify Error message is displayed on [PageName] Page
    [Documentation]    Check that the error message appears
    ...
    [Arguments]    ${error_content}
    Browser.Wait For Elements State    text=${error_content}    state=visible    timeout=5s
```

---

## General Resource File

Each project uses one central hub file that imports all HighLevel and Verification resources:

**File:** `{ProjectName}General.resource`

```robot
*** Settings ***
# Auto-generated — add imports when creating a new module
Resource    ../../KeywordLibraries/{ProjectName}/HighLevelKeywords/HighLevelKeywords_PageName.resource
Resource    ../../KeywordLibraries/{ProjectName}/VerificationKeywords/VerificationKeywords_PageName.resource
```

**Test cases import only one line:**
```robot
Resource    ../../KeywordLibraries/{ProjectName}/{ProjectName}General.resource
```

> When creating a new module, **you must update** the General file so test cases can use it immediately.

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

### Important notes

- **Strict Mode** is **on** by default — if a locator matches multiple elements → FAIL. Use `nth=` or chaining to isolate.
- Selectors starting with `//` or `..` → automatically treated as XPath.
- Selectors wrapped in `"..."` → automatically treated as Text selectors.
- **Shadow DOM**: `css=` automatically pierces shadow roots (good for Angular/Material).
- **Iframe**: use `>>>` to switch frame: `id=iframe-name >>> css=button`.
- Escape `#` as `\#` when using a CSS ID selector.

---

## Wait Strategy (no Sleep)

| Use instead of Sleep | When to use |
|---|---|
| `Browser.Wait For Elements State selector state=visible timeout=Xs` | Wait for an element to appear |
| `Browser.Wait For Elements State selector state=hidden timeout=Xs` | Wait for an element to disappear |
| `Browser.Wait For Load State networkidle timeout=25s` | Wait for network idle after an action |
| `Wait for networkidle on NSP Page` | After entering data and focusing out |
| `Wait for loading table on NSP Page` | Wait for a data table to finish loading |
| `Focus mouse out` | Click outside to close a dropdown/combobox |

> **Only use Sleep when truly necessary** (e.g. fixed animations with no DOM event).
> If Sleep is used, add a comment explaining why.

---

## New Module Creation Process (6 steps)

1. **Scan the page** — Identify all fields, buttons, dropdowns, tables, and modals on the page
2. **Create LowLevel** — `UI_PageName.resource` — one action keyword per element
3. **Create HighLevel** — `HighLevelKeywords_PageName.resource` — compose Low keywords into business flows
4. **Create Verification** — `VerificationKeywords_PageName.resource` — state verification steps
5. **Update General** — Add HighLevel + Verification imports to `{ProjectName}General.resource`
6. **Create Test Case** — `test_ModuleName.robot` imports General, writes TCs using HighLevel + Verification

---

## Reference Documentation

- RF Browser library docs: https://marketsquare.github.io/robotframework-browser/Browser.html
- Playwright locators: https://playwright.dev/docs/locators
- Playwright other locators: https://playwright.dev/docs/other-locators
