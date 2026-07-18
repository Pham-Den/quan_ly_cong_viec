# Confluence Sync Guide

Use `tools/confluence_sync_space.py` as the standard sync-down entry point.

## Sync Down

Sync a Confluence subtree to local Markdown, preserving the page tree and downloading referenced image attachments:

```powershell
python tools/confluence_sync_space.py `
  --full `
  --parent-id <PAGE_OR_FOLDER_ID> `
  --preserve-tree
```

Default output:

```text
project/docs/
project/space-tree.md
```

The standard sync output is Markdown plus referenced attachments only. Page
metadata JSON is not written unless you explicitly pass `--write-json`.

Override the output root only when needed:

```powershell
python tools/confluence_sync_space.py `
  --full `
  --parent-id <PAGE_OR_FOLDER_ID> `
  --preserve-tree `
  --out "project/docs"
```

For large trees, test with limits first:

```powershell
python tools/confluence_sync_space.py `
  --full `
  --parent-id <PAGE_OR_FOLDER_ID> `
  --preserve-tree `
  --max-depth 2 `
  --tree-limit 50
```

Resume an interrupted sync without fetching completed pages again:

```powershell
python tools/confluence_sync_space.py `
  --full `
  --parent-id <PAGE_OR_FOLDER_ID> `
  --preserve-tree `
  --resume
```

Why this script is the default:

- It supports subtree sync with `--parent-id`.
- It writes Markdown files into a readable local tree.
- It downloads Confluence image attachments through the Atlassian proxy URL that works with API tokens.
- It reuses `html_to_md.py` for Confluence storage-to-Markdown conversion.
- It logs each page while crawling the tree so long syncs do not look stuck.

## Fetch One Page For AI/OCR

Use this only when you need JSON context for AI processing or OCR text from images:

```powershell
python tools/confluence_fetch_with_ocr.py `
  --url "https://your-domain.atlassian.net/wiki/spaces/SPACE/pages/<PAGE_ID>" `
  --json-out docs/confluence-data/confluence-<PAGE_ID>-direct.json
```

This is not the standard document sync flow.

## Inspect Page Tree Metadata

Use this only when you need parent/sibling metadata for one page:

```powershell
python tools/confluence_fetch_tree.py `
  --page-id <PAGE_ID> `
  --site-root "https://your-domain.atlassian.net" `
  --out docs/confluence-data/confluence-<PAGE_ID>-tree.json
```

## Push Markdown To Confluence

Dry-run first:

```powershell
python tools/confluence_md.py --file <path-to.md> --parent-id <PARENT_PAGE_ID> --dry-run
```

Publish:

```powershell
python tools/confluence_md.py --file <path-to.md> --parent-id <PARENT_PAGE_ID>
```

For a folder:

```powershell
python tools/confluence_push_folder.py --folder <folder> --parent-id <PARENT_PAGE_ID> --recursive --dry-run
python tools/confluence_push_folder.py --folder <folder> --parent-id <PARENT_PAGE_ID> --recursive
```

## Legacy Scripts

Scripts moved to `tools/legacy/` are kept for compatibility only. Do not use them for new workflows.

In particular, `tools/legacy/confluence_fetch_page.py` overlaps with `confluence_sync_space.py`. Prefer `confluence_sync_space.py` for sync-down.
