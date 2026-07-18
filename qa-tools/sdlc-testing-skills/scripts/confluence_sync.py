#!/usr/bin/env python3
"""Sync Confluence pages to local Markdown snapshots."""

from __future__ import annotations

import argparse
import html
import re
from pathlib import Path

import requests

from credentials import load_atlassian_credentials

ROOT = Path(__file__).resolve().parent.parent
CONFLUENCE_ROOT = ROOT / "project" / "docs" / "confluence"
APPLICATION_JSON = "application/json"


_LT = "\x00LT\x00"  # placeholder for literal < (from &lt; entities in source)
_GT = "\x00GT\x00"  # placeholder for literal > (from &gt; entities in source)

_excerpt_cache: dict[str, str | None] = {}  # (space:title:name) → raw storage XML or None


def _fetch_named_excerpt(base_url: str, auth: tuple[str, str], space_key: str, page_title: str, excerpt_name: str) -> str | None:
    """Return the raw storage XML body of a named excerpt macro in the given page, or None."""
    cache_key = f"{space_key}:{page_title}:{excerpt_name}"
    if cache_key in _excerpt_cache:
        return _excerpt_cache[cache_key]

    # Search for the page by title in the space
    url = f"{base_url}/wiki/rest/api/content/search"
    # Escape double-quotes inside title for CQL
    safe_title = page_title.replace('"', '\\"')
    cql = f'space="{space_key}" AND title="{safe_title}" AND type=page'
    resp = requests.get(
        url, auth=auth,
        headers={"Accept": APPLICATION_JSON},
        params={"cql": cql, "limit": 1, "expand": "body.storage"},
        timeout=30,
    )
    if resp.status_code != 200 or not resp.json().get("results"):
        _excerpt_cache[cache_key] = None
        return None

    body_raw = resp.json()["results"][0].get("body", {}).get("storage", {}).get("value", "")

    # Find <ac:structured-macro ac:name="excerpt"> with matching name param
    result: str | None = None
    for m in re.finditer(r'<ac:structured-macro ac:name="excerpt"[^>]*>.*?</ac:structured-macro>', body_raw, re.DOTALL):
        name_m = re.search(r'<ac:parameter ac:name="name">(.*?)</ac:parameter>', m.group(0))
        if name_m and name_m.group(1).strip() == excerpt_name:
            body_m = re.search(r"<ac:rich-text-body>(.*?)</ac:rich-text-body>", m.group(0), re.DOTALL)
            result = body_m.group(1) if body_m else ""
            break

    _excerpt_cache[cache_key] = result
    return result


def _strip_tags(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text)


def _extract_cdata(text: str) -> str:
    """Return CDATA content from a Confluence plain-text-body, or empty string."""
    m = re.search(r"<!\[CDATA\[(.*?)]]>", text, re.DOTALL)
    return m.group(1) if m else text


def _extract_jira_key(macro_html: str) -> str:
    m = re.search(r'<ac:parameter ac:name="key">(.*?)</ac:parameter>', macro_html)
    return f"[{m.group(1)}]" if m else ""


def _extract_status_title(macro_html: str) -> str:
    m = re.search(r'<ac:parameter ac:name="title">(.*?)</ac:parameter>', macro_html)
    return f"**{m.group(1)}**" if m else ""


def _handle_ac_link(m: re.Match) -> str:
    """Extract <ac:link-body> text; remove user/page links that have no body."""
    body_m = re.search(r"<ac:link-body>(.*?)</ac:link-body>", m.group(0), re.DOTALL)
    return body_m.group(1) if body_m else ""


def _flatten_md_tables_in_cell(t: str) -> str:
    """Convert any already-converted markdown table rows to plain text.

    The innermost-first loop may have converted a nested <table> to markdown
    before the outer table calls _cell_html_to_md.  The resulting pipe chars
    break the outer table structure.  This function turns each data row into
    'col1 · col2 · col3' text and drops separator rows.
    """
    result_lines: list[str] = []
    for line in t.split("\n"):
        stripped = line.strip()
        if not stripped:
            result_lines.append(line)
            continue
        # Markdown separator row: | --- | :---: | --- |
        if stripped.startswith("|") and re.match(r"^\|[\s|:=-]+\|$", stripped):
            continue
        # Markdown data row: | cell | cell |
        if stripped.startswith("|") and stripped.endswith("|"):
            cells = [c.strip() for c in stripped.split("|")[1:-1] if c.strip()]
            if cells:
                result_lines.append(" · ".join(cells))
        else:
            result_lines.append(line)
    return "\n".join(result_lines)


def _cell_html_to_md(html_content: str) -> str:
    """Convert inner HTML of a table cell to a single-line Markdown string."""
    t = html_content
    # Time elements → show date value
    t = re.sub(r'<time[^>]+datetime="([^"]+)"[^>]*/>', r"\1", t)
    # ac:link — single pass: keep link-body text, remove bare user/page refs
    # Using a single regex to avoid cross-element matching issues
    t = re.sub(r"<ac:link[^>]*>.*?</ac:link>", _handle_ac_link, t, flags=re.DOTALL)
    # Jira macros → show key
    t = re.sub(
        r'<ac:structured-macro ac:name="jira"[^>]*>.*?</ac:structured-macro>',
        lambda m: _extract_jira_key(m.group(0)), t, flags=re.DOTALL,
    )
    # Status macros → show title
    t = re.sub(
        r'<ac:structured-macro ac:name="status"[^>]*>.*?</ac:structured-macro>',
        lambda m: _extract_status_title(m.group(0)), t, flags=re.DOTALL,
    )
    # Other macros → remove
    t = re.sub(r"<ac:structured-macro[^>]*>.*?</ac:structured-macro>", "", t, flags=re.DOTALL)
    # Self-closing ac:/ri: tags → remove
    t = re.sub(r"<ac:[^>]+/>", "", t)
    t = re.sub(r"<ri:[^>]+/>", "", t)
    # Inline code
    t = re.sub(r"<code>(.*?)</code>", r"`\1`", t, flags=re.DOTALL)
    # Bold
    t = re.sub(r"<(?:strong|b)[^>]*>(.*?)</(?:strong|b)>", r"**\1**", t, flags=re.DOTALL)
    # Italic
    t = re.sub(r"<(?:em|i)[^>]*>(.*?)</(?:em|i)>", r"*\1*", t, flags=re.DOTALL)
    # Links
    t = re.sub(r'<a[^>]+href=["\'](.*?)["\'][^>]*>(.*?)</a>', r"[\2](\1)", t, flags=re.DOTALL)
    # Headings inside cell → bold (not heading markers)
    for i in range(6, 0, -1):
        t = re.sub(
            rf"<h{i}[^>]*>(.*?)</h{i}>",
            lambda m: "**" + _strip_tags(m.group(1)).strip() + "**",
            t, flags=re.DOTALL,
        )
    # Span → strip tag keep content
    t = re.sub(r"<span[^>]*>(.*?)</span>", r"\1", t, flags=re.DOTALL)
    # List items → bullet with semicolon separator (single-line friendly)
    t = re.sub(
        r"<li[^>]*>(.*?)</li>",
        lambda m: "• " + _strip_tags(m.group(1)).strip() + "; ",
        t, flags=re.DOTALL,
    )
    t = re.sub(r"<[ou]l[^>]*>|</[ou]l>", "", t)
    # Paragraphs → inline with space
    t = re.sub(r"<p[^>]*>(.*?)</p>", lambda m: m.group(1).strip() + " ", t, flags=re.DOTALL)
    t = re.sub(r"<br\s*/?>", " ", t)
    # Strip remaining tags
    t = re.sub(r"<[^>]+>", "", t)
    # Flatten any markdown tables that innermost-first loop embedded into this cell
    # (their | pipe chars would break the outer table structure)
    t = _flatten_md_tables_in_cell(t)
    # Normalize whitespace to single line
    return " ".join(t.split())


def _cell_html_to_md_rich(html_content: str) -> str:
    """Convert cell HTML to multi-line Markdown, preserving headings, lists, tables."""
    t = html_content
    t = re.sub(r'<time[^>]+datetime="([^"]+)"[^>]*/>', r"\1", t)
    t = re.sub(r"<ac:link[^>]*>.*?</ac:link>", _handle_ac_link, t, flags=re.DOTALL)
    t = re.sub(
        r'<ac:structured-macro ac:name="jira"[^>]*>.*?</ac:structured-macro>',
        lambda m: _extract_jira_key(m.group(0)), t, flags=re.DOTALL,
    )
    t = re.sub(
        r'<ac:structured-macro ac:name="status"[^>]*>.*?</ac:structured-macro>',
        lambda m: _extract_status_title(m.group(0)), t, flags=re.DOTALL,
    )
    t = re.sub(r"<ac:structured-macro[^>]*>.*?</ac:structured-macro>", "", t, flags=re.DOTALL)
    t = re.sub(r"<ac:[^>]+/>", "", t)
    t = re.sub(r"<ri:[^>]+/>", "", t)
    t = re.sub(r"<code>(.*?)</code>", r"`\1`", t, flags=re.DOTALL)
    t = re.sub(r"<(?:strong|b)[^>]*>(.*?)</(?:strong|b)>", r"**\1**", t, flags=re.DOTALL)
    t = re.sub(r"<(?:em|i)[^>]*>(.*?)</(?:em|i)>", r"*\1*", t, flags=re.DOTALL)
    t = re.sub(r'<a[^>]+href=["\'](.*?)["\'][^>]*>(.*?)</a>', r"[\2](\1)", t, flags=re.DOTALL)
    # Headings inside rich cell → bold with surrounding newlines
    for i in range(6, 0, -1):
        t = re.sub(
            rf"<h{i}[^>]*>(.*?)</h{i}>",
            lambda m: "\n\n**" + _strip_tags(m.group(1)).strip() + "**\n",
            t, flags=re.DOTALL,
        )
    t = re.sub(r"<span[^>]*>(.*?)</span>", r"\1", t, flags=re.DOTALL)
    # List items → bullet points with newlines
    t = re.sub(
        r"<li[^>]*>(.*?)</li>",
        lambda m: "\n- " + _strip_tags(m.group(1)).strip(),
        t, flags=re.DOTALL,
    )
    t = re.sub(r"<[ou]l[^>]*>", "\n", t)
    t = re.sub(r"</[ou]l>", "\n", t)
    # Paragraphs → newline-separated
    t = re.sub(r"<p[^>]*>(.*?)</p>", lambda m: m.group(1).strip() + "\n", t, flags=re.DOTALL)
    t = re.sub(r"<br\s*/?>", "\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    # Collapse 3+ newlines → 2
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def _is_template_table(table_html: str) -> bool:
    """Return True if this table is a label-value template (th+td mixed rows).

    Heuristic: majority of rows have one <th> label and one or more <td> values.
    This pattern almost exclusively identifies US/spec template tables in Confluence.
    The old secondary check (requiring headings or pre-converted MD table rows in a TD)
    caused US tables WITHOUT nested inner tables to fall through to the regular
    _table_to_markdown() path, missing the hybrid rich-content rendering.  Removing
    that check makes all th+td mixed-row tables use _template_table_to_sections()
    which renders simple rows as table rows and list-rich rows as prose subsections.
    """
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table_html, re.DOTALL)
    if len(rows) < 2:
        return False
    mixed_rows = sum(
        1 for r in rows
        if re.search(r"<th[^>]*>", r) and re.search(r"<td[^>]*>", r)
    )
    return mixed_rows >= len(rows) * 0.5


def _template_table_to_sections(table_html: str) -> str:
    """Render a label-value template table using a hybrid format.

    Rows whose TD contains only short/inline content (no <ol>/<ul> lists) are
    rendered as rows in a 2-column Markdown table — matching Confluence's visual
    layout and consistent with US tables that bypass _is_template_table().

    Rows whose TD contains <ol>/<ul> list content (typically Acceptance Criteria,
    Post condition, Corner case) are rendered as prose subsections with proper
    indented Markdown lists so they remain readable.  A section label is rendered
    as a bold heading; the list content follows on its own lines.
    """
    table_html = re.sub(r"<(th|td)([^>]*?)\s*/>", r"<\1\2></\1>", table_html)

    # Two buckets kept in original row order:
    #   table_rows  → simple (label, single-line value) pairs
    #   rich_blocks → (label, multi-line markdown) pairs
    # We output the table block first, then rich blocks.
    table_rows: list[tuple[str, str]] = []
    rich_blocks: list[tuple[str, str]] = []

    for row_m in re.finditer(r"<tr[^>]*>(.*?)</tr>", table_html, re.DOTALL):
        row_html = row_m.group(1)
        th_m = re.search(r"<th[^>]*>(.*?)</th>", row_html, re.DOTALL)
        td_m = re.search(r"<td[^>]*>(.*?)</td>", row_html, re.DOTALL)

        label = _cell_html_to_md(th_m.group(1)) if th_m else ""
        td_html = td_m.group(1) if td_m else ""
        has_list = bool(re.search(r"<[ou]l[^>]*>", td_html, re.IGNORECASE))

        if has_list:
            rich_blocks.append((label, _cell_html_to_md_rich(td_html)))
        else:
            value = _cell_html_to_md(td_html) if td_m else ""
            if th_m or td_m:
                table_rows.append((label, value))

    parts: list[str] = []
    if table_rows:
        lines = ["|  |  |", "| --- | --- |"]
        for label, value in table_rows:
            lines.append(f"| {label} | {value} |")
        parts.append("\n".join(lines))

    for label, content in rich_blocks:
        section = f"\n**{label}**\n\n{content}" if label else content
        parts.append(section)

    return "\n".join(parts)


def _table_to_markdown(table_html: str) -> str:
    """Convert a <table>...</table> block to Markdown.

    Template tables (label-value rows like User story/Preconditions/AC) are rendered
    as prose sections so rich content (nested tables, headings) survives intact.
    All other tables are rendered as standard Markdown tables.
    """
    # Normalize self-closing th/td → paired tags so the main regex matches them
    table_html = re.sub(r"<(th|td)([^>]*?)\s*/>", r"<\1\2></\1>", table_html)

    if _is_template_table(table_html):
        return _template_table_to_sections(table_html)

    rows_data: list[tuple[bool, list[str]]] = []
    for row_m in re.finditer(r"<tr[^>]*>(.*?)</tr>", table_html, re.DOTALL):
        row_html = row_m.group(1)
        is_header = bool(re.search(r"<th[^>]*>", row_html))
        cells: list[str] = []
        for cell_m in re.finditer(r"<(th|td)[^>]*>(.*?)</\1>", row_html, re.DOTALL):
            cells.append(_cell_html_to_md(cell_m.group(2)))
        if cells:
            rows_data.append((is_header, cells))

    if not rows_data:
        return ""

    max_cols = max(len(r[1]) for r in rows_data)
    lines: list[str] = []
    separator_added = False

    for is_header, cells in rows_data:
        padded = cells + [""] * (max_cols - len(cells))
        lines.append("| " + " | ".join(padded) + " |")
        if is_header and not separator_added:
            lines.append("| " + " | ".join("---" for _ in range(max_cols)) + " |")
            separator_added = True

    # If no <th> row found, add separator after first row so Markdown renders as table
    if not separator_added and len(rows_data) > 1:
        lines.insert(1, "| " + " | ".join("---" for _ in range(max_cols)) + " |")

    return "\n" + "\n".join(lines) + "\n"


_attachment_cache: dict[str, dict[str, dict]] = {}  # (base_url+page_id) → attachment map


def _list_page_attachments(base_url: str, auth: tuple[str, str], page_id: str) -> dict[str, dict]:
    """Return dict[filename → {download_url, media_type}] for ALL attachments on a page.

    Results are cached per (base_url, page_id) so a page with multiple images
    only makes one API round-trip instead of one per image.

    Confluence Cloud's direct /wiki/download/ path requires OAuth session.
    The api.atlassian.com/ex/confluence/{cloudId} proxy accepts Basic auth
    (API token). cloudId is extracted from the 'ari' field of the attachment.
    """
    cache_key = f"{base_url}:{page_id}"
    if cache_key in _attachment_cache:
        return _attachment_cache[cache_key]

    url = f"{base_url}/wiki/rest/api/content/{page_id}/child/attachment"
    all_results: list[dict] = []
    start = 0
    limit = 250
    while True:
        resp = requests.get(
            url, auth=auth, headers={"Accept": APPLICATION_JSON},
            params={"limit": limit, "start": start, "expand": "version"}, timeout=30,
        )
        if resp.status_code != 200:
            break
        batch = resp.json().get("results", [])
        all_results.extend(batch)
        if len(batch) < limit:
            break
        start += limit

    # Extract cloudId from ari field (format: ari:cloud:confluence::{cloudId}/...)
    cloud_id = ""
    for item in all_results:
        ari = item.get("ari", "")
        if ari:
            parts = ari.split(":")
            cloud_id = parts[3] if len(parts) >= 4 else ""
            break
    proxy_base = f"https://api.atlassian.com/ex/confluence/{cloud_id}" if cloud_id else base_url

    result: dict[str, dict] = {}
    for item in all_results:
        title = item.get("title", "")
        dl_rel = (item.get("_links") or {}).get("download", "")
        if title and dl_rel:
            rel_path = dl_rel.split("?", 1)[0]
            result[title] = {
                "media_type": (item.get("metadata") or {}).get("mediaType", ""),
                "download_url": f"{proxy_base}/wiki{rel_path}",
            }
    _attachment_cache[cache_key] = result
    return result


def _download_attachment(
    base_url: str,
    auth: tuple[str, str],
    page_id: str,
    filename: str,
    images_dir: Path,
    attachment_map: dict[str, dict] | None = None,
) -> str | None:
    """Download a Confluence page attachment; return the local safe filename, or None on failure.

    Pass attachment_map (pre-fetched via _list_page_attachments) to avoid a redundant
    API call when multiple images on the same page are downloaded in sequence.
    Supports all image formats: PNG, JPG, GIF, WebP, SVG, BMP, TIFF, etc.
    """
    images_dir.mkdir(parents=True, exist_ok=True)
    local_name = safe_name(filename, max_len=200)
    local_path = images_dir / local_name
    if local_path.exists():
        return local_name
    att_map = attachment_map if attachment_map is not None else _list_page_attachments(base_url, auth, page_id)
    item = att_map.get(filename)
    if not item:
        return None
    # Verify it is a downloadable image type (or unknown type — download and let viewer decide)
    mime = item.get("media_type", "")
    if mime and not mime.startswith("image/"):
        return None  # skip non-image attachments (PDF, DOCX, etc.) in <ac:image> blocks
    dl_resp = requests.get(item["download_url"], auth=auth, timeout=60, stream=True)
    if dl_resp.status_code != 200:
        return None
    with open(local_path, "wb") as f:
        for chunk in dl_resp.iter_content(chunk_size=8192):
            f.write(chunk)
    return local_name


def confluence_storage_to_markdown(
    raw: str,
    base_url: str = "",
    auth: tuple[str, str] = (),
    space_key: str = "",
    page_id: str = "",
    images_dir: Path | None = None,
) -> str:
    """Convert Confluence storage-format HTML to Markdown.

    Pass base_url, auth, space_key to enable live resolution of excerpt-include macros.
    Pass page_id + images_dir to download and embed attachment images locally.
    Without them, excerpt-include shows a placeholder note and images are skipped.
    """
    # Preserve HTML-encoded comparison chars before unescape so they aren't
    # mistaken for HTML tags during the stripping passes.
    text = raw.replace("&lt;", _LT).replace("&gt;", _GT)
    text = html.unescape(text)

    # 0a. ac:adf-extension blocks (Confluence Cloud ADF format).
    # These blocks store content twice: once in <ac:adf-content> (ADF) and once
    # in rendered <div class="panelContent"> HTML → causes duplicate output.
    # - panel/note/info nodes: keep only <ac:adf-content>, discard rendered HTML copy.
    # - third-party extension nodes (e.g. PlantUML): extract @startuml...@enduml source.
    # - all others: strip entirely.
    def _adf_extension_handler(m: re.Match) -> str:
        block = m.group(0)
        # Panel/note: extract ADF content, drop rendered duplicate
        if re.search(r'type=["\']panel["\']', block):
            c = re.search(r"<ac:adf-content>(.*?)</ac:adf-content>", block, re.DOTALL)
            return c.group(1) if c else ""
        # PlantUML (or any extension containing @startuml): extract first diagram only
        uml = re.search(r"(@startuml.*?@enduml)", block, re.DOTALL)
        if uml:
            return f"\n```plantuml\n{uml.group(1).strip()}\n```\n"
        return ""

    text = re.sub(
        r"<ac:adf-extension>.*?</ac:adf-extension>",
        _adf_extension_handler, text, flags=re.DOTALL,
    )

    # 0b. TOC macro — replace with placeholder BEFORE expand unwrapping.
    # The toc macro is typically nested inside an expand macro.  The expand regex
    # uses non-greedy .*? which stops at the first </ac:structured-macro> (the toc
    # inner close), consuming the toc before step 5b can intercept it.  Mark it
    # here so it survives expand processing and is filled in at step 10b.
    text = re.sub(
        r'<ac:structured-macro ac:name="toc"[^>]*>.*?</ac:structured-macro>',
        "__TOC_PLACEHOLDER__", text, flags=re.DOTALL,
    )

    # 1. Code macros — extract before any other processing
    def _code_macro(m: re.Match) -> str:
        content = _extract_cdata(m.group(0))
        lang_param = re.search(r'<ac:parameter ac:name="language">(.*?)</ac:parameter>', m.group(0), re.DOTALL)
        lang = lang_param.group(1).strip() if lang_param else ""
        return f"\n```{lang}\n{content}\n```\n"

    text = re.sub(
        r'<ac:structured-macro ac:name="code"[^>]*>.*?</ac:structured-macro>',
        _code_macro, text, flags=re.DOTALL,
    )

    # 1.5. Pre-expand cleanup: remove jira/status/other non-expand structured macros that
    # may be nested inside expand bodies.  The expand regex (step 2) uses non-greedy .*?
    # and stops at the FIRST </ac:structured-macro> — if a jira/view-file/etc. macro sits
    # inside an expand body, the regex terminates at that inner closing tag, yielding only
    # a truncated body.  By processing those inner macros first (iteratively, innermost
    # first) we guarantee that when step 2 runs, no nested structured macros remain inside
    # expand bodies, so the expand regex correctly spans the full body.
    _EXPAND_MACRO_NAMES = frozenset(
        ["expand", "panel", "note", "info", "tip", "warning", "excerpt", "excerpt-include"]
    )

    def _pre_expand_replacer(m: re.Match) -> str:
        name_match = re.search(r'ac:name="([^"]+)"', m.group(0))
        name = name_match.group(1) if name_match else ""
        if name in _EXPAND_MACRO_NAMES:
            return m.group(0)  # preserve; processed by step 2
        if name == "jira":
            return _extract_jira_key(m.group(0))
        if name == "status":
            return _extract_status_title(m.group(0))
        return ""  # view-file, drawio, and any other non-expand macros

    # Use innermost-first regex (no nested <ac:structured-macro inside) so we peel
    # inner macros first — same strategy as the table-processing loop in step 9.
    _inner_macro_re = re.compile(
        r"<ac:structured-macro[^>]*>(?:(?!<ac:structured-macro).)*?</ac:structured-macro>",
        re.DOTALL,
    )
    _prev = None
    while text != _prev:
        _prev = text
        text = _inner_macro_re.sub(_pre_expand_replacer, text)

    # 2. Expand / panel / note / info / tip / warning macros → extract rich-text-body content
    # Inner structured macros have already been cleaned up by step 1.5, so the non-greedy
    # .*? correctly spans the full body of each expand-like macro.
    def _expand_macro(m: re.Match) -> str:
        body_m = re.search(r"<ac:rich-text-body>(.*?)</ac:rich-text-body>", m.group(0), re.DOTALL)
        return body_m.group(1) if body_m else ""

    for _name in ("expand", "panel", "note", "info", "tip", "warning", "excerpt"):
        text = re.sub(
            rf'<ac:structured-macro ac:name="{_name}"[^>]*>.*?</ac:structured-macro>',
            _expand_macro, text, flags=re.DOTALL,
        )

    # 3. Jira macros → show issue key (belt-and-suspenders: catches any jira macros that
    # were not inside an expand body and thus not processed by step 1.5)
    text = re.sub(
        r'<ac:structured-macro ac:name="jira"[^>]*>.*?</ac:structured-macro>',
        lambda m: _extract_jira_key(m.group(0)), text, flags=re.DOTALL,
    )

    # 4. Status macros → show title (same belt-and-suspenders rationale as step 3)
    text = re.sub(
        r'<ac:structured-macro ac:name="status"[^>]*>.*?</ac:structured-macro>',
        lambda m: _extract_status_title(m.group(0)), text, flags=re.DOTALL,
    )

    # 5a. excerpt-include macros — fetch and inline from source page when credentials available
    def _resolve_excerpt(m: re.Match) -> str:
        macro_html = m.group(0)
        page_title_m = re.search(r'ri:content-title="([^"]+)"', macro_html)
        if not page_title_m:
            return ""
        pt = html.unescape(page_title_m.group(1))
        name_m = re.search(r'<ac:parameter ac:name="name">(.*?)</ac:parameter>', macro_html)
        exc_name = name_m.group(1).strip() if name_m else ""
        if base_url and auth and space_key:
            content = _fetch_named_excerpt(base_url, auth, space_key, pt, exc_name)
            if content is not None:
                # Unescape HTML entities so subsequent regex steps work on clean text
                return html.unescape(content)
            return f"\n> *[excerpt-include: {pt} → excerpt '{exc_name}' not found]*\n"
        label = f"{pt}" + (f" → {exc_name}" if exc_name else "")
        return f"\n> *[excerpt-include: {label}]*\n"

    text = re.sub(
        r'<ac:structured-macro ac:name="excerpt-include"[^>]*>.*?</ac:structured-macro>',
        _resolve_excerpt, text, flags=re.DOTALL,
    )

    # 5b. Remove remaining macros (drawio, excerpt, etc.)
    text = re.sub(r"<ac:structured-macro[^>]*>.*?</ac:structured-macro>", "", text, flags=re.DOTALL)

    # 5c. Images — convert to markdown instead of stripping.
    # <ac:image><ri:attachment ri:filename="X.png"/></ac:image> → download + embed locally.
    # <ac:image><ri:url ri:value="https://..."/></ac:image> → inline URL image.
    # Attachment map is fetched once per page (lazy, cached) to avoid N API calls.
    import urllib.parse as _up
    _img_att_map: dict[str, dict] | None = None

    def _get_img_att_map() -> dict[str, dict]:
        nonlocal _img_att_map
        if _img_att_map is None and base_url and auth and page_id:
            _img_att_map = _list_page_attachments(base_url, auth, page_id)
        return _img_att_map or {}

    def _image_handler(m: re.Match) -> str:
        block = m.group(0)
        # External URL image (no auth needed)
        url_m = re.search(r'<ri:url ri:value="([^"]+)"', block)
        if url_m:
            return f"\n![]({url_m.group(1)})\n"
        # Attachment image — supports PNG, JPG, GIF, WebP, SVG, BMP, TIFF, etc.
        att_m = re.search(r'<ri:attachment ri:filename="([^"]+)"', block)
        if att_m:
            filename = att_m.group(1)
            alt_m = re.search(r'ac:alt="([^"]*)"', block)
            alt = alt_m.group(1) if alt_m else filename
            if images_dir is not None:
                local_name = _download_attachment(
                    base_url, auth, page_id, filename, images_dir,
                    attachment_map=_get_img_att_map(),
                )
                if local_name:
                    # URL-encode filename so path survives step-17 HTML tag stripping
                    enc_name = _up.quote(local_name, safe="-._~()")
                    return f"\n![{alt}](images/{page_id}/{enc_name})\n"
            # Fallback: Confluence URL (viewable in browser with active Confluence session)
            if base_url and page_id:
                return f"\n![{alt}]({base_url}/wiki/download/attachments/{page_id}/{_up.quote(filename, safe='')})\n"
        return ""

    text = re.sub(r"<ac:image[^>]*>.*?</ac:image>", _image_handler, text, flags=re.DOTALL)

    # 6. Time elements → show date value
    text = re.sub(r'<time[^>]+datetime="([^"]+)"[^>]*/>', r"\1", text)

    # 7. ac:link — single unified pass (avoids cross-element matching)
    text = re.sub(r"<ac:link[^>]*>.*?</ac:link>", _handle_ac_link, text, flags=re.DOTALL)

    # 8. Self-closing ac: and ri: tags → remove
    text = re.sub(r"<ac:[^>]+/>", "", text)
    text = re.sub(r"<ri:[^>]+/>", "", text)

    # 9. Tables — must happen BEFORE headings so cell headings become bold not ## markers.
    # Process innermost tables first (no nested <table> inside) to handle nesting correctly.
    _inner_table = re.compile(r"<table[^>]*>(?:(?!<table).)*?</table>", re.DOTALL)
    prev = None
    while text != prev:
        prev = text
        text = _inner_table.sub(lambda m: _table_to_markdown(m.group(0)), text)

    # 10. Headings (outside tables)
    for i in range(6, 0, -1):
        text = re.sub(
            rf"<h{i}[^>]*>(.*?)</h{i}>",
            lambda m, n=i: "\n" + "#" * n + " " + _strip_tags(m.group(1)).strip() + "\n",
            text, flags=re.DOTALL,
        )

    # 10b. Generate TOC from converted headings (replaces placeholder left by step 5b)
    if "__TOC_PLACEHOLDER__" in text:
        def _heading_anchor(title: str) -> str:
            """GitLab-compatible anchor: lowercase, letters/numbers/hyphens only, spaces→hyphens."""
            a = re.sub(r"[`*_\[\]]", "", title)  # strip markdown formatting chars
            a = a.lower()
            a = "".join(c if c.isalnum() or c in " -" else "" for c in a)
            a = re.sub(r"\s+", "-", a.strip())
            return re.sub(r"-+", "-", a)

        toc_lines: list[str] = []
        seen: dict[str, int] = {}
        for hm in re.finditer(r"^(#{1,6}) +(.+)$", text, re.MULTILINE):
            level = len(hm.group(1))
            title = hm.group(2).strip()
            indent = "  " * (level - 1)
            base_anchor = _heading_anchor(title)
            count = seen.get(base_anchor, 0)
            anchor = base_anchor if count == 0 else f"{base_anchor}-{count}"
            seen[base_anchor] = count + 1
            toc_lines.append(f"{indent}- [{title}](#{anchor})")
        text = text.replace("__TOC_PLACEHOLDER__", "\n".join(toc_lines))

    # 11. Inline formatting
    text = re.sub(r"<strong>(.*?)</strong>", r"**\1**", text, flags=re.DOTALL)
    text = re.sub(r"<b>(.*?)</b>", r"**\1**", text, flags=re.DOTALL)
    text = re.sub(r"<em>(.*?)</em>", r"*\1*", text, flags=re.DOTALL)
    text = re.sub(r"<i>(.*?)</i>", r"*\1*", text, flags=re.DOTALL)
    text = re.sub(r"<code>(.*?)</code>", r"`\1`", text, flags=re.DOTALL)
    text = re.sub(
        r"<pre[^>]*>(.*?)</pre>",
        lambda m: "\n```\n" + m.group(1) + "\n```\n",
        text, flags=re.DOTALL,
    )

    # 12. Span → strip tag, keep content
    text = re.sub(r"<span[^>]*>(.*?)</span>", r"\1", text, flags=re.DOTALL)

    # 13. Lists — depth-aware, process innermost first (no nested <ul>/<ol> inside).
    # Each pass converts the innermost list; counting open/close tags before the match
    # gives the nesting depth, which is used for "  " * depth indentation.
    _inner_list_re = re.compile(
        r"<([ou]l)[^>]*>((?:(?!<[ou]l).)*?)</\1>",
        re.DOTALL | re.IGNORECASE,
    )

    def _make_list_replacer(src: str):
        def _replace(m: re.Match) -> str:
            before = src[: m.start()]
            depth = len(re.findall(r"<[ou]l[^>]*>", before, re.IGNORECASE)) - len(
                re.findall(r"</[ou]l>", before, re.IGNORECASE)
            )
            indent = "  " * depth
            items = []
            for li_m in re.finditer(r"<li[^>]*>(.*?)</li>", m.group(2), re.DOTALL | re.IGNORECASE):
                content = _strip_tags(li_m.group(1)).strip()
                if content:
                    items.append(f"\n{indent}- {content}")
            return "".join(items) + "\n"

        return _replace

    _list_prev = None
    while text != _list_prev:
        _list_prev = text
        text = _inner_list_re.sub(_make_list_replacer(_list_prev), _list_prev)

    # 14. Blockquote
    text = re.sub(
        r"<blockquote[^>]*>(.*?)</blockquote>",
        lambda m: "\n> " + _strip_tags(m.group(1)).strip() + "\n",
        text, flags=re.DOTALL,
    )

    # 15. Paragraphs — leading \n ensures a blank line before each paragraph so
    # bold-only section headers (Precondition, Basic Flow, etc.) are visually separated.
    text = re.sub(r"<p[^>]*>(.*?)</p>", lambda m: "\n" + m.group(1).strip() + "\n", text, flags=re.DOTALL)
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"<hr[^>]*/>", "\n---\n", text)

    # 16. Links
    text = re.sub(r'<a[^>]+href=["\'](.*?)["\'][^>]*>(.*?)</a>', r"[\2](\1)", text, flags=re.DOTALL)

    # 17. Remove remaining tags
    text = re.sub(r"<[^>]+>", "", text)

    # 18. Restore preserved literal < and > (were &lt;/&gt; in source)
    text = text.replace(_LT, "<").replace(_GT, ">")

    # 19. Cleanup whitespace
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    return text.strip()


def fetch_page(base_url: str, auth: tuple[str, str], page_id: str) -> dict:
    url = f"{base_url}/wiki/rest/api/content/{page_id}?expand=body.storage,version,title,space"
    response = requests.get(url, auth=auth, headers={"Accept": APPLICATION_JSON}, timeout=30)
    response.raise_for_status()
    return response.json()


def _get_children_v1_by_type(
    base_url: str, auth: tuple[str, str], node_id: str, child_type: str
) -> list[dict]:
    """Generic V1 child lister: child_type is 'page' or 'folder'."""
    all_results: list[dict] = []
    start = 0
    limit = 50
    while True:
        url = f"{base_url}/wiki/rest/api/content/{node_id}/child/{child_type}"
        params = {"limit": limit, "start": start}
        resp = requests.get(url, auth=auth, headers={"Accept": APPLICATION_JSON}, params=params, timeout=30)
        if resp.status_code in (404, 400):
            return all_results
        resp.raise_for_status()
        data = resp.json()
        batch = data.get("results", [])
        all_results.extend(batch)
        if len(batch) < limit:
            break
        start += limit
    return all_results


def get_children_v1(base_url: str, auth: tuple[str, str], node_id: str) -> list[dict]:
    """Get direct child PAGES of a page or folder node."""
    return _get_children_v1_by_type(base_url, auth, node_id, "page")


def get_folder_children_v1(base_url: str, auth: tuple[str, str], node_id: str) -> list[dict]:
    """Get direct child FOLDERS of a page or folder node."""
    return _get_children_v1_by_type(base_url, auth, node_id, "folder")


def recursive_walk(
    base_url: str,
    auth: tuple[str, str],
    node_id: str,
    out_dir: Path,
    path_parts: list[str],
    delay: float,
    collected: list[dict],
) -> None:
    """Recursively walk folder+page tree, collecting pages with their target directory.

    Confluence uses type=folder for structural nodes and type=page for content.
    /child/folder traverses the folder hierarchy; /child/page finds leaf pages.
    """
    # 1. Descend into sub-folders (structural nodes, no content to download)
    folder_children = get_folder_children_v1(base_url, auth, node_id)
    for f in folder_children:
        fid = str(f["id"])
        ftitle = f.get("title", fid)
        recursive_walk(base_url, auth, fid, out_dir, path_parts + [safe_name(ftitle)], delay, collected)

    # 2. Collect page children (actual content) — save into the current path_parts dir
    page_children = get_children_v1(base_url, auth, node_id)
    current_dir = out_dir.joinpath(*path_parts) if path_parts else out_dir
    for p in page_children:
        pid = str(p["id"])
        ptitle = p.get("title", pid)
        collected.append({"id": pid, "title": ptitle, "dir": current_dir})
        # Pages can also have their own sub-pages or sub-folders
        recursive_walk(base_url, auth, pid, out_dir, path_parts + [safe_name(ptitle)], delay, collected)


def search_pages(base_url: str, auth: tuple[str, str], cql: str, limit: int = 500) -> list[dict]:
    """Fetch all pages matching CQL with pagination and deduplication."""
    all_results: list[dict] = []
    seen_ids: set[str] = set()
    start = 0
    page_size = min(50, limit)
    while len(all_results) < limit:
        url = f"{base_url}/wiki/rest/api/content/search"
        params = {"cql": cql, "limit": page_size, "start": start, "expand": "version,space,ancestors"}
        response = requests.get(url, auth=auth, headers={"Accept": APPLICATION_JSON}, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        batch = data.get("results", [])
        new_added = 0
        for item in batch:
            pid = str(item.get("id", ""))
            if pid and pid not in seen_ids:
                seen_ids.add(pid)
                all_results.append(item)
                new_added += 1
        if len(batch) < page_size or new_added == 0:
            break
        start += page_size
    return all_results[:limit]


def safe_name(text: str, max_len: int = 120) -> str:
    """Sanitize a string for use as a file or directory name (Windows-safe)."""
    name = re.sub(r'[\\/:*?"<>|]', "-", text)
    name = re.sub(r"\s+", " ", name).strip().rstrip(".")
    return name[:max_len] or "untitled"


def path_from_ancestors(ancestors: list[dict], root_id: str) -> list[str]:
    """Return path parts (directory names) from ancestors AFTER root_id."""
    parts: list[str] = []
    found = False
    for a in ancestors:
        if str(a.get("id", "")) == str(root_id):
            found = True
            continue
        if found:
            parts.append(safe_name(a.get("title", str(a.get("id", "")))))
    return parts


def sync_page(base_url: str, auth: tuple[str, str], page_id: str, out_dir: Path) -> Path:
    page = fetch_page(base_url, auth, page_id)
    title = page.get("title", page_id)
    version = page.get("version", {}).get("number", "?")
    space_key = page.get("space", {}).get("key", "")
    body_raw = page.get("body", {}).get("storage", {}).get("value", "")

    # Images are downloaded into out_dir/images/{page_id}/
    images_dir = out_dir / "images" / page_id

    # Convert to markdown
    md_body = confluence_storage_to_markdown(
        body_raw, base_url=base_url, auth=auth, space_key=space_key,
        page_id=page_id, images_dir=images_dir,
    )
    page_url = f"{base_url}/wiki/spaces/{space_key}/pages/{page_id}/"
    header = (
        f"# {title}\n\n"
        f"> **Nguồn:** [Confluence {space_key}/{page_id}]({page_url})\n"
        f"> **Version:** {version} | **Sync lúc:** {_today()}\n\n---\n\n"
    )
    full_md = header + md_body

    safe_title = re.sub(r"[^\w\s-]", "", title).strip().replace(" ", "_")[:60]
    md_path = out_dir / f"{page_id}_{safe_title}.md"
    md_path.write_text(full_md, encoding="utf-8")

    return md_path


def sync_page_hierarchy(
    base_url: str,
    auth: tuple[str, str],
    page_id: str,
    title: str,
    ancestors: list[dict],
    root_id: str,
    base_dir: Path,
) -> Path:
    """Fetch a page and save it preserving Confluence hierarchy under base_dir."""
    page = fetch_page(base_url, auth, page_id)
    version = page.get("version", {}).get("number", "?")
    space_key = page.get("space", {}).get("key", "")
    body_raw = page.get("body", {}).get("storage", {}).get("value", "")

    # Build subdirectory path from ancestors
    parts = path_from_ancestors(ancestors, root_id)
    sub_dir = base_dir
    for part in parts:
        sub_dir = sub_dir / part
    sub_dir.mkdir(parents=True, exist_ok=True)

    images_dir = sub_dir / "images" / page_id
    md_body = confluence_storage_to_markdown(
        body_raw, base_url=base_url, auth=auth, space_key=space_key,
        page_id=page_id, images_dir=images_dir,
    )
    page_url = f"{base_url}/wiki/spaces/{space_key}/pages/{page_id}/"
    header = (
        f"# {title}\n\n"
        f"> **Nguồn:** [Confluence {space_key}/{page_id}]({page_url})\n"
        f"> **Version:** {version} | **Sync lúc:** {_today()}\n\n---\n\n"
    )
    full_md = header + md_body

    md_path = sub_dir / f"{safe_name(title)}.md"
    # Avoid clobbering an existing file with the same title from a different page
    if md_path.exists():
        md_path = sub_dir / f"{safe_name(title)}-{page_id}.md"
    md_path.write_text(full_md, encoding="utf-8")
    return md_path


def _today() -> str:
    from datetime import date
    return date.today().isoformat()


def main() -> None:
    import time

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--page", default="", help="Confluence page ID to sync")
    parser.add_argument("--cql", default="", help="CQL query to list or bulk-download pages")
    parser.add_argument("--out-dir", default="", help="Override output directory")
    parser.add_argument("--bulk", action="store_true", help="Download all pages matching --cql (not just list)")
    parser.add_argument("--limit", type=int, default=500, help="Max pages to fetch in CQL mode (default 500)")
    parser.add_argument("--delay", type=float, default=0.3, help="Seconds between requests in bulk mode")
    parser.add_argument("--hierarchy", action="store_true",
                        help="Preserve Confluence folder hierarchy (use with --bulk and --root-id)")
    parser.add_argument("--root-id", default="",
                        help="Ancestor page/folder ID that acts as the sync root (used with --hierarchy / --recursive)")
    parser.add_argument("--recursive", action="store_true",
                        help="Walk V1 child/page tree from --root-id (finds ALL pages, avoids CQL pagination bugs)")
    args = parser.parse_args()

    email, token, base_url = load_atlassian_credentials()
    auth = (email, token)

    out_dir = Path(args.out_dir) if args.out_dir else CONFLUENCE_ROOT
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.cql:
        results = search_pages(base_url, auth, args.cql, limit=args.limit)
        if not args.bulk:
            for r in results:
                print(f"{r['id']}\t{r.get('space', {}).get('key', '')}\t{r['title']}")
            return

        if args.hierarchy and not args.root_id:
            parser.error("--hierarchy requires --root-id <ancestor_page_id>")

        print(f"Found {len(results)} page(s) to sync -> {out_dir}")
        errors = 0
        for i, r in enumerate(results, 1):
            pid = str(r["id"])
            title = r.get("title", pid)
            print(f"[{i}/{len(results)}] {title} ({pid})")
            try:
                if args.hierarchy:
                    ancestors = r.get("ancestors", [])
                    md_path = sync_page_hierarchy(
                        base_url, auth, pid, title, ancestors, args.root_id, out_dir
                    )
                    rel = md_path.relative_to(out_dir)
                    print(f"  -> {rel}")
                else:
                    md_path = sync_page(base_url, auth, pid, out_dir)
                    print(f"  -> {md_path.name}")
            except Exception as exc:
                print(f"  ERROR: {exc}")
                errors += 1
            time.sleep(args.delay)
        print(f"\nDone. {len(results) - errors} synced, {errors} error(s).")
        return

    if args.recursive:
        if not args.root_id:
            parser.error("--recursive requires --root-id <page_or_folder_id>")
        print(f"Building full page tree from root {args.root_id} via V1 child/page API...")
        collected: list[dict] = []
        recursive_walk(base_url, auth, args.root_id, out_dir, [], args.delay, collected)
        print(f"Found {len(collected)} page(s) total. Syncing...")
        errors = 0
        for i, item in enumerate(collected, 1):
            pid, title, sub_dir = item["id"], item["title"], item["dir"]
            sub_dir.mkdir(parents=True, exist_ok=True)
            print(f"[{i}/{len(collected)}] {title} ({pid})")
            try:
                page = fetch_page(base_url, auth, pid)
                version = page.get("version", {}).get("number", "?")
                space_key = page.get("space", {}).get("key", "")
                body_raw = page.get("body", {}).get("storage", {}).get("value", "")
                images_dir = sub_dir / "images" / pid
                md_body = confluence_storage_to_markdown(
                    body_raw, base_url=base_url, auth=auth, space_key=space_key,
                    page_id=pid, images_dir=images_dir,
                )
                page_url = f"{base_url}/wiki/spaces/{space_key}/pages/{pid}/"
                header = (
                    f"# {title}\n\n"
                    f"> **Nguồn:** [Confluence {space_key}/{pid}]({page_url})\n"
                    f"> **Version:** {version} | **Sync lúc:** {_today()}\n\n---\n\n"
                )
                md_path = sub_dir / f"{safe_name(title)}.md"
                if md_path.exists():
                    md_path = sub_dir / f"{safe_name(title)}-{pid}.md"
                md_path.write_text(header + md_body, encoding="utf-8")
                try:
                    rel = md_path.relative_to(out_dir)
                except ValueError:
                    rel = md_path
                print(f"  -> {rel}")
            except Exception as exc:
                print(f"  ERROR: {exc}")
                errors += 1
            time.sleep(args.delay)
        print(f"\nDone. {len(collected) - errors} synced, {errors} error(s).")
        return

    if not args.page:
        parser.error("Provide --page <page_id>, --cql <query>, or --recursive --root-id <id>")

    md_path = sync_page(base_url, auth, args.page, out_dir)
    print(f"MD_SAVED: {md_path}")


if __name__ == "__main__":
    main()
