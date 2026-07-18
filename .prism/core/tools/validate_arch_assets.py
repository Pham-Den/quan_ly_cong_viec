#!/usr/bin/env python3
"""validate_arch_assets.py — deterministic C4 Draw.io asset structure check.

The `validate architecture` command's C4-level coverage check (`ARCH-1`) is
otherwise enforced only as a prompt rule the engine must self-apply — there is
no programmatic gate that opens the Draw.io/XML source and confirms the required
C4 levels are actually present and non-empty. This tool closes that gap with a
deterministic structural check, mirroring how `validate_proposal.py` hardens the
proposal-structure rule.

What it checks (all tagged `ARCH-1`, the C4 part of the Planning-Ready
Architecture Rule):

  AAV-C4-LEVELS  The C4 Draw.io/XML source contains a diagram page for each of
                 the 3 REQUIRED C4 levels — System Context (C1), Container (C2),
                 and Component (C3). Missing any required level is a blocker.
                 The 4th canonical C4 level (Code / L4) is NOT required by PRISM
                 and is never flagged.
  AAV-C4-EMPTY   Each required level page must hold a real diagram (>= 2 shapes).
                 A present-but-stub page is a blocker.
  AAV-C4-NOEDGE  Each required level page should show >= 1 relationship (edge).
                 Zero relationships is a warning (suspicious, not always wrong).
  AAV-C4-TEXT    (only when an architecture proposal doc is available) The doc
                 carries a text-readable heading for each of the 3 required
                 levels. A missing text-readable level is a blocker — the spec
                 requires text + Draw.io to BOTH exist for all 3 levels.

It does NOT verify semantic agreement between the diagram and the text tables
(same actors/containers/components) or connector-routing aesthetics — those stay
LLM-judged in the three-layer `validate architecture` report.

Exit codes (aligned with validate_proposal.py):
  0  OK — no blocker findings; warnings allowed unless --strict
  1  validation fail — one or more blocker findings
  2  C4 source asset not found / could not be located
"""

from __future__ import annotations

import argparse
import base64
import binascii
import re
import sys
import urllib.parse
import zlib
from dataclasses import dataclass, field
from pathlib import Path

# The 3 REQUIRED C4 levels. Each maps to a substring that must appear (case
# insensitive) in a diagram page name / a doc heading for that level to count.
# Order matters only for display. (C4 / "Code" level is intentionally absent.)
REQUIRED_LEVELS: tuple[tuple[str, str], ...] = (
    ("System Context", "context"),
    ("Container", "container"),
    ("Component", "component"),
)

MIN_VERTICES = 2  # a real C4 view has at least two shapes

DIAGRAM_RE = re.compile(r"<diagram\b([^>]*)>(.*?)</diagram>", re.DOTALL)
NAME_ATTR_RE = re.compile(r'\bname="([^"]*)"')
VERTEX_RE = re.compile(r'vertex="1"')
EDGE_RE = re.compile(r'edge="1"')
# Opening tag of an edge cell, used to inspect that edge's own `value=` label.
EDGE_OPEN_TAG_RE = re.compile(r'<mxCell\b[^>]*?\bedge="1"[^>]*?>')
VALUE_ATTR_RE = re.compile(r'\bvalue="([^"]*)"')
HEADING_RE = re.compile(r"^#{1,6}\s+(.*\S)\s*$", re.MULTILINE)

C4_ASSET_CANDIDATES = ("c4-model.drawio", "c4-model.drawio.xml", "c4.drawio", "c4.drawio.xml")

# A relative `assets/<file>.drawio[.xml]` reference inside a proposal / Living Truth
# markdown. Mirrors validate_living_truth.ASSET_REF_RE but narrowed to Draw.io sources,
# so callers (e.g. validate_proposal.py `VP-13`) can detect whether a proposal actually
# CLAIMS a C4 / DFD diagram source. The lookbehind rejects an `assets/` that is part of a
# longer path so only bare, file-local `assets/...` references match.
ASSET_DRAWIO_REF_RE = re.compile(r"(?<![\w./-])assets/([A-Za-z0-9._/\-]+\.drawio(?:\.xml)?)")


@dataclass
class Finding:
    level: str  # "blocker" | "warn"
    rule: str
    message: str


@dataclass
class Report:
    findings: list[Finding] = field(default_factory=list)
    infos: list[str] = field(default_factory=list)

    @property
    def blockers(self) -> list[Finding]:
        return [f for f in self.findings if f.level == "blocker"]

    @property
    def warnings(self) -> list[Finding]:
        return [f for f in self.findings if f.level == "warn"]

    def add_blocker(self, rule: str, msg: str) -> None:
        self.findings.append(Finding("blocker", rule, msg))

    def add_warn(self, rule: str, msg: str) -> None:
        self.findings.append(Finding("warn", rule, msg))

    def add_info(self, msg: str) -> None:
        self.infos.append(msg)


@dataclass
class DiagramPage:
    name: str
    vertices: int
    edges: int
    unlabeled_edges: int = 0  # edges whose own cell carries no non-empty `value=` label


def _decode_diagram_body(body: str) -> str:
    """Return the mxGraphModel XML for a <diagram> body.

    Draw.io stores a page either as inline XML (`<mxGraphModel>...`) or as a
    compressed payload (base64 -> raw deflate -> URL-encoded XML). Handle both;
    fall back to the raw body if decoding fails so counts degrade gracefully.
    """
    stripped = body.strip()
    if "<mxGraphModel" in stripped or "<mxCell" in stripped:
        return stripped
    try:
        raw = base64.b64decode(stripped, validate=True)
        inflated = zlib.decompress(raw, -zlib.MAX_WBITS)
        return urllib.parse.unquote(inflated.decode("utf-8", errors="replace"))
    except (binascii.Error, zlib.error, ValueError):
        return stripped


def parse_drawio_pages(text: str) -> list[DiagramPage]:
    pages: list[DiagramPage] = []
    for attrs, body in DIAGRAM_RE.findall(text):
        name_match = NAME_ATTR_RE.search(attrs)
        name = name_match.group(1) if name_match else ""
        xml = _decode_diagram_body(body)
        edge_tags = EDGE_OPEN_TAG_RE.findall(xml)
        unlabeled = 0
        for tag in edge_tags:
            value = VALUE_ATTR_RE.search(tag)
            if value is None or not value.group(1).strip():
                unlabeled += 1
        pages.append(
            DiagramPage(
                name=name,
                vertices=len(VERTEX_RE.findall(xml)),
                edges=len(edge_tags),
                unlabeled_edges=unlabeled,
            )
        )
    return pages


def _match_level_pages(pages: list[DiagramPage], keyword: str) -> list[DiagramPage]:
    return [p for p in pages if keyword in p.name.lower()]


def evaluate_c4_pages(pages: list[DiagramPage], rule: str = "ARCH-1") -> list[tuple[str, str, str]]:
    """Evaluate C4 diagram pages against the 3-required-level rule.

    Returns a list of ``(level, rule, message)`` tuples where level is one of
    ``"blocker" | "warn" | "info"``. Decoupled from any Report class so multiple
    validators — this CLI and ``validate_proposal.py``'s ``VP-13`` — can reuse the same
    logic, each stamping its own rule tag.
    """
    findings: list[tuple[str, str, str]] = []
    if not pages:
        findings.append((
            "blocker", rule,
            "C4 Draw.io/XML source has no <diagram> pages; required levels "
            "(System Context, Container, Component) cannot be confirmed",
        ))
        return findings

    findings.append((
        "info", rule,
        "C4 pages found: "
        + ", ".join(f"{p.name or '(unnamed)'} [v={p.vertices} e={p.edges}]" for p in pages),
    ))

    for label, keyword in REQUIRED_LEVELS:
        matches = _match_level_pages(pages, keyword)
        if not matches:
            findings.append((
                "blocker", rule,
                f"C4 source is missing the required '{label}' level "
                f"(no diagram page name contains '{keyword}')",
            ))
            continue
        # Use the richest matching page to judge content.
        best = max(matches, key=lambda p: p.vertices)
        if best.vertices < MIN_VERTICES:
            findings.append((
                "blocker", rule,
                f"C4 '{label}' level page '{best.name}' is effectively empty "
                f"({best.vertices} shape(s); need >= {MIN_VERTICES})",
            ))
        elif best.edges < 1:
            findings.append((
                "warn", rule,
                f"C4 '{label}' level page '{best.name}' has no relationships "
                f"(0 edges); confirm this view is meaningful",
            ))
    return findings


def check_c4_pages(pages: list[DiagramPage], report: Report) -> None:
    for level, rule, msg in evaluate_c4_pages(pages):
        if level == "info":
            report.add_info(msg)
        elif level == "blocker":
            report.add_blocker(rule, msg)
        else:
            report.add_warn(rule, msg)


def evaluate_dfd_pages(pages: list[DiagramPage], rule: str = "ARCH-2") -> list[tuple[str, str, str]]:
    """Evaluate Data Flow Diagram pages against the deterministic part of `ARCH-2`.

    Returns ``(level, rule, message)`` tuples. Checks that are deterministic:
      - at least one DFD page exists (ARCH-2 requires >= 1 DFD); 0 pages is a blocker
      - each page holds a real diagram (>= 2 shapes); a stub page is a blocker
      - each page shows data movement (>= 1 arrow); 0 arrows is a warning
      - every data-flow arrow carries a label; unlabeled arrows are a warning (label can
        also live on a child cell, so this stays a warn to avoid false gate-blocks)

    Notation shape-typing (rectangle / circle / open-ended rectangle), "covers every
    meaningful data movement", user-group splitting, and connector routing stay LLM-judged.
    """
    findings: list[tuple[str, str, str]] = []
    if not pages:
        findings.append((
            "blocker", rule,
            "DFD Draw.io/XML source has no <diagram> pages; ARCH-2 requires at least one DFD",
        ))
        return findings

    findings.append((
        "info", rule,
        "DFD pages found: "
        + ", ".join(
            f"{p.name or '(unnamed)'} [v={p.vertices} e={p.edges} unlabeled={p.unlabeled_edges}]"
            for p in pages
        ),
    ))

    for p in pages:
        label = p.name or "(unnamed)"
        if p.vertices < MIN_VERTICES:
            findings.append((
                "blocker", rule,
                f"DFD page '{label}' is effectively empty "
                f"({p.vertices} shape(s); need >= {MIN_VERTICES})",
            ))
            continue
        if p.edges < 1:
            findings.append((
                "warn", rule,
                f"DFD page '{label}' has no data-flow arrows (0 edges)",
            ))
        elif p.unlabeled_edges > 0:
            findings.append((
                "warn", rule,
                f"DFD page '{label}' has {p.unlabeled_edges} unlabeled data-flow arrow(s); "
                f"every DFD arrow must carry a data/action label",
            ))
    return findings


def check_text_levels(doc_text: str, report: Report) -> None:
    headings = [h.lower() for h in HEADING_RE.findall(doc_text)]
    for label, keyword in REQUIRED_LEVELS:
        if not any(keyword in h for h in headings):
            report.add_blocker(
                "ARCH-1",
                f"architecture doc has no text-readable heading for the "
                f"'{label}' C4 level (heading containing '{keyword}')",
            )


def locate_c4_asset(arch_dir: Path) -> Path | None:
    assets = arch_dir / "assets"
    for name in C4_ASSET_CANDIDATES:
        candidate = assets / name
        if candidate.is_file():
            return candidate
    # Fall back: any *.drawio* asset whose pages look like a C4 model.
    if assets.is_dir():
        for candidate in sorted(assets.glob("*.drawio*")):
            try:
                pages = parse_drawio_pages(candidate.read_text(encoding="utf-8"))
            except OSError:
                continue
            names = " ".join(p.name.lower() for p in pages)
            if "context" in names and "container" in names and "component" in names:
                return candidate
    return None


def validate(c4_text: str, doc_text: str | None) -> Report:
    report = Report()
    pages = parse_drawio_pages(c4_text)
    check_c4_pages(pages, report)
    if doc_text is not None:
        check_text_levels(doc_text, report)
    return report


def format_report(report: Report, strict: bool) -> tuple[int, str]:
    lines: list[str] = []
    for info in report.infos:
        lines.append(f"· {info}")
    if not report.findings:
        lines.append("✓ C4 assets validate (3 required levels present and non-empty)")
    else:
        for f in report.findings:
            symbol = "✗" if f.level == "blocker" else "⚠"
            lines.append(f"{symbol} {f.level} [{f.rule}]: {f.message}")
        lines.append("")
        lines.append(
            f"summary: {len(report.blockers)} blocker(s), {len(report.warnings)} warning(s)"
        )
    code = 1 if report.blockers else 0
    if strict and report.warnings:
        code = 1
    return code, "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate architecture C4 Draw.io asset structure (3 required levels).",
    )
    parser.add_argument("--c4", help="Path to the C4 Draw.io/XML source file")
    parser.add_argument(
        "--arch-doc",
        help="Path to the architecture proposal markdown (enables text-readable level check)",
    )
    parser.add_argument(
        "--sprint",
        help="Sprint id (e.g. v1) to auto-locate assets under <root>/docs/sprint-<sprint>/architecture",
    )
    parser.add_argument("--root", default=".", help="Repo/project root for --sprint (default: cwd)")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as blockers (exit 1 if any warning)",
    )
    args = parser.parse_args()

    c4_path: Path | None = None
    doc_path: Path | None = None

    if args.sprint:
        sprint = args.sprint if args.sprint.startswith("v") else f"v{args.sprint}"
        arch_dir = Path(args.root) / "docs" / f"sprint-{sprint}" / "architecture"
        c4_path = Path(args.c4) if args.c4 else locate_c4_asset(arch_dir)
        if args.arch_doc:
            doc_path = Path(args.arch_doc)
        else:
            default_doc = arch_dir / "proposals" / f"architecture-{sprint}.md"
            doc_path = default_doc if default_doc.is_file() else None
    else:
        if not args.c4:
            sys.stderr.write("ERROR: provide --c4 <drawio> or --sprint <id>\n")
            return 2
        c4_path = Path(args.c4)
        doc_path = Path(args.arch_doc) if args.arch_doc else None

    if c4_path is None or not c4_path.is_file():
        target = c4_path if c4_path else "(auto-locate under architecture/assets)"
        sys.stderr.write(f"ERROR: C4 Draw.io source not found: {target}\n")
        return 2

    c4_text = c4_path.read_text(encoding="utf-8")
    doc_text = doc_path.read_text(encoding="utf-8") if doc_path and doc_path.is_file() else None

    report = validate(c4_text, doc_text)
    code, output = format_report(report, strict=args.strict)
    print(output)
    return code


if __name__ == "__main__":
    sys.exit(main())
