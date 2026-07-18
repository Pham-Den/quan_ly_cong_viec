#!/usr/bin/env python3
"""Sync a Confluence space or subtree to local files.

Default output root:
- project/docs

When using --full, fetches page text and saves Markdown under the output root.
Pages with referenced attachments are written as folders containing the
Markdown file and an images/ directory for downloaded image attachments.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


import requests
import json

from credentials import load_atlassian_credentials
from confluence_sync import confluence_storage_to_markdown

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT_ROOT = ROOT / "project" / "docs"
DEFAULT_TREE_OUT = ROOT / "project" / "space-tree.md"
IMAGE_DIR_NAME = "images"

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


class ConfluenceClient:
    def __init__(self, base_url: str, email: str, token: str):
        self.base_url = base_url.rstrip("/")
        self.api_v2 = f"{self.base_url}/wiki/api/v2"
        self.api_v1 = f"{self.base_url}/wiki/rest/api"
        self.auth = (email, token)

    def get(self, path: str, params: dict | None = None) -> dict:
        response = requests.get(f"{self.api_v2}{path}", auth=self.auth, params=params or {}, timeout=60)
        response.raise_for_status()
        return response.json()

    def get_space_id(self, space_key: str) -> str:
        data = self.get("/spaces", {"keys": space_key, "limit": 1})
        results = data.get("results", [])
        if not results:
            raise RuntimeError(f"Space '{space_key}' not found")
        return str(results[0]["id"])

    def get_homepage_id(self, space_id: str) -> str:
        data = self.get(f"/spaces/{space_id}")
        return str(data.get("homepageId", ""))

    def get_page_meta(self, page_id: str) -> dict:
        """Fetch page metadata. Falls back to v1 for folder-type nodes (404 on v2)."""
        try:
            return self.get(f"/pages/{page_id}")
        except Exception:
            pass
        try:
            r = requests.get(f"{self.api_v1}/content/{page_id}", auth=self.auth,
                             params={"expand": "title"},
                             headers={"Accept": "application/json"}, timeout=30)
            if r.status_code == 200:
                return r.json()
        except Exception:
            pass
        try:
            r2 = requests.get(f"{self.api_v1}/content/search", auth=self.auth,
                              params={"cql": f"id={page_id}", "limit": 1},
                              headers={"Accept": "application/json"}, timeout=30)
            if r2.status_code == 200:
                results = r2.json().get("results", [])
                if results:
                    return results[0]
        except Exception:
            pass
        return {"title": f"folder-{page_id}", "id": page_id}

    def get_children(self, page_id: str) -> list[dict]:
        """v1 child/page + CQL ancestor fallback để bắt folder-type nodes mà v2 bỏ qua.
        Reused from legacy/confluence_fetch_page.py."""
        import urllib.parse
        by_id: dict[str, dict] = {}

        def add(item: dict) -> None:
            iid = str(item.get("id", ""))
            if iid and iid not in by_id:
                by_id[iid] = item

        try:
            start = 0
            while True:
                r = requests.get(f"{self.api_v1}/content/{page_id}/child/page",
                                 auth=self.auth, params={"limit": 50, "start": start},
                                 headers={"Accept": "application/json"}, timeout=30)
                if r.status_code != 200:
                    break
                batch = r.json().get("results", [])
                for item in batch:
                    add(item)
                if len(batch) < 50:
                    break
                start += len(batch)
        except Exception:
            pass

        try:
            url = f"{self.api_v1}/content/search"
            params: dict | None = {"cql": f"ancestor={page_id}", "limit": 50, "expand": "ancestors"}
            wiki_base = self.api_v1.rsplit("/rest/api", 1)[0]
            seen_ids: set[str] = set()
            while True:
                r2 = requests.get(url, auth=self.auth, params=params,
                                  headers={"Accept": "application/json"}, timeout=30)
                if r2.status_code != 200:
                    break
                d2 = r2.json()
                batch = d2.get("results", [])
                new_ids = {str(i.get("id", "")) for i in batch if i.get("id")}
                for item in batch:
                    if item.get("type") not in {"page", "folder"}:
                        continue
                    ancestors = item.get("ancestors") or []
                    if ancestors and str(ancestors[-1].get("id", "")) == str(page_id):
                        add(item)
                if not batch or new_ids <= seen_ids:
                    break
                seen_ids.update(new_ids)
                next_link = (d2.get("_links") or {}).get("next")
                if not next_link:
                    break
                url = urllib.parse.urljoin(wiki_base + "/", next_link.lstrip("/"))
                params = None
        except Exception:
            pass

        return list(by_id.values())

    def get_page_body(self, page_id: str) -> str:
        try:
            data = self.get(f"/pages/{page_id}", {"body-format": "storage"})
            return data.get("body", {}).get("storage", {}).get("value", "")
        except Exception:
            return ""

    def list_attachments(self, page_id: str) -> dict[str, dict]:
        """Return dict[filename → {download_url, media_type}] via v1 API.

        Uses api.atlassian.com/ex/confluence/{cloudId} proxy so Basic Auth
        with API token works (direct /wiki/download/ path requires OAuth session).
        """
        url = f"{self.api_v1}/content/{page_id}/child/attachment?limit=250&expand=version"
        try:
            r = requests.get(url, auth=self.auth, headers={"Accept": "application/json"}, timeout=30)
            if r.status_code != 200:
                return {}
            results = r.json().get("results", [])
            cloud_id = ""
            for item in results:
                ari = item.get("ari", "")
                if ari:
                    parts = ari.split(":")
                    cloud_id = parts[3] if len(parts) >= 4 else ""
                    break
            proxy_base = (
                f"https://api.atlassian.com/ex/confluence/{cloud_id}"
                if cloud_id else self.base_url
            )
            result: dict[str, dict] = {}
            for item in results:
                title = item.get("title", "")
                download_rel = (item.get("_links") or {}).get("download", "")
                if title and download_rel:
                    rel_path = download_rel.split("?", 1)[0]
                    result[title] = {
                        "media_type": (item.get("metadata") or {}).get("mediaType", ""),
                        "download_url": f"{proxy_base}/wiki{rel_path}",
                    }
            return result
        except Exception:
            return {}


def extract_referenced_filenames(body_html: str) -> list[str]:
    """Return image filenames referenced in body storage HTML, in order of appearance."""
    seen: set[str] = set()
    names: list[str] = []
    for filename in re.findall(r'ri:filename="([^"]+)"', body_html):
        if filename not in seen:
            seen.add(filename)
            names.append(filename)
    return names


def download_attachments(
    referenced: list[str],
    attachment_map: dict[str, dict],
    auth,
    target_dir: Path,
) -> None:
    import base64
    basic = base64.b64encode(f"{auth[0]}:{auth[1]}".encode()).decode()
    headers = {"Authorization": f"Basic {basic}"}
    target_dir.mkdir(parents=True, exist_ok=True)
    for filename in referenced:
        item = attachment_map.get(filename)
        if not item:
            continue
        target_path = target_dir / filename
        try:
            r = requests.get(item["download_url"], headers=headers, timeout=60, allow_redirects=True)
            r.raise_for_status()
            target_path.write_bytes(r.content)
        except Exception as exc:
            print(f"    [warn] Cannot download {filename}: {exc}")


def rewrite_markdown_image_links(markdown_body: str, referenced: list[str], image_dir_name: str = IMAGE_DIR_NAME) -> str:
    """Point generated Confluence image links at the local image directory."""
    for filename in referenced:
        local_path = f"{image_dir_name}/{filename}".replace("\\", "/")
        markdown_body = markdown_body.replace(f"]({filename})", f"](<{local_path}>)")
        markdown_body = markdown_body.replace(f"](<{filename}>)", f"](<{local_path}>)")
    return markdown_body


def title_to_slug(title: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9\s-]", "", title)
    slug = re.sub(r"\s+", "-", slug.strip())
    return slug[:120] or "untitled"


def safe_filename(title: str) -> str:
    name = re.sub(r'[\\/*?:"<>|]', "-", title)
    name = re.sub(r"\s+", " ", name).strip().rstrip(".")
    return name[:120] or "untitled"




@dataclass
class PageRecord:
    page_id: str
    title: str
    depth: int
    parent_id: str
    path_parts: list[str]
    has_children: bool


def build_tree(
    client: ConfluenceClient,
    page_id: str,
    depth: int = 0,
    collected: Optional[list[PageRecord]] = None,
    path_parts: Optional[list[str]] = None,
    parent_id: str = "",
    max_depth: int = 0,
    tree_limit: int = 0,
) -> tuple[str, list[PageRecord]]:
    if collected is None:
        collected = []
    if path_parts is None:
        path_parts = []

    if tree_limit > 0 and len(collected) >= tree_limit:
        return "", collected

    meta = client.get_page_meta(page_id)
    title = str(meta.get("title", f"Page {page_id}"))
    print(f"{'  ' * depth}[tree] {len(collected) + 1}: {title} ({page_id})", flush=True)
    children = [] if max_depth > 0 and depth >= max_depth else client.get_children(page_id)
    indent = "  " * depth
    current_path_parts = path_parts + [safe_filename(title)]

    collected.append(
        PageRecord(
            page_id=str(page_id),
            title=title,
            depth=depth,
            parent_id=parent_id,
            path_parts=current_path_parts,
            has_children=bool(children),
        )
    )

    if children:
        lines = [f"{indent}📁 **{title}** (ID: `{page_id}`)"]
        for child in children:
            if tree_limit > 0 and len(collected) >= tree_limit:
                lines.append(f"{indent}  ... tree limit reached ({tree_limit})")
                break
            child_text, _ = build_tree(
                client,
                str(child["id"]),
                depth + 1,
                collected,
                current_path_parts,
                str(page_id),
                max_depth=max_depth,
                tree_limit=tree_limit,
            )
            if child_text:
                lines.append(child_text)
        return "\n".join(lines), collected
    return f"{indent}**{title}** (ID: `{page_id}`)", collected


def write_space_tree(space_key: str, space_id: str, homepage_id: str, pages: list[PageRecord], tree_text: str, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    now = time.strftime("%Y-%m-%d %H:%M")
    content = [
        f"# {space_key} Confluence Space Tree",
        "",
        f"Space ID: `{space_id}` | Homepage ID: `{homepage_id}`",
        "",
        f"_Last synced: {now} - {len(pages)} pages_",
        "",
        "---",
        "",
        tree_text,
        "",
    ]
    out_path.write_text("\n".join(content), encoding="utf-8")


def resolve_output_paths(record: PageRecord, preserve_tree: bool, used_paths: dict[str, str], out_root: Path) -> tuple[Path, Path]:
    if preserve_tree:
        out_dir = out_root.joinpath(*record.path_parts[:-1]) if len(record.path_parts) > 1 else out_root
        stem = record.path_parts[-1]
    else:
        out_dir = out_root
        stem = title_to_slug(record.title)

    stem_path = out_dir / stem
    key = os.path.normcase(str(stem_path))
    if key in used_paths and used_paths[key] != record.page_id:
        stem_path = out_dir / f"{stem}-{record.page_id}"
        key = os.path.normcase(str(stem_path))
    used_paths[key] = record.page_id

    return (
        stem_path.parent / f"{stem_path.name}.md",
        stem_path.parent / f"{stem_path.name}.json",
    )


def resolve_tree_out(argument: str) -> Path:
    if not argument:
        return DEFAULT_TREE_OUT
    path = Path(argument)
    return path if path.is_absolute() else ROOT / path


def resolve_out_root(argument: str) -> Path:
    if not argument:
        return DEFAULT_OUT_ROOT
    path = Path(argument)
    return path if path.is_absolute() else ROOT / path


def output_exists(md_path: Path, json_path: Path, page_id: str) -> bool:
    """Return True when a page already has Markdown output.

    If JSON metadata still exists from an older run, use it to avoid skipping a
    page whose filename collided with a different page.
    """
    direct_md = md_path
    folder_md = md_path.with_suffix("") / md_path.name
    has_md = direct_md.exists() or folder_md.exists()
    if not has_md:
        return False
    if not json_path.exists():
        return True
    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))
        return str(data.get("page_id", "")) == str(page_id)
    except Exception:
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--full", action="store_true", help="Also fetch HTML bodies and generate Markdown files")
    parser.add_argument("--space-key", default="", help="Override CONFLUENCE_SPACE_KEY")
    parser.add_argument("--limit", type=int, default=0, help="Max pages to fetch in full mode")
    parser.add_argument("--parent-id", default="", help="Fetch a subtree under this page ID")
    parser.add_argument("--delay", type=float, default=0.2, help="Delay between page fetches in seconds")
    parser.add_argument("--preserve-tree", action="store_true", help="Save pages into folders matching the Confluence hierarchy")
    parser.add_argument("--out", default="", help="Output root for Markdown files and attachments (default: project/docs)")
    parser.add_argument("--out-root", default="", help="Alias for --out")
    parser.add_argument("--max-depth", type=int, default=0, help="Max tree depth to crawl; 0 means unlimited")
    parser.add_argument("--tree-limit", type=int, default=0, help="Max number of pages to crawl in the tree; 0 means unlimited")
    parser.add_argument("--tree-out", default="", help="Tree markdown output path (default: project/space-tree.md)")
    parser.add_argument("--resume", action="store_true", help="Skip pages that already have Markdown output")
    parser.add_argument("--skip-existing", action="store_true", help="Alias for --resume")
    parser.add_argument("--write-json", action="store_true", help="Also write page metadata JSON files")
    args = parser.parse_args()

    email, token, base_url, default_space_key = load_atlassian_credentials(require_space_key=True)
    space_key = args.space_key or default_space_key
    client = ConfluenceClient(base_url, email, token)

    out_root = resolve_out_root(args.out or args.out_root)
    out_root.mkdir(parents=True, exist_ok=True)

    print(f"Looking up space '{space_key}'...")
    space_id = client.get_space_id(space_key)
    homepage_id = client.get_homepage_id(space_id)
    root_id = args.parent_id or homepage_id
    print(f"  Space ID: {space_id} | Homepage ID: {homepage_id} | Root ID: {root_id}")

    print(f"Output root: {out_root}")
    print("Building page tree...")
    tree_text, all_pages = build_tree(client, root_id, max_depth=args.max_depth, tree_limit=args.tree_limit)
    tree_out = resolve_tree_out(args.tree_out)
    write_space_tree(space_key, space_id, homepage_id, all_pages, tree_text, tree_out)
    print(f"Saved: {tree_out}")

    if not args.full:
        return 0

    pages_to_fetch = all_pages[: args.limit] if args.limit > 0 else all_pages
    print(f"Fetching {len(pages_to_fetch)} page(s)...")

    def minimal_page_json(meta: dict) -> dict:
        # Lấy các trường metadata cần thiết
        return {
            "title": meta.get("title"),
            "page_id": meta.get("id"),
            "url": f"{base_url.rstrip('/')}/wiki/pages/{meta.get('id')}",
            "updated": (meta.get("version") or {}).get("when"),
            "creator": ((meta.get("version") or {}).get("by") or {}).get("displayName"),
            "space_id": meta.get("spaceId"),
            "parent_id": meta.get("parentId"),
        }

    used_paths: dict[str, str] = {}
    skipped = 0
    for index, record in enumerate(pages_to_fetch, start=1):
        page_id = record.page_id
        title = record.title
        md_path, json_path = resolve_output_paths(record, args.preserve_tree, used_paths, out_root)
        if (args.resume or args.skip_existing) and output_exists(md_path, json_path, page_id):
            skipped += 1
            print(f"  [{index}/{len(pages_to_fetch)}] skip existing: {title}")
            continue
        try:
            meta = client.get_page_meta(page_id)
            body = client.get_page_body(page_id)
            page_url = f"{base_url.rstrip('/')}/wiki/pages/{page_id}"

            # Determine folder layout before conversion so images_dir can be passed to the converter.
            # confluence_storage_to_markdown() downloads images inline when images_dir is set.
            referenced = extract_referenced_filenames(body)
            has_attachments = bool(referenced)

            if has_attachments:
                page_folder = md_path.with_suffix("")
                page_folder.mkdir(parents=True, exist_ok=True)
                actual_md = page_folder / md_path.name
                images_dir = page_folder / IMAGE_DIR_NAME / page_id
            else:
                md_path.parent.mkdir(parents=True, exist_ok=True)
                actual_md = md_path
                images_dir = None

            markdown_body = confluence_storage_to_markdown(
                body,
                base_url=base_url, auth=client.auth,
                space_key=space_key, page_id=page_id,
                images_dir=images_dir,
            )

            actual_md.write_text(f"# {title}\n\n<{page_url}>\n\n{markdown_body}\n", encoding="utf-8")
            att_note = f" + {len(referenced)} image attachment(s)" if has_attachments else ""
            json_note = ""
            if args.write_json:
                # Save JSON metadata alongside the .md (outside the attachment folder)
                json_path.parent.mkdir(parents=True, exist_ok=True)
                json_data = minimal_page_json(meta)
                json_path.write_text(json.dumps(json_data, ensure_ascii=False, indent=2), encoding="utf-8")
                json_note = " + .json"
            try:
                display_path = actual_md.relative_to(ROOT)
            except ValueError:
                display_path = actual_md
            print(f"  [{index}/{len(pages_to_fetch)}] {display_path}{json_note}{att_note}")
        except Exception as exc:
            print(f"  [error] {title} ({page_id}): {exc}")
        time.sleep(args.delay)

    if skipped:
        print(f"Skipped existing pages: {skipped}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
