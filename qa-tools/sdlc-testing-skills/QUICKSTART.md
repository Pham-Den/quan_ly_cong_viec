# QA Skill Suite v2.1 — Quick Start

Get started in 5 minutes. Read [README.md](README.md) for the full guide.

---

## Step 0 — Understand how it works

This toolkit runs with **Claude** (or a compatible AI). You type your request in natural language, Claude picks the right skill, and generates output into `testing-output/`.

**You don't need to remember any commands** — just say what you want to do.

---

## Step 1 — Setup (first time only)

```powershell
# 1. Install dependencies
pip install -r tools/requirements-integration.txt

# 2. Create .env
copy .env.example .env
# Fill in ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN, QMETRY_API_TOKEN in .env

# 3. Setup QMetry config
copy tools\qmetry-config.sample.json tools\qmetry-config.json
# Fill in apiBaseUrl and project.jiraProjectId in qmetry-config.json

# 4. Open Claude Code
claude
```

---

## Step 2 — Get started right away

| Situation | What to type in Claude |
|---|---|
| Just received requirements, need to review | "Review this AC for me: [paste AC]" |
| New sprint, need to plan | "Create sprint test plan for sprint 5" |
| Need to write test cases | "Write test cases for IAC-01 — here is the AC: [...]" |
| Have end-of-day test results | "Daily report: pass 45, fail 3, blocked 2" |
| About to release, need a decision | "Go/no-go sprint 5, pass rate 94%" |
| Just finished deploying | "Smoke test production: https://app.prod.example.com" |

---

## Step 3 — Standard sprint flow

```
03 (Sprint Plan) → 05 (TC Functional) → push to QMetry
→ 09 (Daily check, repeat daily) → 10 (Sprint Report)
→ 13 (Go/No-Go) → 14 (Smoke Production)
```

---

## Step 4 — Push output to QMetry / Confluence

```powershell
# Push TC to QMetry
python tools/qmetry_push_testcase_to_folder.py --tsv <file.tsv> --folder-id <ID>

# Bulk update results
python tools/qmetry_bulk_status.py --cycle FDP-TR-5 --cycle-id <ID> --folder-id <ID> --status Pass

# Push test plan to Confluence
python tools/confluence_md.py --file testing-output/test-plan/<file.md> --parent-id <ID>
```

---

## When stuck

| Problem | Solution |
|---|---|
| Not sure which skill to use | Say "which skill is appropriate when I need to [...]?" |
| Output has wrong format | Say "Re-read the skill file and regenerate following that format" |
| QMetry error | See `tools/QMETRY_TOOLS.md` |
| Confluence error | See `CONFLUENCE-SYNC-GUIDE.md` |
| Any other issue | See `README.md` Troubleshooting section |
