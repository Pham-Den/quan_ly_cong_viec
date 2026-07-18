# CHANGELOG — QA Skill Suite v2.1.0

**Release date:** 2026-05-19  
**Previous version:** v2.0.0  
**Type:** Minor — backward-compatible enhancements

---

## Summary of changes

| # | Changed file | Type | Short description |
|---|---|---|---|
| 1 | `skills/qa-core/05-gen-tc-functional/gen-tc-functional.md` | Enhancement | Added Step 7: Mandatory self-review before exporting TSV |
| 2 | `skills/qa-core/07-review-tc/review-tc.md` | Rewrite | Inlined all rules, added Priority/Auto/ET checks |
| 3 | `skills/qa-core/08-gen-data-test/gen-data-test.md` | Enhancement | Added Format B (flat all-in-one TSV, 1 row/TC) |
| 4 | `references/rf-keyword-convention.md` | Fix | Clarified that VerificationKeywords may use Get Text + Should Contain |
| 5 | `skills/qa-automation/02-gen-script-test/gen-script-test.md` | Fix | Fixed typo `Playwirght` → `Playwright` |
| 6 | `QUICKSTART.md` | Fix | Fixed governance table: Skill 07 is L2 (not L1) |
| 7 | `references/rf-ui-rule.md` | New | Detailed UI keyword rules: 4-layer, locator, wait, QuanLyNhanVien example |
| 8 | `references/rf-api-rule.md` | New | Detailed API keyword rules: LowLevel/Payload Builder/Flow/Verification from Swagger |

---

## Detailed changes

---

### 1. Skill 05 — Gen TC Functional: Mandatory Step 7 Self-review

**Reason for update:**  
Previously, skill 05 only had coverage review (R1/R2/R3) but no step to scan individual TC quality before exporting. As a result, TSV files could still contain format errors (Priority P1/P2/P3, vague Expected results, missing ET rows) even after passing R3.

**Changes:**  
Added **Step 7 — Mandatory quality self-review** immediately before Step 8 (save file). The AI must scan the entire TSV file against 8 criteria:

| Criterion | Action on fail |
|---|---|
| Priority uses `High`/`Medium`/`Low` (not P1/P2/P3) | Reformat |
| Priority = `High` → Smoke = `Y` | Fix or downgrade Priority |
| Auto ≥80% across file; Auto=N has reason in Trace | Reset to Y or document reason |
| Expected result is not vague | Rewrite with specifics |
| Trace maps to an existing Rule ID | Add or correct |
| Test Data does not use placeholders | Fill in real values |
| Teardown is not `-` if TC creates/modifies/deletes data | Add teardown |
| ≥2 ET rows at end of file, STT as consecutive integers | Add if missing |

**Required output of Step 7:**  
The AI must state: "Fixed N TCs: [issue]" or "Self-review: OK — no violations found".

**How to use:**  
No additional action needed — Step 7 runs automatically before the AI saves the TSV file. To request the AI to re-review an existing file, say:
> "Self-review this TC file according to Step 7 of skill 05"

---

### 2. Skill 07 — Review TC: Full rewrite + 4 new checks

**Reason for update:**  
The old version used a compact format (22 lines, referencing a detail file). It was missing 4 important quality checks: Priority format, Smoke consistency, Auto ≥80%, ET rows.

**Changes:**
- Inlined all rules into 1 file — no need to read a separate detail file
- Added 4 quality criteria in Step 4 (Quality Check):

| New criterion | Flag on fail |
|---|---|
| Priority uses `High`/`Medium`/`Low` — not P1/P2/P3 | `TC-XXX: Priority wrong format` |
| Priority=High → Smoke=Y | `TC-XXX: Priority=High but Smoke=N` |
| Auto ≥80% across file; Auto=N has reason in Trace | `TC-XXX: Auto=N with no reason` |
| ET rows ≥2 at end of file, STT as consecutive integers | `File missing ET rows or ET STT wrong format` |

- Added 4 corresponding items to the Review Gate checklist (12 items total)

**Review Gate verdict:**
- `Approved` when 100% pass (12/12 items)
- `Not Approved` + list of failed items when any item fails

**How to use:**  
Trigger unchanged: "Review testcase" / "coverage analysis" still routes correctly to skill 07. Output adds 4 new columns in the Quality Check table.

---

### 3. Skill 08 — Gen Test Data: Added Format B (flat all-in-one)

**Reason for update:**  
The old format (6 columns: TC_ID | Dataset_ID | Test_Data | Type | Teardown | Notes) suits BVA/EP with many variants. However, for happy path TCs (single data set), especially when using API automation, this format scatters data and makes it hard to review.

**Changes:**  
Added **Format B — flat all-in-one**:
- 1 row per TC, each field as a separate column
- JSON payload, container image, API payload inline in the corresponding cell
- No Dataset_ID needed (no variants)

**When to use Format B:**
- TC is a happy path, no BVA/EP variations needed
- Team uses TSV as the sole source for review + execution (no separate YAML)
- Complex payloads (JSON flow, container spec) need to be inline to avoid managing multiple files

**Format B example:**
```
TC_ID	TC_Summary	Role	Account_Email	Entity_ID	Agent_Name	Agent_Type	Flow_JSON	Expected_HTTP	Expected_Status	Teardown
TC-001	Publish low-code agent	developer	dev@test.keystone.ai	ent-001	fr01-agent	low-code	{"flow_name":"..."}	-	Deployed	DELETE agent via API
```

**Format A remains the default** — Format B is only used when there is a specific reason.

---

### 4. rf-keyword-convention.md — Clarified VerificationKeywords

**Previous issue:**  
The sentence "Only use `Browser.Wait For Elements State` to verify element visible/hidden/enabled" was misread as meaning VerificationKeywords could only use Wait For Elements State, when in practice Get Text + Should Contain are also needed to verify content.

**Changes:**  
Clarified the VerificationKeywords layer rules:
- `Browser.Wait For Elements State` — used to check visibility/enabled state
- `Browser.Get Text` + `Should Contain` / `Should Be Equal As Strings` — used to verify text content
- No IF/FOR in the Verification layer
- No action keywords (Click, Fill) in the Verification layer

---

### 7. rf-ui-rule.md — Detailed UI keyword rules (new)

**Reason for addition:**  
`rf-keyword-convention.md` only provides a 3-layer overview. When the AI generates UI keywords, it still lacks specific rules on: how to write VerificationKeywords with Get Text, locator priority in Strict Mode, complete per-layer examples, and patterns for creating new modules.

**Content:**  
File `references/rf-ui-rule.md` includes:
- **4-layer architecture** — LowLevel / HighLevel / VerificationKeywords / General
- **Per-layer rules** — naming convention, required header, forbidden patterns
- **Locator priority table** — data-autoid > id > chain (`>>`) > XPath > CSS > text
- **Strict Mode notes** — nth=, chain selector to isolate elements
- **Wait strategy** — replace Sleep with `Browser.Wait For Elements State`
- **Complete examples** — QuanLyNhanVien module (filter, create, verify list, verify detail)
- **Pre-export checklist** — 8 criteria the AI must check before submitting keywords

**When the AI reads this:**  
When generating UI automation scripts with `robotframework-browser` (Playwright). INDEX.md has been updated to route correctly.

---

### 8. rf-api-rule.md — Detailed API keyword rules (new)

**Reason for addition:**  
Previously there was no specific rules document for API testing with RESTinstance. The AI often invented inconsistent structures — especially regarding: authorization headers, Payload Builder pattern, and how to organize Flow vs Payload Builder within the same file.

**Content:**  
File `references/rf-api-rule.md` includes:
- **4-layer architecture** — LowLevel (Api_Module.resource) / HighLevel (Payload Builder + Flow) / Verification / General-API
- **LowLevel rules** — naming `Api {METHOD} {path}`, hardcode authorization header, do not use `${headers}` argument
- **Payload Builder rules** — use `Create Dictionary` + `RETURN`, no `Library Collections`, optional fields via IF + `Set To Dictionary`
- **Flow keyword rules** — call Payload Builder first, do not assign response
- **Verification rules** — `REST.Output` + JSONPath, group assertions by context
- **Generate from Swagger** — 1 .robot file per controller/tag, import General-API only
- **Complete examples** — QuanLyNhanVien API module (search, create, update, verify)
- **Pre-export checklist** — 8 criteria the AI must check

**When the AI reads this:**  
When generating API automation scripts with RESTinstance from Swagger. INDEX.md has been updated to route correctly.

---

### 5–6. Minor bugfixes

**Typo:** `Playwirght` → `Playwright` in the description of gen-script-test.md

**QUICKSTART.md Section 7:**  
Changed from "Skills 01-08 require no approval" to:
- L1 (no approval needed): Skills 01-06, 08
- L2 (QA Lead): Skill 07, 09-11, qa-automation/02, qa-specialist
- L3 (Stakeholder/PM): Skills 12-14

---

## Upgrade guide from v2.0 → v2.1

1. **No breaking changes** — all skill trigger keywords remain unchanged
2. **Existing TC files**: no changes needed — new rules only apply when generating or reviewing new TCs
3. **Existing test data**: Format A remains valid — Format B is an additional option
4. **rf-keyword-convention**: Existing RF scripts are unaffected — the rule is a clarification only, no behavior change
5. **rf-ui-rule.md / rf-api-rule.md**: Two new files added to `references/`. The AI reads them automatically when generating UI/API scripts. No manual action required.

---

## Compatibility

| Component | v2.0 | v2.1 |
|---|---|---|
| Skills qa-core 01-04, 06, 09-14 | ✅ | ✅ (unchanged) |
| Skill 05 gen-tc-functional | ✅ | ✅+ Step 7 |
| Skill 07 review-tc | ✅ | ✅+ 4 new criteria |
| Skill 08 gen-data-test | ✅ | ✅+ Format B |
| qa-automation 01-02 | ✅ | ✅ (fix typo only) |
| qa-specialist 01-03 | ✅ | ✅ (unchanged) |
| RF keyword convention | ✅ | ✅ (clarification only) |
| rf-ui-rule.md (UI keyword rules) | — | ✅ New |
| rf-api-rule.md (API keyword rules) | — | ✅ New |
| testing-output/ data format | ✅ | ✅ (backward compat) |

---

## Tool Integration guide

The skill suite integrates natively with 3 external systems: **Confluence**, **Jira**, **QMetry**. All commands are run from the skill suite root directory. Credentials must be set up first — see the Setup section below.

### Setup credentials (required before using any tool)

Create a `.env` file in the root directory (do not commit — already in `.gitignore`):

```bash
ATLASSIAN_EMAIL=your@email.com
ATLASSIAN_API_TOKEN=your_atlassian_api_token
ATLASSIAN_BASE_URL=https://your-domain.atlassian.net/
CONFLUENCE_SPACE_KEY=FDP
JIRA_PROJECT_KEY=FDP
```

Get an API token at: `https://id.atlassian.com/manage-profile/security/api-tokens`

Install Python dependencies:
```bash
pip install requests markdown beautifulsoup4 python-docx python-dotenv markdownify
```

---

### Confluence Integration

**Main script:** `tools/confluence_md.py`

#### Push a Markdown file to Confluence

```bash
# Push 1 .md file (automatically creates or updates the page)
python tools/confluence_md.py \
  --file testing-output/test-plan/Sprint_Test_Plan_S1.md \
  --parent-id <PARENT_PAGE_ID>

# Push to a specific page ID (use when page_id is already known)
python tools/confluence_md.py \
  --file testing-output/test-plan/Sprint_Test_Plan_S1.md \
  --page-id <PAGE_ID>
```

#### Push an entire folder to Confluence

```bash
# Push all files in a folder (non-recursive)
python tools/confluence_push_folder.py \
  --folder testing-output/test-plan \
  --parent-id <PARENT_PAGE_ID>

# Dry run — check before actually pushing
python tools/confluence_push_folder.py \
  --folder testing-output \
  --parent-id <PARENT_PAGE_ID> \
  --recursive --dry-run

# Actual recursive push
python tools/confluence_push_folder.py \
  --folder testing-output \
  --parent-id <PARENT_PAGE_ID> \
  --recursive
```

#### Fetch a page from Confluence to local

```bash
# Fetch 1 page → saves .md + .json sidebar (sidebar contains page_id for future push-back)
python tools/confluence_fetch_page.py \
  --url "https://your-domain.atlassian.net/wiki/spaces/FDP/pages/<PAGE_ID>/..." \
  --out docs/confluence/pages

# Sync an entire space/subtree to local
python tools/confluence_sync_space.py \
  --space-key FDP \
  --parent-id <PARENT_PAGE_ID>

# Fetch a page with images (uses OCR to extract text from images)
python tools/confluence_fetch_with_ocr.py \
  --url "https://your-domain.atlassian.net/wiki/spaces/FDP/pages/<PAGE_ID>/..."
```

**Important notes:**
- The `.json` file generated alongside `.md` (sidebar) contains `page_id` — **do not delete** — it is needed to push back later
- The script tries API v2 first, falls back to v1 if it encounters a 404
- Only push after governance approval (skill 07+ requires L2, skill 12–14 requires L3)

**Artifacts commonly pushed to Confluence:**

| Artifact | Trigger skill | Typical command |
|---|---|---|
| Master Test Plan | Skill 02 | `--file testing-output/test-plan/Test_Plan_*.md --parent-id <id>` |
| Sprint Test Plan | Skill 03 | `--file testing-output/test-plan/Sprint_Test_Plan_*.md --parent-id <id>` |
| Sprint Report | Skill 10 | `--file testing-output/reports/sprint/sprint-report-*.md --parent-id <id>` |
| HLTC | Skill 04 | `--file testing-output/test-cases/hltc/hltc-*.md --parent-id <id>` |
| Daily Report | Skill 09 | `--file testing-output/reports/daily/daily-report-*.md --parent-id <id>` |

---

### Jira Integration

**Main scripts:** `tools/jira_sync.py`, `tools/jira_create_subtask.py`, `tools/jira_update_issue.py`

#### Sync Jira to local

```bash
# Pull all project issues to local cache (docs/jira/)
python tools/jira_sync.py --project FDP
```

Use when: the AI needs to read ticket context without manually pasting content.  
Output: `docs/jira/issues/<ISSUE_KEY>.md` + `.json`

#### Create a subtask

```bash
# Create a subtask under a parent issue
python tools/jira_create_subtask.py \
  --parent FDP-1059 \
  --summary "Viết TC cho FR-01 Register Agent"
```

Use when: breaking down QA work into sprint subtasks.

#### Update an issue

```bash
# Change status
python tools/jira_update_issue.py --issue FDP-1059 --status "In Progress"

# Update multiple fields at once (see --help for available flags)
python tools/jira_update_issue.py --issue FDP-1059 --status "Done" --assignee "qa-member"
```

**Typical Jira workflow in a sprint:**
```
Sprint start: jira_sync.py → AI reads tickets → Skill 03 (Sprint Plan)
During sprint: jira_update_issue.py → update TC/bug status
Sprint end: Skill 10 (Sprint Report) → push to Confluence
```

---

### QMetry Integration

**Main scripts:** `tools/qmetry_import.ps1` (Windows), `tools/qmetry_bulk_status.py`, `tools/qmetry_update_status.py`

#### Setup QMetry config

```bash
# Copy sample config and fill in project information
cp tools/qmetry-config.sample.json tools/qmetry-config.json
```

Content to fill in `tools/qmetry-config.json`:
```json
{
  "base_url": "https://your-domain.atlassian.net",
  "api_token": "your_qmetry_api_token",
  "project_key": "FDP",
  "test_cycle_name": "Sprint 1"
}
```

#### Import test case TSV to QMetry

```powershell
# Windows PowerShell — import TSV file (standard 15-column) to QMetry
powershell -ExecutionPolicy Bypass -File tools/qmetry_import.ps1 `
  -TsvFile testing-output/test-cases/functional/tc-fr01-register-deploy-agent-s1.tsv `
  -ConfigFile tools/qmetry-config.json
```

Use immediately after completing skill 05 or 07 (once TCs are Approved).

#### Bulk status update

```bash
# Update multiple TCs in 1 cycle at once (from test results file)
python tools/qmetry_bulk_status.py \
  --cycle "Sprint 1" \
  --file testing-output/reports/daily/results-2026-05-19.tsv

# Update by specific TC list (key:id pairs)
python tools/qmetry_bulk_status.py \
  --cycle "Sprint 1" \
  --tcs "KST-TC-001:123,KST-TC-002:124" \
  --status Pass
```

#### Update status for a single TC

```bash
python tools/qmetry_update_status.py \
  --cycle "Sprint 1" \
  --tc-key KST-TC-001 \
  --tc-id 123 \
  --status Pass
```

**Valid statuses:** `Pass` / `Fail` / `Blocked` / `Not Run`

**Typical QMetry workflow in a sprint:**

```
Skill 05/06 → export TSV → qmetry_import.ps1 (import TCs to QMetry)
           ↓
Manual/automated execution
           ↓
Skill 09 (daily check) → qmetry_bulk_status.py (update Pass/Fail)
           ↓
Skill 10 (sprint report) → aggregate from QMetry + push to Confluence
```

---

### Additional utility — Convert Markdown to DOCX

```bash
# Convert 1 .md file → .docx (use when sending reports as Word documents)
python tools/md_to_docx.py \
  --file testing-output/test-plan/Sprint_Test_Plan_S1.md

# Convert an entire folder
python tools/md_to_docx.py \
  --folder testing-output/test-plan \
  --out testing-output/docx

# Recursive across all of testing-output
python tools/md_to_docx.py \
  --folder testing-output \
  --out testing-output/docx \
  --recursive
```

Output: `.docx` file with the same name, saved to the `--out` folder.

---

### Governance overview for tool integration

| Action | Governance | Condition |
|---|---|---|
| Push Test Plan to Confluence | L1 automatic | After skill 02/03 DONE |
| Push Sprint Report to Confluence | L2 — QA Lead review | After receiving sign-off from skill 10 |
| Push UAT / Go-No-Go to Confluence | L3 — PM/Stakeholder | After receiving sign-off from skill 12/13 |
| Import TC to QMetry | L1 automatic | After TC Approved (skill 07) |
| Update QMetry status | L1 automatic | After each day of testing (skill 09) |
| Create Jira subtask | L1 automatic | When breaking down work |
| Update Jira status | L1 automatic | When changing issue state |

> **General rule:** Do not push to Confluence or update Jira/QMetry when the output has not yet received sign-off at the corresponding level. The AI will emit a sign-off request and wait — it will not self-publish.

---

## Automation Framework — assets/automation-template/

The `assets/automation-template/` directory is a **complete Robot Framework skeleton** — the AI can use it directly when generating scripts (skill `qa-automation/02`). There is no need to build from scratch; simply scaffold new modules on top of this foundation.

### Overall structure

```
assets/automation-template/
├── KeywordLibraries/
│   ├── CommonKeyword/          ← Shared keywords used across all projects
│   ├── KeyCloak/               ← Auth token from KeyCloak
│   └── {Module}/               ← Domain keywords (LowLevel/HighLevel/Verification + General)
├── Libs/                       ← Python custom libraries (30+ ready-to-use)
├── Projects/                   ← Example test suites per module
├── Variables/                  ← ENV config (DEV/QC/UAT/PRD/MOBILE)
├── ExternalSystem/             ← External system connections (Dremio)
├── DataTest/                   ← Test data files (Excel, YAML)
├── .vscode/                    ← VS Code config, snippets, templates
├── .gitlab-ci.yml              ← Sample CI/CD pipeline
└── requirements.txt            ← All RF dependencies
```

---

### CommonKeyword — used directly in every project

Every keyword layer imports from here. AI-generated scripts always reference these files — do not recreate them.

#### BrowserCore.resource
Foundation keywords for UI tests (Playwright). Import: `Resource ../../CommonKeyword/BrowserCore.resource`

| Keyword | Description | Use when |
|---|---|---|
| `OPEN BROWSER AND DELETE COOKIES` | Opens a new browser + clears cookies. Args: `${url}` `${testBrowser}` `${ALIAS}` | Suite Setup — UI tests requiring a clean browser |
| `Open Browser Reusing Existing Browser` | Connects to a running Chrome instance via CDP port 6969 | Manual debugging — no additional browser window opened |

> Before using `Open Browser Reusing Existing Browser`, launch Chrome with the flag:  
> `chrome.exe --remote-debugging-port=6969 --user-data-dir="C:\temp\gdata"`

#### ApiCore.resource
Pure HTTP keywords, wraps the `RESTinstance` library. Import: `Resource ../../CommonKeyword/ApiCore.resource`  
Each keyword sets `${RESPONSE}` as a test variable after the call.

| Keyword | Signature | Returns |
|---|---|---|
| `METHOD GET` | `${URL}` `${SET_HEADERS}` `${SET_QUERY}` | `${RESPONSE}` = response body |
| `METHOD POST` | `${URL}` `${SET_HEADERS}` `${SET_BODY}` | `${RESPONSE}` = response body |
| `METHOD PUT` | `${URL}` `${SET_HEADERS}` `${SET_BODY}` | `${RESPONSE}` = response body |
| `METHOD DELETE` | `${URL}` `${SET_HEADERS}` `${SET_BODY}` | `${RESPONSE}` = response body |
| `METHOD PATCH` | `${URL}` `${SET_HEADERS}` `${SET_BODY}` | `${RESPONSE}` = response body |

> **Note:** `${SET_HEADERS}` and `${SET_BODY}` accept a Dictionary. `${RESPONSE}` is already logged — no need to log again.

#### Utils.resource
Reusable helper keywords. Import: `Resource ../../CommonKeyword/Utils.resource`

| Keyword | Description |
|---|---|
| `Get Random String` | Generates a random uppercase string. Arg: `${length}=8` |
| `Get Random Number` | Generates a random numeric string. Arg: `${length}=8` |
| `Get random item in List` | Returns a random item from a list |
| `Get DateTime` | Current date/time in specified format. Arg: `${date_format}=%Y-%m-%d %H:%M:%S` |
| `Get DateTime and Add day` | Date/time + N days. Args: `${day}` `${date_format}` |
| `Get DateTime and Subtract day` | Date/time − N days. Args: `${day}` `${date_format}` |
| `Get Day/Month/Year after increase days` | Returns individual day/month/year after adding N days |
| `Get list key or value from dictionary YAML` | Extracts keys or values from a YAML dictionary |

#### UI_Utils.resource (shared UI utilities)
Wait keywords specific to Angular/Material UI. Import: `Resource ../../{Module}/LowLevelKeywords/UI_Utils.resource`

| Keyword | Description |
|---|---|
| `Wait for loading table on NSP Page` | Waits for `div.c-loading` spinner to appear then disappear (timeout 120s) |
| `Wait for networkidle on NSP Page` | `Browser.Wait For Load State networkidle` — use after entering search input |
| `Focus mouse out` | Clicks outside to close dropdown/combobox |
| `Press Key Enter` | Focuses on the first input in the table filter and presses Enter |
| `Check Message Toast on NSP Page` | Verifies toast message content using `Browser.Get Text` |
| `Get total row in table on NPS Page` | Counts rows in `tbody tr.c-row` |
| `Get str text paginator on NSP Page` | Gets text from paginator (displays "1-10 of 100") |
| `Wait For Api Search Changes on NSP Page` | Waits for a response matching pattern `/api/v1/.*/search/` (timeout 180s) |

---

### KeyCloak Auth
`KeywordLibraries/KeyCloak/Api_KeyCloak_Token.resource`

| Keyword | Description | Returns |
|---|---|---|
| `Api get token from Sales Platform` | Gets Bearer token via KeyCloak OpenID Connect. Args: `${username}` `${password}` | `${nsp_token}` |

Internally uses `Libs/extend_keycloak.py → Get Token From Keycloak`.  
The realm URL is built from the `${ENV}` variable: `your-keycloak.example.com/realms/real-{page}-{env}/...`

---

### Variables — ENV config

Each environment has its own YAML file. The AI reads the correct file based on the `${ENV}` variable.

| File | Environment | Contains |
|---|---|---|
| `ENV_DEV.yaml` | Development | Dev URLs, API endpoints |
| `ENV_QC.yaml` | QC/Test | QC URLs, API endpoints |
| `ENV_UAT.yaml` | UAT | UAT URLs, API endpoints |
| `ENV_PRD.yaml` | Production | Production URLs, API endpoints |
| `ENV_Auth0.yaml` | Auth0 SSO | Auth0 domain, client_id |
| `ENV_AuthOM.yaml` | OneMount SSO | OAuth endpoints OM |
| `ENV_MOBILE.yaml` | Mobile | Appium URL, device settings |
| `CONFIG_MOBILE.yaml` | Mobile caps | platformName, appPackage, deviceName |

`CommonVariable.resource` loads the correct file using the pattern:
```robot
Variables    ../../Variables/ENV_${ENV}.yaml
```

Key global variables:
```yaml
${ENV}              QC          # override at runtime: --variable ENV:UAT
${RUN_BROWSER}      chrome      # or msedge, firefox
${RUNNING_ON_JENKIN} N          # Y when running on Jenkins
${UPDATE_TEST_CASE}  N          # Y to auto-update QMetry after each TC
${timeout}          30s
${RESPONSE}         ${EMPTY}    # always overwritten by ApiCore
```

Running on a different environment:
```bash
robot --variable ENV:UAT --variable RUN_BROWSER:msedge tests/
```

---

### Python Libraries (Libs/) — 30+ ready-to-use libraries

The AI can reference these directly in generated scripts without rewriting them.

#### Authentication & Security group

| File | Class/Function | RF Keyword | Description |
|---|---|---|---|
| `extend_keycloak.py` | `ExtendKeycloak` | `Get Token From Keycloak` | Gets access_token from KeyCloak (OpenID Connect password grant) |
| `extend_pgp_decrypt.py` | — | — | Decrypts PGP encrypted data |

#### Database group

| File | Class/RF Keyword | DB | Description |
|---|---|---|---|
| `extend_postgresql_db.py` | `Postgres Query Database` | PostgreSQL | Query DB + `Check No Empty Values` |
| `extend_oracle_db.py` | — | Oracle | Query Oracle databases |
| `extend_oracle_db2.py` | — | Oracle | Query Oracle databases - secondary instance |
| `extend_tidb.py` | — | TiDB | Query TiDB databases |
| `extend_ods.py` | — | ODS | Query ODS data warehouse |
| `database_output.py` | — | Generic | Format and log query results |
| `dremio_api.py` | — | Dremio | REST queries to Dremio data lake |

PostgreSQL usage example in RF:
```robot
Library    ../../Libs/extend_postgresql_db.py

${result}    Postgres Query Database
...    SELECT * FROM your_schema.your_table WHERE name = 'your-value'
Check No Empty Values    ${result}    columns=id,name,status
```

#### Messaging & Notification group

| File | Class | Used for |
|---|---|---|
| `ConnectKafka.py` | `send_message(topics, mes, key)` | Publish messages to Kafka (SSL) |
| `kafConsumer.py` | — | Consume Kafka messages |
| `Kafka_Lib.py` | — | RF-friendly Kafka wrapper |
| `Slack.py` | `connect()` | Send messages/files to a Slack channel via `SLACK_BOT_TOKEN` |
| `SlackEx.py` | — | Extended Slack operations |
| `extend_google_chat.py` | `extend_google_chat` | Send notifications to a Google Chat space |

Slack report example:
```robot
Library    ../../Libs/Slack.py
${client}    connect    # reads SLACK_BOT_TOKEN from env
```

#### Google Integration group

| File | Function |
|---|---|
| `GoogleSheet.py` | Read/write Google Sheets (OAuth2 credentials) |
| `extend_google_chat.py` | Send Google Chat notifications |

Setup: place the credentials file at the path in the `GOOGLESHEET_CREDENTIALS` env variable.

#### Reporting & CI group

| File | Class/Function | Description |
|---|---|---|
| `extend_reports.py` | `robot_report_database` | Push test results to internal report DB + Slack |
| `extend_qmetry.py` | `RobotReportQmetry` | `qmetry_Update_Status_Testcase` — Update Pass/Fail to QMetry Cloud |
| `QmetryAPIUpdateTC.py` | — | Alternative QMetry update |
| `listener.py` | — | RF listener hook — capture events |
| `RobotSTF.py` | — | RF Suite/Test filter utilities |

Auto-update QMetry in teardown example:
```robot
Library    ../../Libs/extend_qmetry.py

[Teardown]    qmetry Update Status Testcase
...    ${TESTCYCLES}    KST-TC-001    ${TEST_STATUS}    WEB
```

#### Mobile group

| File | Function |
|---|---|
| `ScrollAppMoblie.py` | Scroll Android native app by screen ratio |
| `ScrollIOSMoblie.py` | Scroll iOS native app |

Use when the test type is mobile (Appium). Import via `Utils.resource` or directly.

#### Image & Visual group

| File | Function |
|---|---|
| `ImageLibrary.py` | Image comparison, screenshot capture, OCR |

#### Performance group

| File | Function |
|---|---|
| `gen_data_jmeter.py` | Generate test data for JMeter scripts |

#### Legacy/Specialist group

| File | Function |
|---|---|
| `SeleniumLibEx.py` / `SeleniumLibraryEx.py` | Extended SeleniumLibrary (legacy projects) |
| `SapGuiLibraryEx.py` | SAP GUI automation |
| `MemberPortal.py` | Member portal specific helpers |
| `MyLibrary.py` | General project utilities |
| `extend_pss_temporal_client.py` | Temporal workflow client |
| `extend_cdp.py` | Chrome DevTools Protocol extensions |

---

### VS Code Setup — .vscode/

Pre-configured for VS Code when working with Robot Framework:

| File | Contents |
|---|---|
| `extensions.json` | Recommended installs: RobotFramework LSP, YAML, Python |
| `settings.json` | Robot path, Python interpreter, auto-format |
| `launch.json` | Debug config — run the current test file from VS Code |
| `robot.code-snippets` | Snippets: `*** Settings ***`, `*** Keywords ***`, keyword template |
| `templates/resource.resource` | Resource file template with correct Documentation + Author header |
| `templates/test_suite.robot` | Test suite template with Suite Setup/Teardown + standard imports |

Use templates when creating a new module — copy from the template rather than rewriting headers.

---

### CI/CD — .gitlab-ci.yml

Sample GitLab CI pipeline includes:
- Install Python + RF dependencies from `requirements.txt`
- Run robot with `--variable ENV:QC`
- Export artifacts: `log.html`, `report.html`, `output.xml`
- Parallel execution with `pabot` (config in `Variables/pabot_oms_arg.txt`)

Adapt this file for a new project by changing `--variable ENV:` and the test suite path.

---

### How the AI uses automation-template when generating scripts

When skill `qa-automation/02` (gen-script-test) is triggered, the AI:

1. **Does not load the entire asset into context** — only references the path
2. **Reuses CommonKeyword** — imports `BrowserCore`, `ApiCore`, `Utils` instead of writing equivalent keywords from scratch
3. **Selects the appropriate Lib** based on the integration type needed:
   - DB verify → `extend_postgresql_db.py` (PostgreSQL) or the corresponding lib
   - Auth → `extend_keycloak.py` → keyword `Get Token From Keycloak`
   - Notify → `extend_qmetry.py` → auto-update QMetry in Teardown
   - Mobile → `ScrollAppMoblie.py` / `ScrollIOSMoblie.py`
4. **Reads the corresponding ENV_*.yaml** — does not hardcode URLs
5. **Copies from template** `templates/resource.resource` and `templates/test_suite.robot` for new files
6. **Scaffolds following 3-layer**: LowLevel → HighLevel → Verification → update General hub

Reference rules in generated scripts:
```robot
Library    ../../Libs/extend_keycloak.py      # Auth
Library    ../../Libs/extend_postgresql_db.py # DB verify
Resource   ../../CommonKeyword/BrowserCore.resource
Resource   ../../CommonKeyword/ApiCore.resource
Resource   ../../CommonKeyword/Utils.resource
Variables  ../../Variables/ENV_${ENV}.yaml
```
