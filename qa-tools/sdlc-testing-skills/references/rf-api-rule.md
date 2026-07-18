---
name: rf-api-rule
description: >
  Mandatory rules when generating Robot Framework keywords for API testing from Swagger/OpenAPI.
  Uses the RESTinstance library (Library REST). Applies to all API testing projects.
  Read this file before generating any API keyword.
---

# Robot Framework — Detailed API Keyword Rules (RESTinstance from Swagger)

> Must read when generating API keywords with the `REST` (RESTinstance) library.
> Applies to projects using Swagger/OpenAPI as the keyword generation source.

---

## 4-Layer Architecture

```
LowLevelKeywords/Api_ModuleName.resource         ← wrapper for 1 API endpoint
HighLevelKeywords/Api_ModuleName_High.resource   ← Payload Builder + Flow
VerificationKeywords/Verify_Api_ModuleName.resource ← assert response
{ProjectName}General-API.resource               ← hub import
```

---

## Layer 1 — LowLevel API (`Api_ModuleName.resource`)

### File name
`Api_ModuleName.resource` — e.g. `Api_EmployeeManagement.resource`, `Api_Project.resource`

### Naming convention
`Api {METHOD} {path-segments}`

Convert path `/api/v1/users/{user_id}` to keyword name: `Api PUT v1 users user-id`

| Example path | Keyword name |
|---|---|
| `POST /api/v1/users/search` | `Api POST v1 users search` |
| `POST /api/v1/users` | `Api POST v1 users` |
| `GET /api/v1/users/{id}` | `Api GET v1 users user-id` |
| `PUT /api/v1/users/{id}` | `Api PUT v1 users user-id` |
| `DELETE /api/v1/users/{id}` | `Api DELETE v1 users user-id` |

### Mandatory header
```robot
*** Settings ***
Resource    ../../CommonKeyword/ApiCore.resource
```

### Mandatory rules

**Authorization header — hardcode directly, do NOT pass as a `${headers}` argument:**
```robot
# CORRECT:
METHOD POST    ${BASE_URL}/api/v1/users    SET_HEADERS={"authorization":"Bearer ${nsp_token}"}

# WRONG — do not pass ${headers} as an argument:
Api POST v1 users
    [Arguments]    ${body}    ${headers}
    METHOD POST    ${BASE_URL}/api/v1/users    SET_HEADERS=${headers}    SET_BODY=${body}
```

**Body — always received via `${body}` argument:**
```robot
Api POST v1 users
    [Arguments]    ${body}
    METHOD POST    ${BASE_URL}/api/v1/users    SET_HEADERS={"authorization":"Bearer ${nsp_token}"}
    ...    SET_BODY=${body}
```

**Path parameter — received via a dedicated argument:**
```robot
Api GET v1 users user-id
    [Arguments]    ${user_id}
    METHOD GET    ${BASE_URL}/api/v1/users/${user_id}    SET_HEADERS={"authorization":"Bearer ${nsp_token}"}
```

### Full example
```robot
*** Settings ***
Resource    ../../CommonKeyword/ApiCore.resource

*** Keywords ***
Api POST v1 users search
    [Arguments]    ${body}
    [Documentation]    API to search the list of users — POST /api/v1/users/search
    ...    Arguments: ${body} — filter body
    ...
    METHOD POST    ${API_BASE_URL}/api/v1/users/search    SET_HEADERS={"authorization":"Bearer ${nsp_token}"}
    ...    SET_BODY=${body}

Api POST v1 users
    [Arguments]    ${body}
    [Documentation]    API to create a new user — POST /api/v1/users
    ...    Arguments: ${body} — user creation body
    ...
    METHOD POST    ${API_BASE_URL}/api/v1/users    SET_HEADERS={"authorization":"Bearer ${nsp_token}"}
    ...    SET_BODY=${body}

Api GET v1 users user-id
    [Arguments]    ${user_id}
    [Documentation]    API to get user details — GET /api/v1/users/{user_id}
    ...    Arguments: ${user_id} — user ID
    ...
    METHOD GET    ${API_BASE_URL}/api/v1/users/${user_id}    SET_HEADERS={"authorization":"Bearer ${nsp_token}"}

Api PUT v1 users user-id
    [Arguments]    ${user_id}    ${body}
    [Documentation]    API to update a user — PUT /api/v1/users/{user_id}
    ...    Arguments: ${user_id} — user ID
    ...    ${body} — update body
    ...
    METHOD PUT    ${API_BASE_URL}/api/v1/users/${user_id}    SET_HEADERS={"authorization":"Bearer ${nsp_token}"}
    ...    SET_BODY=${body}

Api DELETE v1 users user-id
    [Arguments]    ${user_id}
    [Documentation]    API to delete a user — DELETE /api/v1/users/{user_id}
    ...    Arguments: ${user_id} — user ID
    ...
    METHOD DELETE    ${API_BASE_URL}/api/v1/users/${user_id}    SET_HEADERS={"authorization":"Bearer ${nsp_token}"}
```

---

## Layer 2 — HighLevel API (`Api_ModuleName_High.resource`)

HighLevel contains **2 keyword groups** in the same file:
1. **Payload Builder** — builds a dynamic body using `Create Dictionary`, returns `${body}` via `RETURN`
2. **Flow** — calls Payload Builder + LowLevel API to execute a business flow

### File name
`Api_ModuleName_High.resource` — e.g. `Api_EmployeeManagement_High.resource`

### Mandatory header
```robot
*** Settings ***
Resource    ../../../KeywordLibraries/{ProjectName}-API/LowLevelKeywords/Api_ModuleName.resource
```

### Payload Builder rules

**Naming:** `Create Payload {EndpointName} {PayloadType}`
- `Create Payload Users Create`
- `Create Payload Users Search`
- `Create Payload Project Update`

**Mandatory rules:**
- Use `Create Dictionary` — do **NOT** use `Library Collections` separately
- Optional parameters use `${EMPTY}` or `${None}` as default
- Optional fields → use IF to set only when a value is present
- End with `RETURN    ${body}` — do **NOT** assign to `${RESPONSE}`
- Do **NOT** call an API endpoint inside a Payload Builder

```robot
Create Payload Users Create
    [Documentation]    Build dynamic body for POST /api/v1/users
    [Arguments]    ${fullName}    ${email}    ${status}=ACTIVE    ${phoneNumber}=${None}
    &{body}    Create Dictionary
    ...    fullName=${fullName}
    ...    email=${email}
    ...    status=${status}
    IF    '${phoneNumber}' != '${None}' and '${phoneNumber}' != ''
        Set To Dictionary    ${body}    phoneNumber=${phoneNumber}
    END
    RETURN    ${body}
```

### Flow keyword rules

**Naming:** `Api {action} {ModuleName} by {actor}` or `Api {action} {ModuleName}`
- `Api create user by admin`
- `Api search users by filter`
- `Api get user detail`

**Mandatory rules:**
- Call Payload Builder first to get `${body}`
- Pass `${body}` to the LowLevel API keyword
- Do **NOT** assign the response — it is set automatically by `ApiCore.resource` via SET_VARIABLE

```robot
Api create user
    [Documentation]    Flow to create a new user
    [Arguments]    ${fullName}    ${email}    ${status}=ACTIVE    ${phoneNumber}=${None}
    ${body}    Create Payload Users Create
    ...    fullName=${fullName}    email=${email}
    ...    status=${status}    phoneNumber=${phoneNumber}
    Api POST v1 users    ${body}
```

### Full example
```robot
*** Settings ***
Resource    ../../../KeywordLibraries/YourProject-API/LowLevelKeywords/Api_QuanLyNhanVien.resource

*** Keywords ***
# ===== FLOW KEYWORDS =====

Api search users by filter
    [Documentation]    Flow to search users by filter
    [Arguments]    ${fullName}=${None}    ${email}=${None}    ${status}=${None}    ${page}=0    ${pageSize}=20
    ${body}    Create Payload Users Search
    ...    fullName=${fullName}    email=${email}    status=${status}
    ...    page=${page}    pageSize=${pageSize}
    Api POST v1 users search    ${body}

Api create user
    [Documentation]    Flow to create a new user
    [Arguments]    ${fullName}    ${email}    ${status}=ACTIVE    ${phoneNumber}=${None}
    ${body}    Create Payload Users Create
    ...    fullName=${fullName}    email=${email}    status=${status}    phoneNumber=${phoneNumber}
    Api POST v1 users    ${body}

Api update user
    [Documentation]    Flow to update user information
    [Arguments]    ${user_id}    ${fullName}=${None}    ${status}=${None}
    ${body}    Create Payload Users Update    fullName=${fullName}    status=${status}
    Api PUT v1 users user-id    ${user_id}    ${body}

# ===== PAYLOAD BUILDER KEYWORDS =====

Create Payload Users Search
    [Documentation]    Build dynamic body for POST /api/v1/users/search
    [Arguments]    ${fullName}=${None}    ${email}=${None}    ${status}=${None}
    ...    ${page}=0    ${pageSize}=20    ${sortField}=createdAt    ${sortDirection}=DESC
    ${filters}    Create List
    IF    '${fullName}' != '${None}' and '${fullName}' != ''
        ${f}    Create Dictionary    fieldName=fullName    condition=CONTAINS    data=${fullName}
        Append To List    ${filters}    ${f}
    END
    IF    '${email}' != '${None}' and '${email}' != ''
        ${f}    Create Dictionary    fieldName=email    condition=CONTAINS    data=${email}
        Append To List    ${filters}    ${f}
    END
    IF    '${status}' != '${None}' and '${status}' != ''
        ${f}    Create Dictionary    fieldName=status    condition=IN    data=['${status}']
        Append To List    ${filters}    ${f}
    END
    ${sorts}    Create List
    ${sort}    Create Dictionary    fieldName=${sortField}    direction=${sortDirection}
    Append To List    ${sorts}    ${sort}
    &{body}    Create Dictionary
    ...    filters=${filters}
    ...    sorts=${sorts}
    ...    page=${page}
    ...    pageSize=${pageSize}
    RETURN    ${body}

Create Payload Users Create
    [Documentation]    Build dynamic body for POST /api/v1/users
    [Arguments]    ${fullName}    ${email}    ${status}=ACTIVE    ${phoneNumber}=${None}
    &{body}    Create Dictionary
    ...    fullName=${fullName}
    ...    email=${email}
    ...    status=${status}
    IF    '${phoneNumber}' != '${None}' and '${phoneNumber}' != ''
        Set To Dictionary    ${body}    phoneNumber=${phoneNumber}
    END
    RETURN    ${body}

Create Payload Users Update
    [Documentation]    Build dynamic body for PUT /api/v1/users/{id}
    [Arguments]    ${fullName}=${None}    ${status}=${None}
    &{body}    Create Dictionary
    IF    '${fullName}' != '${None}' and '${fullName}' != ''
        Set To Dictionary    ${body}    fullName=${fullName}
    END
    IF    '${status}' != '${None}' and '${status}' != ''
        Set To Dictionary    ${body}    status=${status}
    END
    RETURN    ${body}
```

---

## Layer 3 — VerificationKeywords API (`Verify_Api_ModuleName.resource`)

### File name
`VerificationKeywords_ModuleName.resource` (same as UI) or `Verify_Api_ModuleName.resource`

### Mandatory header
```robot
*** Settings ***
Resource    ../../CommonKeyword/ApiCore.resource
```

### Mandatory rules
- Use `REST.Output` with JSONPath to extract values from the response
- Use `Should Be Equal` / `Should Contain` / `Should Be Equal As Integers` to assert
- Group related assertions into one keyword by context (do not split too granularly)
- Do **NOT** call an API endpoint inside a Verification keyword

### Assertion patterns

**Verify HTTP status code:**
```robot
Output    response status
Integer    response status    200
# or:
Integer    response status    201
```

**Verify a field in the response body:**
```robot
${username}    REST.Output    $.data.username
Should Be Equal    ${username}    ${expected_email}    ignore_case=${TRUE}

${status}    REST.Output    $.data.status
Should Be Equal As Strings    ${status}    ACTIVE
```

**Verify an array in the response:**
```robot
${count}    REST.Output    $.data.totalElements
Should Be True    ${count} > 0

${items}    REST.Output    $.data.content
Should Not Be Empty    ${items}
```

### Full example
```robot
*** Settings ***
Resource    ../../CommonKeyword/ApiCore.resource

*** Keywords ***
Verify api create user response is success
    [Documentation]    Check that the create user response is successful: status 201, username present
    ...
    [Arguments]    ${email}
    Integer    response status    201
    ${username}    REST.Output    $.data.username
    Should Be Equal    ${username}    ${email}    ignore_case=${TRUE}
    ...    msg=Username in response does not match email

Verify api search users has results
    [Documentation]    Check that the search response returns at least 1 result
    ...
    Integer    response status    200
    ${total}    REST.Output    $.data.totalElements
    Should Be True    ${total} > 0    msg=Search returned no results

Verify api get user detail
    [Documentation]    Check that the user detail response contains the correct information
    ...
    [Arguments]    ${expected_email}    ${expected_status}
    Integer    response status    200
    ${email}    REST.Output    $.data.email
    Should Be Equal As Strings    ${email}    ${expected_email}
    ${status}    REST.Output    $.data.status
    Should Be Equal As Strings    ${status}    ${expected_status}

Verify api response status
    [Documentation]    Check the HTTP status code of the response
    ...
    [Arguments]    ${expected_status_code}
    Integer    response status    ${expected_status_code}

Verify api error message contains
    [Documentation]    Check that the error response contains the expected message
    ...
    [Arguments]    ${expected_message}
    ${message}    REST.Output    $.message
    Should Contain    ${message}    ${expected_message}
```

---

## Layer 4 — General Resource API (`{ProjectName}General-API.resource`)

```robot
*** Settings ***
Resource    ../../KeywordLibraries/KeyCloak/Api_KeyCloak_Token.resource
Resource    ../../KeywordLibraries/{ProjectName}-API/HighLevelKeywords/Api_QuanLyNhanVien_High.resource
Resource    ../../KeywordLibraries/{ProjectName}-API/HighLevelKeywords/Api_DuAn_High.resource
Resource    ../../KeywordLibraries/{ProjectName}-API/VerificationKeywords/VerificationKeywords_QuanLyNhanVien.resource
Resource    ../../KeywordLibraries/{ProjectName}-API/VerificationKeywords/VerificationKeywords_DuAn.resource
```

**API test cases import only one line:**
```robot
Resource    ../../KeywordLibraries/{ProjectName}/{ProjectName}General-API.resource
```

---

## Test Case API (`test_Api_ModuleName.robot`)

### Generated from Swagger — organisation principles
- Each `.robot` file corresponds to 1 **controller/tag** in Swagger
- Each `Test Case` corresponds to 1 test scenario (happy path / error path)
- Import only the General-API resource — do not import High/Low/Verify directly

### Full example
```robot
*** Settings ***

Resource    ../../KeywordLibraries/YourProject-API/YourProjectGeneral-API.resource

*** Test Cases ***
API-TC-001 Create new user successfully
    [Documentation]    POST /api/v1/users — create a new user with all valid information
    [Tags]    smoke    api    users    happy-path
    Api create user
    ...    fullName=Test User Autotest
    ...    email=test.auto@company.com
    ...    status=ACTIVE
    Verify api create user response is success    test.auto@company.com
    [Teardown]    Api DELETE v1 users user-id    ${RESPONSE_USER_ID}

API-TC-002 Search user by name
    [Documentation]    POST /api/v1/users/search — search by fullName with results
    [Tags]    regression    api    users
    Api search users by filter    fullName=Test User
    Verify api search users has results

API-TC-003 Create user missing email returns 400
    [Documentation]    POST /api/v1/users — missing required email → 400 Bad Request
    [Tags]    regression    api    users    negative
    Api POST v1 users    ${{{"fullName": "Missing Email User"}}}
    Verify api response status    400

API-TC-004 Get user detail by ID
    [Documentation]    GET /api/v1/users/{id} — get details of a previously created user
    [Tags]    regression    api    users
    Api get user detail    ${EXISTING_USER_ID}
    Verify api get user detail    expected_email=existing@company.com    expected_status=ACTIVE
```

---

## API Script Generation Process from Swagger (5 steps)

1. **Read Swagger** — Identify controller/tag, endpoints, request schema, response schema
2. **Create LowLevel** — 1 keyword per endpoint, hardcode authorization header, receive `${body}` via argument
3. **Create HighLevel** — Payload Builder for each complex endpoint, Flow keyword for each business scenario
4. **Create Verification** — Group assertions by response context
5. **Update General-API + Create Test Case** — Ensure all imports are present, 1 .robot file per controller

---

## Pre-export Checklist

- [ ] LowLevel: authorization hardcoded in the METHOD call, no `${headers}` argument
- [ ] LowLevel: naming follows `Api {METHOD} {path-segments}`
- [ ] Payload Builder: uses `Create Dictionary` + `RETURN`, does not assign response
- [ ] Payload Builder: optional fields use IF + `Set To Dictionary`
- [ ] Flow keyword: calls Payload Builder first, does not call METHOD directly
- [ ] Verification: uses `REST.Output` + JSONPath, assertions grouped logically
- [ ] General-API: HighLevel + Verification + KeyCloak all imported
- [ ] Test Case: imports only the General-API resource
- [ ] No secrets/tokens hardcoded in test cases or keywords — use `${nsp_token}` from env

---

## Reference Documentation

- RESTinstance library docs: https://asyrjasalo.github.io/RESTinstance/
- JSONPath syntax: https://goessner.net/articles/JsonPath/
- Swagger/OpenAPI: https://swagger.io/specification/
