# Tools Guide

Use these four entry points for normal QA work.

## Confluence

Sync Confluence pages to local Markdown, including image attachments:

```powershell
python tools/confluence_sync_space.py --full --parent-id <PAGE_OR_FOLDER_ID> --preserve-tree
```

By default this writes only `.md` files and referenced attachments. Add
`--write-json` only when metadata snapshots are needed for debugging.
Pages that contain Confluence images are saved as folders with the `.md` file
and an `images/` child directory; the Markdown uses relative links into that
folder.

Resume an interrupted sync:

```powershell
python tools/confluence_sync_space.py --full --parent-id <PAGE_OR_FOLDER_ID> --preserve-tree --resume
```

Publish one Markdown file to Confluence:

```powershell
python tools/confluence_md.py --file <path-to.md> --parent-id <PARENT_PAGE_ID> --dry-run
python tools/confluence_md.py --file <path-to.md> --parent-id <PARENT_PAGE_ID>
```

Publish a folder of Markdown files:

```powershell
python tools/confluence_push_folder.py --folder <folder> --parent-id <PARENT_PAGE_ID> --recursive --dry-run
python tools/confluence_push_folder.py --folder <folder> --parent-id <PARENT_PAGE_ID> --recursive
```

## Jira

Sync Jira issues to local snapshots. Each issue is saved as a folder with
Markdown, JSON, and downloaded image attachments:

```powershell
python tools/jira_sync.py --jql "<JQL>" --out project/docs/jira
python tools/jira_sync.py --issue EH-22
```

Default issue layout:

```text
project/docs/jira/issues/<ISSUE_KEY>/
  <ISSUE_KEY>.md
  <ISSUE_KEY>.json
  images/
```

## QMetry

Push generated test cases to a QMetry folder:

```powershell
python tools/qmetry_push_testcase_to_folder.py --tsv <testcases.tsv> --folder-id <FOLDER_ID> --dry-run
python tools/qmetry_push_testcase_to_folder.py --tsv <testcases.tsv> --folder-id <FOLDER_ID>
```

Bulk update execution status:

```powershell
python tools/qmetry_bulk_status.py --cycle <CYCLE_KEY> --cycle-id <CYCLE_ID> --folder-id <FOLDER_ID> --status Pass --dry-run
python tools/qmetry_bulk_status.py --cycle <CYCLE_KEY> --cycle-id <CYCLE_ID> --folder-id <FOLDER_ID> --status Pass
```

## Optional Tools

- `confluence_fetch_with_ocr.py`: fetch one page to AI-friendly JSON and OCR referenced images.
- `confluence_fetch_tree.py`: inspect parent/sibling metadata for one page.
- `confluence_qa_fetch.py`: find pages by keyword after `space-tree.md` exists.
- `md_to_docx.py`: export Markdown artifacts to Word.
- `jira_create_subtask.py`, `jira_update_issue.py`: one-off Jira operations.
- `qmetry_update_status.py`, `qmetry_update_testcase.py`: one-off QMetry operations.

## Legacy

Scripts in `tools/legacy/` are kept for compatibility only. Do not use them for new workflows unless a migration requires it.

Notably, `legacy/confluence_fetch_page.py` overlaps with `confluence_sync_space.py`; use `confluence_sync_space.py` for sync-down because it uses the Confluence attachment proxy that supports image downloads with API tokens.

## Runtime Config

- Copy `tools/qmetry-config.sample.json` to `tools/qmetry-config.json` for local QMetry settings.
- Keep API tokens in `.env`; `tools/qmetry-config.json` should contain non-secret project settings only.
