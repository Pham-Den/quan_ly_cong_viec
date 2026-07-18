#!/usr/bin/env python3
"""Sync Jira issues to local JSON + Markdown snapshots.

Each synced issue is written as a self-contained folder:

    project/docs/jira/issues/<ISSUE_KEY>/
      <ISSUE_KEY>.json
      <ISSUE_KEY>.md
      images/<downloaded image attachments>

The Markdown renderer preserves Jira ADF tables, inline media references,
comments, and normal rich-text marks closely enough for local review.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import requests

from credentials import get_env, load_atlassian_credentials


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_JIRA_ROOT = ROOT / "project" / "docs" / "jira"
APPLICATION_JSON = "application/json"

DEFAULT_FIELDS = [
    "summary",
    "status",
    "assignee",
    "description",
    "comment",
    "attachment",
    "issuetype",
    "priority",
    "labels",
    "updated",
    "fixVersions",
    "parent",
    "customfield_10018",  # Sprint
    "customfield_10001",  # Team (FDP_AI_Squad_1/2/3)
    "customfield_10234",  # Plan Dev Done
    "customfield_10056",  # QC Assignee
]


def safe_filename(name: str) -> str:
    """Return a Windows-safe filename while keeping it readable."""
    cleaned = re.sub(r'[\\/*?:"<>|]', "-", name or "attachment")
    cleaned = re.sub(r"\s+", " ", cleaned).strip().rstrip(".")
    return cleaned[:180] or "attachment"


def unique_filename(base_dir: Path, filename: str, used: set[str]) -> str:
    candidate = safe_filename(filename)
    stem = Path(candidate).stem or "attachment"
    suffix = Path(candidate).suffix
    index = 2
    while candidate.lower() in used:
        candidate = f"{stem}-{index}{suffix}"
        index += 1
    used.add(candidate.lower())
    return candidate


def markdown_target(path: str) -> str:
    normalized = path.replace("\\", "/")
    return f"<{normalized}>"


def escape_table_cell(text: str) -> str:
    value = re.sub(r"\n{2,}", "<br><br>", text.strip())
    value = value.replace("\n", "<br>")
    value = value.replace("|", r"\|")
    return value or " "


def escape_alt_text(text: str) -> str:
    return (text or "").replace("[", r"\[").replace("]", r"\]")


def render_inline_children(nodes: list[dict[str, Any]], context: dict[str, Any]) -> str:
    return "".join(render_node(node, context, inline=True) for node in nodes)


def render_blocks(nodes: list[dict[str, Any]], context: dict[str, Any]) -> str:
    parts = []
    for node in nodes:
        rendered = render_node(node, context, inline=False).strip()
        if rendered:
            parts.append(rendered)
    return "\n\n".join(parts)


def apply_text_marks(text: str, marks: list[dict[str, Any]]) -> str:
    link_href = ""
    result = text
    for mark in marks or []:
        mark_type = mark.get("type")
        attrs = mark.get("attrs") or {}
        if mark_type == "link":
            link_href = attrs.get("href", "")
        elif mark_type == "strong":
            result = f"**{result}**"
        elif mark_type == "em":
            result = f"*{result}*"
        elif mark_type == "code":
            result = f"`{result}`"
        elif mark_type == "strike":
            result = f"~~{result}~~"
        elif mark_type == "underline":
            result = f"<u>{result}</u>"
    if link_href:
        result = f"[{result}]({link_href})"
    return result


def render_list(node: dict[str, Any], context: dict[str, Any], ordered: bool) -> str:
    lines: list[str] = []
    start = int((node.get("attrs") or {}).get("order") or 1)
    for offset, item in enumerate(node.get("content") or []):
        raw = render_list_item(item, context).strip()
        if not raw:
            continue
        item_lines = raw.splitlines()
        marker = f"{start + offset}." if ordered else "-"
        lines.append(f"{marker} {item_lines[0]}")
        for continuation in item_lines[1:]:
            lines.append(f"   {continuation}")
    return "\n".join(lines)


def render_list_item(node: dict[str, Any], context: dict[str, Any]) -> str:
    parts = []
    for child in node.get("content") or []:
        rendered = render_node(child, context, inline=False).strip()
        if rendered:
            parts.append(rendered)
    return "\n".join(parts)


def render_table(node: dict[str, Any], context: dict[str, Any]) -> str:
    rows = [row for row in node.get("content") or [] if row.get("type") == "tableRow"]
    if not rows:
        return ""

    grid: dict[tuple[int, int], str] = {}
    max_col = 0
    for row_index, row in enumerate(rows):
        col_index = 0
        for cell in row.get("content") or []:
            if cell.get("type") not in {"tableCell", "tableHeader"}:
                continue
            while (row_index, col_index) in grid:
                col_index += 1
            attrs = cell.get("attrs") or {}
            rowspan = int(attrs.get("rowspan") or 1)
            colspan = int(attrs.get("colspan") or 1)
            text = render_blocks(cell.get("content") or [], context)
            value = escape_table_cell(text)
            for row_offset in range(rowspan):
                for col_offset in range(colspan):
                    grid[(row_index + row_offset, col_index + col_offset)] = value
                    max_col = max(max_col, col_index + col_offset)
            col_index += colspan

    if not grid:
        return ""

    rendered_rows = []
    row_count = max(row for row, _ in grid.keys()) + 1
    col_count = max_col + 1
    for row_index in range(row_count):
        rendered_rows.append([grid.get((row_index, col_index), " ") for col_index in range(col_count)])

    header = rendered_rows[0]
    separator = ["---"] * col_count
    lines = [
        "| " + " | ".join(header) + " |",
        "| " + " | ".join(separator) + " |",
    ]
    for row in rendered_rows[1:]:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def find_attachment(attrs: dict[str, Any], context: dict[str, Any]) -> dict[str, Any] | None:
    attachment_id = str(attrs.get("id") or "")
    alt = str(attrs.get("alt") or "")
    by_id = context.get("attachments_by_id") or {}
    by_name = context.get("attachments_by_name") or {}
    return by_id.get(attachment_id) or by_name.get(alt) or by_name.get(safe_filename(alt))


def render_media(node: dict[str, Any], context: dict[str, Any]) -> str:
    attrs = node.get("attrs") or {}
    attachment = find_attachment(attrs, context)
    alt = attrs.get("alt") or (attachment or {}).get("filename") or attrs.get("id") or "attachment"
    if attachment and attachment.get("local_path"):
        return f"![{escape_alt_text(alt)}]({markdown_target(attachment['local_path'])})"
    if attachment and attachment.get("content_url"):
        return f"[{attachment.get('filename')}]({attachment.get('content_url')})"
    if attrs.get("url"):
        return f"[{alt}]({attrs['url']})"
    return f"![{escape_alt_text(alt)}]({markdown_target(str(alt))})"


def render_panel(node: dict[str, Any], context: dict[str, Any]) -> str:
    panel_type = (node.get("attrs") or {}).get("panelType", "panel")
    body = render_blocks(node.get("content") or [], context)
    lines = [f"> **{panel_type.title()}:**"]
    lines.extend(f"> {line}" if line else ">" for line in body.splitlines())
    return "\n".join(lines)


def render_node(node: dict[str, Any], context: dict[str, Any], inline: bool = False) -> str:
    node_type = node.get("type")
    content = node.get("content") or []
    attrs = node.get("attrs") or {}

    if node_type == "doc":
        return render_blocks(content, context)
    if node_type == "text":
        return apply_text_marks(node.get("text", ""), node.get("marks") or [])
    if node_type == "hardBreak":
        return "\n" if inline else "\n\n"
    if node_type == "paragraph":
        return render_inline_children(content, context).strip()
    if node_type == "heading":
        level = int(attrs.get("level") or 2)
        return f"{'#' * max(1, min(level, 6))} {render_inline_children(content, context).strip()}"
    if node_type == "bulletList":
        return render_list(node, context, ordered=False)
    if node_type == "orderedList":
        return render_list(node, context, ordered=True)
    if node_type == "listItem":
        return render_list_item(node, context)
    if node_type == "blockquote":
        body = render_blocks(content, context)
        return "\n".join(f"> {line}" if line else ">" for line in body.splitlines())
    if node_type == "codeBlock":
        language = attrs.get("language", "")
        code = "".join(child.get("text", "") for child in content if child.get("type") == "text")
        return f"```{language}\n{code}\n```"
    if node_type == "rule":
        return "---"
    if node_type == "table":
        return render_table(node, context)
    if node_type in {"tableRow", "tableCell", "tableHeader"}:
        return render_blocks(content, context)
    if node_type in {"mediaSingle", "mediaGroup"}:
        return render_blocks(content, context)
    if node_type == "media":
        return render_media(node, context)
    if node_type == "panel":
        return render_panel(node, context)
    if node_type == "mention":
        return attrs.get("text") or attrs.get("id") or ""
    if node_type == "emoji":
        return attrs.get("shortName") or attrs.get("text") or ""
    if node_type in {"inlineCard", "blockCard", "embedCard"}:
        url = attrs.get("url", "")
        return f"<{url}>" if url else ""
    if node_type == "status":
        return attrs.get("text", "")
    if node_type == "date":
        return attrs.get("timestamp", "")
    if node_type == "expand":
        title = attrs.get("title", "Expand")
        body = render_blocks(content, context)
        return f"**{title}**\n\n{body}".strip()
    if content:
        return render_inline_children(content, context) if inline else render_blocks(content, context)
    return ""


def adf_to_markdown(adf: dict[str, Any], context: dict[str, Any] | None = None) -> str:
    """Convert Jira Atlassian Document Format (ADF) to Markdown."""
    if not adf or not isinstance(adf, dict) or "content" not in adf:
        return ""
    ctx = context or {"attachments_by_id": {}, "attachments_by_name": {}}
    result = render_node(adf, ctx).strip()
    result = re.sub(r"\n{4,}", "\n\n\n", result)
    return "\n".join(line.rstrip() for line in result.splitlines()).strip()


def _extract_fields(issue: dict[str, Any]) -> tuple[dict[str, Any], str, str, str, str, str, str | None, str | None]:
    """Extract commonly used display fields from a raw Jira issue."""
    fields = issue.get("fields", {})
    key = issue.get("key", "")
    summary = (fields.get("summary") or "").replace("|", "/")
    status = (fields.get("status") or {}).get("name", "")
    assignee = (fields.get("assignee") or {}).get("displayName") or "—"
    qc_assignee = (fields.get("customfield_10056") or {}).get("displayName") or "—"
    team_raw = fields.get("customfield_10001") or {}
    team = team_raw.get("name", "—") if isinstance(team_raw, dict) else "—"
    plan_dev_done = fields.get("customfield_10234") or "—"
    return fields, key, summary, status, assignee, qc_assignee, team, plan_dev_done


def search_issues(base_url: str, auth: tuple[str, str], jql: str, fields: list[str], max_results: int) -> dict:
    url = f"{base_url}/rest/api/3/search/jql"
    payload = {"jql": jql, "fields": fields, "maxResults": max_results}
    response = requests.post(
        url,
        auth=auth,
        headers={"Content-Type": APPLICATION_JSON, "Accept": APPLICATION_JSON},
        json=payload,
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


def get_issue(base_url: str, auth: tuple[str, str], issue_key: str, fields: list[str]) -> dict:
    url = f"{base_url}/rest/api/3/issue/{issue_key}"
    response = requests.get(
        url,
        auth=auth,
        headers={"Accept": APPLICATION_JSON},
        params={"fields": ",".join(fields)},
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


def download_issue_images(issue: dict[str, Any], auth: tuple[str, str], issue_dir: Path, skip_images: bool) -> list[dict[str, Any]]:
    attachments = issue.get("fields", {}).get("attachment") or []
    image_dir = issue_dir / "images"
    used_names: set[str] = set()
    records: list[dict[str, Any]] = []

    for item in attachments:
        original_filename = item.get("filename") or f"attachment-{item.get('id', '')}"
        mime_type = item.get("mimeType") or ""
        safe_name = unique_filename(image_dir, original_filename, used_names)
        record = {
            "id": str(item.get("id") or ""),
            "filename": original_filename,
            "safe_filename": safe_name,
            "mime_type": mime_type,
            "size": item.get("size"),
            "content_url": item.get("content"),
            "local_path": None,
            "downloaded": False,
        }

        if not skip_images and mime_type.startswith("image/") and item.get("content"):
            image_dir.mkdir(parents=True, exist_ok=True)
            target = image_dir / safe_name
            try:
                response = requests.get(item["content"], auth=auth, timeout=60, allow_redirects=True)
                response.raise_for_status()
                target.write_bytes(response.content)
                record["local_path"] = f"images/{safe_name}"
                record["downloaded"] = True
            except Exception as exc:
                record["download_error"] = str(exc)
                print(f"    [warn] Cannot download {original_filename}: {exc}")

        records.append(record)

    return records


def build_attachment_context(records: list[dict[str, Any]]) -> dict[str, Any]:
    by_id: dict[str, dict[str, Any]] = {}
    by_name: dict[str, dict[str, Any]] = {}
    for record in records:
        if record.get("id"):
            by_id[str(record["id"])] = record
        by_name[str(record.get("filename") or "")] = record
        by_name[str(record.get("safe_filename") or "")] = record
    return {"attachments_by_id": by_id, "attachments_by_name": by_name}


def comment_entries(fields: dict[str, Any], context: dict[str, Any]) -> list[dict[str, Any]]:
    raw_comment = fields.get("comment") or {}
    entries = []
    for index, comment in enumerate(raw_comment.get("comments") or [], start=1):
        body = comment.get("body")
        entries.append(
            {
                "index": index,
                "id": comment.get("id"),
                "author": ((comment.get("author") or {}).get("displayName") or "—"),
                "created": comment.get("created"),
                "updated": comment.get("updated"),
                "body_md": adf_to_markdown(body, context) if isinstance(body, dict) else (body or ""),
                "body_adf": body if isinstance(body, dict) else None,
            }
        )
    return entries


def minimal_issue_json(issue: dict[str, Any], attachment_records: list[dict[str, Any]], context: dict[str, Any]) -> dict:
    """Extract relevant fields into a readable JSON structure while preserving ADF."""
    fields = issue.get("fields", {})

    sprint_raw = fields.get("customfield_10018") or []
    sprint = [s.get("name") for s in sprint_raw if isinstance(s, dict) and "name" in s] or None

    fix_versions = [v.get("name") for v in (fields.get("fixVersions") or []) if "name" in v]
    parent = fields.get("parent")
    parent_key = parent.get("key") if parent and isinstance(parent, dict) else None

    team_field = fields.get("customfield_10001") or {}
    team = team_field.get("name") if isinstance(team_field, dict) else None

    plan_dev_done = fields.get("customfield_10234")

    qc_assignee_field = fields.get("customfield_10056") or {}
    qc_assignee = qc_assignee_field.get("displayName") if isinstance(qc_assignee_field, dict) else None

    desc_raw = fields.get("description")
    description_md = adf_to_markdown(desc_raw, context) if isinstance(desc_raw, dict) else (desc_raw or "")

    return {
        "key": issue.get("key"),
        "summary": fields.get("summary"),
        "status": (fields.get("status") or {}).get("name"),
        "assignee": (fields.get("assignee") or {}).get("displayName"),
        "qc_assignee": qc_assignee,
        "priority": (fields.get("priority") or {}).get("name"),
        "labels": fields.get("labels"),
        "updated": fields.get("updated"),
        "sprint": sprint,
        "fixVersions": fix_versions,
        "parent": parent_key,
        "team": team,
        "plan_dev_done": plan_dev_done,
        "description_md": description_md,
        "description_adf": desc_raw if isinstance(desc_raw, dict) else None,
        "attachments": attachment_records,
        "comments": comment_entries(fields, context),
    }


def issue_markdown(issue: dict[str, Any], base_url: str, attachment_records: list[dict[str, Any]], context: dict[str, Any]) -> str:
    fields, key, summary, status, assignee, qc_assignee, team, plan_dev_done = _extract_fields(issue)
    priority = (fields.get("priority") or {}).get("name", "—")
    labels = ", ".join(fields.get("labels") or []) or "—"
    updated = fields.get("updated", "—")
    fix_versions = ", ".join(v.get("name", "") for v in (fields.get("fixVersions") or []) if "name" in v) or "—"
    parent = fields.get("parent")
    parent_key = parent.get("key") if isinstance(parent, dict) else "—"
    issue_url = f"{base_url.rstrip('/')}/browse/{key}"

    lines = [
        f"# Jira Issue — {key}",
        "",
        f"<{issue_url}>",
        "",
        f"**{summary}**",
        "",
        "| Field | Value |",
        "|---|---|",
        f"| Status | {status} |",
        f"| Priority | {priority} |",
        f"| Assignee (Dev) | {assignee} |",
        f"| QC Assignee | {qc_assignee} |",
        f"| Team | {team} |",
        f"| Plan Dev Done | {plan_dev_done} |",
        f"| Fix Versions | {fix_versions} |",
        f"| Labels | {labels} |",
        f"| Parent | {parent_key} |",
        f"| Updated | {updated} |",
        "",
    ]

    desc = fields.get("description")
    description_md = adf_to_markdown(desc, context) if isinstance(desc, dict) else (desc or "")
    if description_md.strip():
        lines += ["## Description", "", description_md.strip(), ""]

    if attachment_records:
        lines += [
            "## Attachments",
            "",
            "| File | Type | Local Path |",
            "|---|---|---|",
        ]
        for record in attachment_records:
            local = record.get("local_path")
            local_text = f"[{record['safe_filename']}]({markdown_target(local)})" if local else "—"
            lines.append(f"| {record['filename']} | {record.get('mime_type') or '—'} | {local_text} |")
        lines.append("")

    comments = comment_entries(fields, context)
    if comments:
        lines += ["## Comments", ""]
        for comment in comments:
            lines += [
                f"### Comment {comment['index']} — {comment['author']}",
                "",
                f"- Created: `{comment.get('created') or '—'}`",
                f"- Updated: `{comment.get('updated') or '—'}`",
                "",
                comment.get("body_md") or "",
                "",
            ]

    return "\n".join(lines).rstrip() + "\n"


def write_issue_snapshot(
    issue: dict[str, Any],
    base_url: str,
    auth: tuple[str, str],
    issue_root: Path,
    skip_images: bool,
) -> tuple[Path, Path, int]:
    key = issue.get("key", "")
    issue_dir = issue_root / key
    issue_dir.mkdir(parents=True, exist_ok=True)
    attachment_records = download_issue_images(issue, auth, issue_dir, skip_images)
    context = build_attachment_context(attachment_records)

    json_path = issue_dir / f"{key}.json"
    md_path = issue_dir / f"{key}.md"
    json_path.write_text(
        json.dumps(minimal_issue_json(issue, attachment_records, context), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    md_path.write_text(issue_markdown(issue, base_url, attachment_records, context), encoding="utf-8")
    image_count = sum(1 for record in attachment_records if record.get("downloaded"))
    return json_path, md_path, image_count


def write_search_markdown(out_path: Path, title: str, issues: list[dict[str, Any]], query_text: str) -> None:
    """Write a lightweight search index; per-issue folders contain full content."""
    lines: list[str] = [
        f"# {title}",
        "",
        f"- **Query:** `{query_text}`",
        f"- **Total:** {len(issues)}",
        "",
        "## Overview",
        "",
        "| Key | Summary | Status | Assignee (Dev) | QC Assignee | Team | Plan Dev Done |",
        "|---|---|---|---|---|---|---|",
    ]
    for issue in issues:
        fields, key, summary, status, assignee, qc_assignee, team, plan_dev_done = _extract_fields(issue)
        issue_link = f"../issues/{key}/{key}.md"
        lines.append(
            f"| [{key}]({issue_link}) | {summary} | {status} | {assignee} | {qc_assignee} | {team} | {plan_dev_done} |"
        )

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def resolve_jira_root(argument: str) -> Path:
    if not argument:
        return DEFAULT_JIRA_ROOT
    path = Path(argument)
    return path if path.is_absolute() else ROOT / path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jql", default="", help="Custom JQL to sync")
    parser.add_argument("--project", default="", help="Override JIRA_PROJECT_KEY")
    parser.add_argument("--issue", default="", help="Fetch a single issue key")
    parser.add_argument("--max-results", type=int, default=50, help="Search result cap")
    parser.add_argument("--fields", nargs="*", default=DEFAULT_FIELDS, help="Fields to fetch")
    parser.add_argument("--out", default="", help="Output root for Jira snapshots (default: project/docs/jira)")
    parser.add_argument("--skip-images", action="store_true", help="Do not download image attachments")
    args = parser.parse_args()

    email, token, base_url = load_atlassian_credentials()
    project_key = args.project or get_env("JIRA_PROJECT_KEY")
    auth = (email, token)

    jira_root = resolve_jira_root(args.out)
    search_dir = jira_root / "searches"
    issue_dir = jira_root / "issues"
    search_dir.mkdir(parents=True, exist_ok=True)
    issue_dir.mkdir(parents=True, exist_ok=True)

    if args.issue:
        issue = get_issue(base_url, auth, args.issue, args.fields)
        json_path, md_path, image_count = write_issue_snapshot(issue, base_url, auth, issue_dir, args.skip_images)
        print(f"JSON_SAVED: {json_path}")
        print(f"MD_SAVED: {md_path}")
        print(f"IMAGES_SAVED: {image_count}")
        return

    jql = args.jql or f"project = {project_key} ORDER BY updated DESC"
    result = search_issues(base_url, auth, jql, args.fields, args.max_results)
    issues = result.get("issues", [])
    safe_name = "jira-search-" + str(abs(hash(jql)))
    json_path = search_dir / f"{safe_name}.json"
    md_path = search_dir / f"{safe_name}.md"

    issues_min = []
    image_total = 0
    for issue in issues:
        _, _, image_count = write_issue_snapshot(issue, base_url, auth, issue_dir, args.skip_images)
        image_total += image_count
        issues_min.append({"key": issue.get("key"), "summary": (issue.get("fields") or {}).get("summary")})

    json_path.write_text(json.dumps(issues_min, ensure_ascii=False, indent=2), encoding="utf-8")
    write_search_markdown(md_path, "Jira Search Result", issues, jql)
    print(f"JSON_SAVED: {json_path}")
    print(f"MD_SAVED: {md_path}")
    print(f"TOTAL: {len(issues)}")
    print(f"ISSUE_FOLDERS: {len(issues)}")
    print(f"IMAGES_SAVED: {image_total}")


if __name__ == "__main__":
    main()
