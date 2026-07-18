# QA Skill Suite v2.2.0

AI-Driven testing skill suite — from requirements review → test plan → TC writing → test data → automation → defect logging → reporting → release gate.

---

## What does Claude/AI do in this toolkit?

This toolkit is designed to run with **Claude Code CLI** (or any compatible AI client).
Claude is **not** just a question-answering chatbot — Claude reads the skill files, understands the QA process, then **generates output in the correct standard format** (TSV test cases, Markdown test plans, Robot Framework scripts, etc.).

How it works:

```
You type a request in Vietnamese / English
        ↓
Claude reads SKILL.md → selects the correct sub-skill
        ↓
Claude reads the sub-skill + required references
        ↓
Claude generates output → writes files to testing-output/
        ↓
You review, edit if needed, then push to Confluence / QMetry
```

**Practical benefits:**
- Write 35 functional TCs from 1 User Story in < 5 minutes
- Generate a complete sprint test plan with 8 sections just by saying the sprint name
- Upload dozens of TCs to QMetry and bulk-update their statuses with 2 Python commands
- Sync Confluence → local so Claude can read requirements without copy-pasting

---

## Requirements

| Item | Version | Notes |
|---|---|---|
| Python | 3.9+ | Required for tools/ |
| AI Client | any | Claude Code CLI (recommended), Claude.ai, Cursor, Copilot, Cline |
| QMetry | Cloud | API token required |
| Confluence / Jira | Cloud | API token required (if using sync tools) |

Install dependencies:

```powershell
pip install -r tools/requirements-integration.txt
```

---

## Setup

### 1. Credentials

Create a `.env` file at the root directory (do not commit — already in `.gitignore`):

```dotenv
# Atlassian (Confluence + Jira)
ATLASSIAN_EMAIL=your@email.com
ATLASSIAN_API_TOKEN=your_api_token
ATLASSIAN_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_SPACE_KEY=YOUR_SPACE
JIRA_PROJECT_KEY=YOUR_PROJECT

# QMetry
QMETRY_API_TOKEN=your_qmetry_api_token
```

See `.env.example` for the full list of variables.

### 2. QMetry config

```powershell
copy tools\qmetry-config.sample.json tools\qmetry-config.json
```

Open `tools/qmetry-config.json` and fill in:
- `apiBaseUrl` — the team's QMetry Cloud URL (e.g. `https://qtmcloud.qmetry.com`)
- `project.jiraProjectId` — numeric ID of the Jira project linked to QMetry

### 3. Open with AI Client

**Claude Code CLI:**
```powershell
cd d:\path\to\qa-skill-v2.1.0
claude
```
Claude Code automatically reads `CLAUDE.md` → loads context → ready to accept commands.

**Claude.ai / Cursor / Copilot:** Add this entire folder to the context/workspace of that tool.

---

## Folder structure

```
qa-skill-v2.1.0/
│
├── CLAUDE.md                    ← Read by Claude Code on startup (instructions)
├── SKILL.md                     ← Central router — AI routes to the correct skill
├── AGENTS.md                    ← Instructions for Codex CLI / Copilot Agent
├── .github/copilot-instructions.md  ← Instructions for Copilot Chat
│
├── skills/                      ← AI brain — 20 skills
│   ├── qa-core/01-15/           ← 15 main-flow skills
│   ├── qa-core/09b-log-defect/  ← Defect logging to Jira (L2 gate)
│   ├── qa-automation/01-02/     ← Setup project + Gen automation script
│   └── qa-specialist/01-03/     ← Security / Performance / Accessibility
│
├── references/                  ← Standard documents AI reads when needed
│   ├── INDEX.md                 ← Index so AI selects the correct reference
│   ├── tc-template.tsv          ← Functional TC template, 16 columns
│   ├── sit-template.tsv         ← SIT TC template, 19 columns
│   ├── test-plan-template.md
│   ├── report-template.md
│   └── skill-details/           ← Per-skill detail files (fallback/legacy)
│
├── tools/                       ← Integration scripts
│   ├── confluence_md.py         ← Push a single .md file to Confluence
│   ├── confluence_push_folder.py← Push an entire folder to Confluence
│   ├── confluence_fetch_page.py ← Fetch a single page to local
│   ├── confluence_fetch_with_ocr.py ← Fetch page + extract images (OCR)
│   ├── confluence_fetch_tree.py ← Retrieve hierarchy (parent/siblings/children)
│   ├── confluence_qa_fetch.py   ← Search pages by natural-language keyword
│   ├── confluence_sync_space.py ← Sync an entire space to local
│   ├── html_to_md.py            ← Convert Confluence HTML → Markdown
│   ├── jira_sync.py             ← Sync Jira project / issues to local
│   ├── jira_create_bug.py       ← Create Jira Defect with full QC fields (NEW v2.2)
│   ├── jira_create_subtask.py   ← Create a Jira subtask
│   ├── jira_update_issue.py     ← Update a Jira issue
│   ├── qmetry_push_testcase_to_folder.py ← Push TC TSV to a QMetry folder
│   ├── qmetry_bulk_status.py    ← Link TCs to a cycle + bulk-update statuses
│   ├── qmetry_update_status.py  ← Update the status of a single TC
│   ├── md_to_docx.py            ← Convert .md → .docx
│   ├── qmetry-config.json       ← QMetry project config (created from .sample.json)
│   └── QMETRY_TOOLS.md          ← Detailed QMetry tools guide
│
├── assets/
│   └── automation-template/     ← Full Robot Framework template (scaffold)
│
├── testing-output/              ← AI writes output here
│   ├── test-plan/               ← Master + Sprint Test Plans
│   ├── test-cases/functional/   ← Functional TCs (.tsv)
│   ├── test-cases/sit/          ← SIT TCs (.tsv)
│   ├── test-cases/hltc/         ← High-level test design (.md)
│   ├── test-data/               ← Test data (.tsv)
│   ├── reports/                 ← Daily + Sprint reports
│   ├── automation/              ← Generated Robot Framework scripts
│   └── qmetry/                  ← Push reports, bulk-status files
│
├── project/
│   ├── qa-config.yaml           ← Project config (created with skill 02)
│   └── docs/                    ← Local mirror of Confluence + Jira (read cache)
│       ├── confluence/pages/    ← Fetched/synced pages (.md + .json)
│       └── jira/                ← Jira issues + searches
│
├── governance/                  ← GOVERNANCE.md, sign-off-gates, audit-log
├── evaluation/                  ← Rubric for evaluating AI output quality
└── workflows/                   ← End-to-end workflow guides
```

---

## Skills list

### qa-core — 16 skills (main flow)

| # | Skill | Trigger phrase | Output |
|---|---|---|---|
| 01 | Review Requirements | "review AC for me: [paste]", "review BR" | Issues list TSV |
| 02 | Master Test Plan | "create master test plan", "QA strategy MVP" | .md + `qa-config.yaml` |
| 03 | Sprint Test Plan | "sprint test plan sprint 5", "test plan new sprint" | .md 8 sections |
| 04 | High-Level Test Design | "HLTC module login", "mindmap test design" | .md outline + mindmap |
| 05 | TC Functional | "write test case IAC-01", "gen TC from this AC: [...]" | .tsv 16 columns |
| 06 | TC SIT | "SIT for auth service", "integration test API" | .tsv 19 columns |
| 07 | Review TC | "review my testcase", "coverage analysis" | Markdown report |
| 08 | Gen Test Data | "create test data for login", "gen dataset Sprint 5" | .tsv + .sql |
| 09 | Check Result | "daily report: pass 45, fail 3", "bug triage" | .md + .html |
| **09b** | **Log Defect** | "log bug", "tao defect", "tao bug jira", "push defect", "bug confirmed" | Jira Defect issue |
| 10 | Test Report | "sprint report sprint 5", "test report" | .md + .html |
| 11 | Demo Preparation | "prepare demo sprint 5" | Markdown script |
| 12 | UAT Support | "UAT checklist", "acceptance testing support" | Markdown |
| 13 | Go/No-Go | "go/no-go sprint 5, pass rate 92%" | Markdown decision |
| 14 | Smoke Production | "smoke test production URL: [...]" | Markdown checklist |
| 15 | DB Migration Testing | "test migration for Liquibase", "validate schema migration", "rollback migration" | Markdown checklist |

### qa-automation — 2 skills

| # | Skill | Trigger phrase | Output |
|---|---|---|---|
| A1 | Setup Automation | "initialize automation project", "setup RF project" | Scaffold project .robot |
| A2 | Gen Script Test | "write automation script for TC-001", "gen RF script" | .robot files |

### qa-specialist — 3 skills

| # | Skill | Trigger phrase | Output |
|---|---|---|---|
| S1 | Security Testing | "security testing module auth", "OWASP checklist" | Markdown |
| S2 | Performance Testing | "load test API login", "performance baseline" | Markdown + k6/JMeter script |
| S3 | Accessibility Testing | "a11y testing login screen", "WCAG checklist" | Markdown |

---

## Typical scenarios

### Scenario 1 — Starting a new project

```
1. Create Master Test Plan + config:
   → "Create master test plan for project FDP Sprint 1-3, domain: FinTech, team: 3 QC"

2. Verify files created:
   testing-output/test-plan/Test_Plan_FDP_MVP1_v1.0_2026-05-20.md
   project/qa-config.yaml

3. First sprint → proceed to Scenario 2
```

### Scenario 2 — New sprint (standard per-sprint flow)

```
1. Sprint test plan:
   → "Create sprint test plan sprint 5"

2. High-level test design (for complex modules):
   → "HLTC for module IAM & SSO — User Story IAC-01, IAC-02, IAC-03"

3. Write test cases:
   → "Write functional test case for IAC-01 (here is the AC): [paste AC]"
   → Output: testing-output/test-cases/functional/tc-functional-IAC-01-Sprint5-v1.0-2026-05-20.tsv

4. Review TC:
   → "Review the test case just created, file: testing-output/test-cases/functional/tc-functional-IAC-01-Sprint5-v1.0-2026-05-20.tsv"

5. Push to QMetry:
   python tools/qmetry_push_testcase_to_folder.py \
     --tsv testing-output/test-cases/functional/tc-functional-IAC-01-Sprint5-v1.0-2026-05-20.tsv \
     --folder-id <YOUR_FOLDER_ID>

6. Record results after testing:
   python tools/qmetry_bulk_status.py \
     --cycle FDP-TR-5 --cycle-id <CYCLE_INTERNAL_ID> \
     --folder-id <YOUR_FOLDER_ID> --status Pass
```

### Scenario 3 — Fetch requirements from Confluence then generate TCs

```
1. Fetch Confluence page to local:
   python tools/confluence_fetch_with_ocr.py \
     --url "https://your-domain.atlassian.net/wiki/spaces/FDP/pages/3731718216" \
     --json-out project/docs/confluence/pages/IAC-01.json

2. Tell Claude:
   → "Read project/docs/confluence/pages/IAC-01.json then write complete functional test cases"

3. Claude reads the fetched file → generates TCs → writes to testing-output/test-cases/functional/
```

### Scenario 4 — Push output to Confluence

```
1. After Claude creates a sprint test plan:
   python tools/confluence_md.py \
     --file testing-output/test-plan/Sprint_Test_Plan_FDP_Sprint5_v1.0_2026-05-20.md \
     --parent-id <CONFLUENCE_PARENT_PAGE_ID>

2. For subsequent updates (Claude has saved the page_id to a .json sidecar):
   python tools/confluence_md.py \
     --file testing-output/test-plan/Sprint_Test_Plan_FDP_Sprint5_v1.0_2026-05-20.md
   (automatically upserts to the correct page)
```

### Scenario 5 — Log a confirmed defect to Jira (skill 09b)

Skill **09b** dành riêng để log defect lên Jira sau khi QC **đã xác nhận** bug. Có L2 gate (phải confirm "yes" trước khi script chạy).

```
1. Nói với Claude:
   → "log bug: gọi POST /api/agentic-search thiếu header X-Agent-ID
      trả về RAG_MISSING_CALLER_IDENTITY thay vì RAG_MISSING_AGENT"

2. Claude tự điền form và hiện preview để confirm:
   Summary        : [FDP-827][AGENT_16] Thiếu X-Agent-ID trả về RAG_MISSING_CALLER_IDENTITY
   Sprint         : AI Sprint 3 (ID: 29686, auto-detect từ US issue)
   US liên quan   : FDP-827 (sẽ tự link sau khi tạo)
   Severity       : Normal (S3)
   Platform       : BE | Env Found: QC
   ...
   [L2] Xác nhận tạo Defect? (yes / chỉnh sửa field nào)

3. Trả lời "yes" → Claude chạy script:
   python tools/jira_create_bug.py \
     --project FDP \
     --summary "[FDP-827][AGENT_16] Thiếu X-Agent-ID trả về RAG_MISSING_CALLER_IDENTITY" \
     --us-id FDP-827 \
     --tc-id "AGENT_16" \
     --run-id "12/06-R1" \
     --severity S3 \
     --platform BE \
     --env-found QC \
     --quality-activity "Functional Test" \
     --assigned "TBD" \
     ...

4. Kết quả:
   Defect đã tạo : FDP-XXXX
   Link US       : FDP-827 → FDP-XXXX (Relates to)
   https://onemount.atlassian.net/browse/FDP-XXXX
```

**Sprint auto-detect:** Script đọc `customfield_10018` từ US issue để lấy đúng sprint — không cần truyền thủ công.

**Fields hỗ trợ:**
- Severity: `S1` (Critical) / `S2` (Major) / `S3` (Normal, mặc định) / `S4` (Minor)
- Platform: `APP` / `BE` / `FE` / `External` / `Other` (multi-select)
- Env Found: `DEV` / `QC` / `UAT` / `PILOT` / `SANDBOX` / `PRODUCTION` (multi-select)
- Quality Activity: `Functional Test` / `UAT` / `Regression Test` / `SIT` / `Unit test` / `Review` / `Security Test`
- `--parent FDP-XXX` — gán Parent issue (Epic key)
- `--assignee-id <accountId>` — assign dev qua Jira accountId

---

### Scenario 6 — End of sprint: report + go/no-go

```
1. Sprint report:
   → "Sprint report sprint 5: pass 142, fail 8, blocked 3, coverage 92%"

2. Go/No-Go decision:
   → "Go/no-go sprint 5 — pass rate 94.7%, 2 critical bugs still open, deadline tomorrow"

3. Smoke test production after deploy:
   → "Smoke test production URL: https://app.prod.example.com, credentials: admin/P@ssw0rd"
```

### Scenario 7 — Advanced QMetry (mixed statuses)

```
# Create a new cycle + link TC + mark Pass (single command)
python tools/qmetry_update_status.py \
  --create-cycle-link-update "Sprint 5 Regression" \
  --cycle-folder-id <FOLDER_ID> \
  --tc FDP-TC-2644 --tc-id LNNtKZJtm142P \
  --status Pass

# Multiple TCs with different statuses → create TSV file then bulk update
# TSV file: header = tc_key  tc_id  status  comment
python tools/qmetry_bulk_status.py \
  --cycle FDP-TR-5 --cycle-id <CYCLE_ID> \
  --file testing-output/qmetry/mixed-results.tsv
```

---

## Tools Integration — Confluence

See full details: [CONFLUENCE-SYNC-GUIDE.md](CONFLUENCE-SYNC-GUIDE.md)

| Task | Script |
|---|---|
| Fetch a single page to local | `confluence_fetch_page.py` or `confluence_fetch_with_ocr.py` |
| Search pages by keyword | `confluence_qa_fetch.py` |
| Retrieve parent/siblings/children of a page | `confluence_fetch_tree.py` |
| Sync an entire space to local | `confluence_sync_space.py` |
| Push a single .md file to Confluence | `confluence_md.py` |
| Push an entire .md folder to Confluence | `confluence_push_folder.py` |

---

## Tools Integration — QMetry

See full details: [tools/QMETRY_TOOLS.md](tools/QMETRY_TOOLS.md)

**Standard flow:**

```powershell
# Step 1: Push TCs from TSV to a folder
python tools/qmetry_push_testcase_to_folder.py `
  --tsv testing-output/test-cases/functional/tc-functional-Sprint5-v1.0.tsv `
  --folder-id <FOLDER_ID>

# Step 2: Link TCs to a cycle + bulk-update statuses
python tools/qmetry_bulk_status.py `
  --cycle FDP-TR-5 `
  --cycle-id <CYCLE_INTERNAL_ID> `
  --folder-id <FOLDER_ID> `
  --status Fail
```

---

## Tools Integration — Jira

```powershell
# Sync entire project to local
python tools/jira_sync.py --project FDP

# Sync a specific issue
python tools/jira_sync.py --issue FDP-1059

# Create a Defect (full QC fields — dùng qua skill 09b hoặc trực tiếp)
python tools/jira_create_bug.py `
  --project FDP `
  --summary "[FDP-827][AGENT_16] Thieu X-Agent-ID tra ve sai error code" `
  --us-id FDP-827 `
  --tc-id "AGENT_16" `
  --run-id "12/06-R1" `
  --env-url "https://aip-portal-qc.ops.onenexus.dev" `
  --precondition "KB ID 4f331435 da ton tai tren QC" `
  --steps "1. POST /api/agentic-search 2. Bo header X-Agent-ID" `
  --actual "HTTP 400 RAG_MISSING_CALLER_IDENTITY" `
  --expected "HTTP 400 RAG_MISSING_AGENT" `
  --severity S3 `
  --platform BE `
  --env-found QC `
  --quality-activity "Functional Test" `
  --assigned "TBD"
# → Tự detect sprint từ FDP-827, tự link "Relates to" FDP-827

# Create a subtask
python tools/jira_create_subtask.py --parent FDP-1059 --summary "Write TC for feature X"

# Update status
python tools/jira_update_issue.py --issue FDP-1059 --status "In Progress"
```

### jira_create_bug.py — tham số đầy đủ

| Tham số | Bắt buộc | Mô tả |
|---|---|---|
| `--project` | ✅ | Jira project key (VD: `FDP`) |
| `--summary` | ✅ | Format: `[US-ID][TC-ID] Mô tả lỗi` |
| `--us-id` | ✅ | US liên quan — script tự link "Relates to" |
| `--tc-id` | ✅ | Test case / scenario ID |
| `--run-id` | ✅ | Pattern `DD/MM-R#` (VD: `12/06-R1`) |
| `--env-url` | ✅ | URL môi trường test |
| `--precondition` | ✅ | Điều kiện tiên quyết (data thật) |
| `--steps` | ✅ | Steps to reproduce (data thật) |
| `--actual` | ✅ | Kết quả thực tế |
| `--expected` | ✅ | Kết quả mong muốn |
| `--severity` | ✅ | `S1`/`S2`/`S3`/`S4` (default: S3) |
| `--platform` | ✅ | `APP`/`BE`/`FE`/`External`/`Other` |
| `--env-found` | ✅ | `DEV`/`QC`/`UAT`/`PILOT`/`SANDBOX`/`PRODUCTION` |
| `--quality-activity` | ✅ | `Functional Test` / `UAT` / `Regression Test` / ... |
| `--assigned` | ✅ | Tên dev hoặc `TBD` |
| `--sprint` | optional | Sprint ID (số). Mặc định: auto-detect từ US issue |
| `--parent` | optional | Epic/Parent key (VD: `FDP-800`) |
| `--defect-type` | optional | `Code defect` / `Design defect` / `Document defect` / `System defect` |
| `--assignee-id` | optional | Jira accountId của dev |
| `--attachments` | optional | Đường dẫn file ảnh cách nhau bởi space |

---

## Tools Integration — Export .docx

```powershell
# Single file
python tools/md_to_docx.py --file testing-output/test-plan/Sprint_Test_Plan_FDP_Sprint5_v1.0.md

# Entire folder
python tools/md_to_docx.py --folder testing-output/test-plan --out testing-output/docx

# Recursively all subfolders
python tools/md_to_docx.py --folder testing-output --out testing-output/docx --recursive
```

---

## Output file naming convention

Every artifact must include: `version (vX.Y)` + `date (yyyy-mm-dd)`.

| Artifact | Pattern | Folder |
|---|---|---|
| Master Test Plan | `Test_Plan_{code}_{milestone}_v{ver}_{date}.md` | `testing-output/test-plan/` |
| Sprint Test Plan | `Sprint_Test_Plan_{code}_{sprint}_v{ver}_{date}.md` | `testing-output/test-plan/` |
| HLTC | `hltc-{module}-{sprint}-v{ver}-{date}.md` | `testing-output/test-cases/hltc/` |
| Functional TC | `tc-functional-{module}-{sprint}-v{ver}-{date}.tsv` | `testing-output/test-cases/functional/` |
| SIT TC | `tc-sit-{module}-{sprint}-v{ver}-{date}.tsv` | `testing-output/test-cases/sit/` |
| Test Data | `master-dataset-{sprint}-v{ver}-{date}.tsv` | `testing-output/test-data/` |
| Daily Report | `daily-report-{date}-R{N}-v{ver}.md` | `testing-output/reports/` |
| Sprint Report | `sprint-report-{sprint}-{date}-v{ver}.md` | `testing-output/reports/` |

Details: `references/project-folder-convention.md`

---

## Governance & Approval

| Level | Skills | Requirement |
|---|---|---|
| L1 — Auto | 01–06, 08 | AI completes autonomously, no approval needed |
| L2 — QA Lead review | 07, 09, **09b**, 10–11, qa-automation/02, qa-specialist/* | QA Lead / user phải confirm trước khi publish hoặc push Jira |
| L3 — Stakeholder | 12–14 | PM/Stakeholder must approve |

> **Skill 09b đặc biệt:** L2 gate là bước user confirm "yes" trực tiếp trong chat trước khi script tạo Defect trên Jira. Không thể bỏ qua bước này.

Details: `governance/sign-off-gates.md`

---

## Transitioning to a new sprint

1. Edit `project/qa-config.yaml`: change `project.sprint` to the new sprint
2. Use skill 03 instead of 02 (shorter, reuses existing config)
3. Old `testing-output/` files are kept as-is — new files have a different timestamp and will not be overwritten

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Claude does not know which skill to use | Be more specific: "Use skill 05 to gen functional TC for module X" |
| Output is missing a section | "Output is missing [section], add it following the correct format" |
| AI generates incorrect format | "Re-read skill 05 file and regenerate following that format" |
| QMetry: `QMETRY_API_TOKEN not set` | Check `.env` at root, make sure the token is present |
| QMetry: pushes 0 rows | TSV has `#` comment lines at the top, or is missing the `Test Level` column → see `tools/QMETRY_TOOLS.md` |
| Confluence: 401 Unauthorized | Check `ATLASSIAN_API_TOKEN` in `.env` |
| Confluence: 404 Not Found | Page ID is wrong, or URL is incorrect |
| `ModuleNotFoundError` | Run `pip install -r tools/requirements-integration.txt` |
| jira_create_bug: `403 Forbidden` | Tài khoản chưa có quyền `Create Issues` trên project — nhờ Jira admin grant |
| jira_create_bug: `400 Bad Request` field X | Giá trị field không hợp lệ — xem bảng allowed values trong skill 09b |
| jira_create_bug: Sprint không đúng | Thêm `--sprint 0` để skip sprint, hoặc `--sprint <ID>` để gán thủ công |
| jira_create_bug: Không tìm thấy sprint từ US | US issue chưa được gán sprint — truyền `--sprint <ID>` thủ công |
