# QMetry Tools — Usage Guide

## General configuration

| File | Purpose |
|---|---|
| `tools/qmetry-config.json` | API base URL, project ID, column mapping, priority map |
| `.env` | `QMETRY_API_TOKEN=<token>` (required) |

---

## 1. Push test cases to a folder

**Script:** `tools/qmetry_push_testcase_to_folder.py`

Reads a TSV file and creates test cases in QMetry, placing them into the specified folder.

### Using a known folder ID

```powershell
python tools/qmetry_push_testcase_to_folder.py `
  --tsv testing-output/test-cases/functional/tc-IAC-01.tsv `
  --folder-id 2489720
```

### Find or create a subfolder, then push

```powershell
python tools/qmetry_push_testcase_to_folder.py `
  --tsv testing-output/test-cases/functional/tc-IAC-01.tsv `
  --parent-folder-id 2475804 `
  --folder-name test-qmetry
```

The script automatically creates the `test-qmetry` folder if it does not exist, and returns the `FOLDER_ID` after creation.

### Optional flags

| Flag | Description |
|---|---|
| `--max-rows N` | Push only the first N rows (for debugging) |
| `--dry-run` | Preview payload, do not call the API |
| `--continue-on-error` | Continue even if a row has an error |

### TSV format notes

- The TSV file must have a **header on line 1** (no `#` comment at the top)
- Each data row must have exactly **15 tab-separated values**
- The `Test Level` column must not be empty (`e2e` / `integration` / `component`)
- The `Priority` column uses `High` / `Medium` / `Low`

### Output

JSON report saved at `testing-output/qmetry/qmetry-folder-push-report.json`
Contains: `key`, `id`, `priority`, `folderId`, `stepCount` for each created TC.

---

## 2. Add TCs to a cycle + update results (bulk)

**Script:** `tools/qmetry_bulk_status.py`

Links test cases to a test cycle and updates execution status.
Supports 3 ways to specify the TC list:

### Method A — By folder ID (most common)

Automatically retrieves TCs from `qmetry-folder-push-report.json` by `folderId`.

```powershell
python tools/qmetry_bulk_status.py `
  --cycle FDP-TR-1 `
  --cycle-id NMMUa7miAok4R `
  --folder-id 2489720 `
  --status Fail
```

### Method B — By TSV file

TSV must have the header: `tc_key  tc_id  status  comment`

```powershell
python tools/qmetry_bulk_status.py `
  --cycle FDP-TR-1 `
  --cycle-id NMMUa7miAok4R `
  --file testing-output/qmetry/my-updates.tsv
```

Each row can have its own status. If the `status` column is missing, `--status` is used as the default.

### Method C — Direct KEY:ID list

```powershell
python tools/qmetry_bulk_status.py `
  --cycle FDP-TR-1 `
  --cycle-id NMMUa7miAok4R `
  --tcs "FDP-TC-2644:LNNtKZJtm142P,FDP-TC-2645:PVVhnx7u78JYG" `
  --status Pass
```

### Optional flags

| Flag | Default | Description |
|---|---|---|
| `--status` | `Pass` | Status to apply: `Pass` / `Fail` / `Blocked` / `WIP` / `Not Executed` |
| `--comment` | `""` | Comment attached to the execution |
| `--delay` | `0.3` | Seconds to wait between requests (to avoid rate-limiting) |
| `--dry-run` | — | Preview, do not actually update |

### Getting the cycle-id

The cycle-id is QMetry's internal ID (not the key like `FDP-TR-1`).
How to get it: use `qmetry_update_status.py --list-statuses` or check the URL in the QMetry UI.
Cycle `FDP-TR-1` → `cycle-id = NMMUa7miAok4R`

---

## 3. Update status of a single TC

**Script:** `tools/qmetry_update_status.py`

### Update TC status in an existing cycle

```powershell
python tools/qmetry_update_status.py `
  --cycle FDP-TR-1 `
  --cycle-id NMMUa7miAok4R `
  --tc FDP-TC-2644 `
  --tc-id LNNtKZJtm142P `
  --status Pass `
  --comment "Verified OK"
```

### Create new cycle, link TC, update status (1 command)

```powershell
python tools/qmetry_update_status.py `
  --create-cycle-link-update "Sprint 12 Regression" `
  --cycle-folder-id 2489725 `
  --tc FDP-TC-2644 `
  --tc-id LNNtKZJtm142P `
  --status Pass
```

### Create new cycle in a subfolder (auto-creates folder if it does not exist)

```powershell
python tools/qmetry_update_status.py `
  --create-cycle-link-update "Sprint 12 Regression" `
  --cycle-parent-folder-id 2489725 `
  --cycle-folder-name regression `
  --tc FDP-TC-2644 `
  --tc-id LNNtKZJtm142P `
  --status Pass
```

### View list of status IDs

```powershell
python tools/qmetry_update_status.py --list-statuses
```

---

## 4. Typical workflows

### A. Create new TCs and push to a cycle

```
1. Generate TSV (skill 05-gen-tc-functional)
2. Push to folder:
   python tools/qmetry_push_testcase_to_folder.py --tsv <file> --folder-id <id>

3. Add to cycle + update results:
   python tools/qmetry_bulk_status.py --cycle FDP-TR-1 --cycle-id NMMUa7miAok4R
     --folder-id <id> --status Fail
```

### B. Update results after testing

```powershell
# All TCs in folder → Pass
python tools/qmetry_bulk_status.py `
  --cycle FDP-TR-1 --cycle-id NMMUa7miAok4R `
  --folder-id 2489720 --status Pass

# Specific TCs → mixed status (use TSV file)
python tools/qmetry_bulk_status.py `
  --cycle FDP-TR-1 --cycle-id NMMUa7miAok4R `
  --file testing-output/qmetry/my-updates.tsv
```

---

## 5. Priority mapping

| In TSV | In QMetry | ID |
|---|---|---|
| `High` | High | 674922 |
| `Medium` | Medium | 674923 |
| `Low` | Low | 674924 |
| `Critical` / `P1` | Critical | 674921 |
| `P2` | High | 674922 |
| `P3` | Medium | 674923 |
| `P4` | Low | 674924 |

> TSV should use `High` / `Medium` / `Low` — avoid `P1/P2/P3/P4`.
