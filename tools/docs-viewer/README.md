# docs-view

A doc viewer for any project with a `docs/` folder — read Markdown, diagrams, and assets with no config
to write. When the docs are a **PRISM** project, it also gives a structured Living-Truth preview and a
git-style diff browser. Built on VitePress with custom viewers wired in for non-MD assets.

## Quick start

**From this folder** (you have the source, e.g. in the workspace):

```bash
cd docs-viewer
npm install                                    # once
npm run dev                                    # serve the nearest docs/ (or opens a folder picker)
npm run dev -- /path/to/your-project           # point at a specific project (or its docs/ folder)
node bin/docs-view.js build /path/to/project   # build a static site → <project>/docs-dist
```

Then open the printed URL (default http://localhost:5173). Use `--port`, `--host`, `--open` as needed.

**Published package** (no clone needed), run from any project that has a `docs/`:

```bash
npx @sdlc-framework/docs-viewer
```

## What it does

- Renders Markdown + diagrams + assets (see the table below) from any `docs/` folder.
- **Runs from anywhere**: walks up to the nearest `docs/`, or opens an in-browser folder picker.
- **PRISM-aware**: if the docs have the PRISM 2-layer structure, it composes the **Living Truth** per
  document, lets you pick sprints + drafts and **Apply**, and shows a **diff browser** of what changed.
- **Never touches your `docs/`** — all generated files live in a per-project OS cache folder.

## Supported file types

| Type | Extensions | How it renders |
|------|-----------|---------------|
| Markdown | `.md`, `.markdown` | Native VitePress page |
| Mermaid (inline) | ` ```mermaid` fences in MD | Rendered diagram |
| Mermaid (file) | `.mmd`, `.mermaid` | Rendered diagram |
| PlantUML | `.puml`, `.plantuml`, `.iuml`, `.pu` | Rendered via `plantuml.com` (requires internet) |
| draw.io | `.drawio`, `.drawio.xml` | Embedded `viewer.diagrams.net` iframe (requires internet) |
| Image | `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp` | Full-size image page (and inline in MD) |
| PDF | `.pdf` | Inline `<object>` embed |
| CSV | `.csv` | Parsed table (papaparse) |
| Download | `.docx`, `.pptx`, `.bpmn` | Download button card |

Anything else in `docs/` is ignored.

## Usage

```bash
npx @sdlc-framework/docs-viewer            # dev server for the nearest docs/ (default)
npx @sdlc-framework/docs-viewer build      # build a static site → <project>/docs-dist
npx @sdlc-framework/docs-viewer dev ./path # point at a specific docs/ folder or project root
```

`[path]` is optional: it can be a `docs/` folder or a project root that contains one. If omitted,
docs-view walks up from the current directory to the nearest `docs/`; if none is found, dev mode opens
an **in-browser folder picker** (OS-native dialog, in-page filesystem browse, or paste a path).

If you received docs-viewer inside a PRISM release zip, launch the bundled copy from the project root:

```bash
./tools/docs-viewer/launch.sh
./tools/docs-viewer/launch.sh build
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\docs-viewer\launch.ps1
powershell -ExecutionPolicy Bypass -File .\tools\docs-viewer\launch.ps1 build
```

Windows cmd:

```bat
.\tools\docs-viewer\launch.cmd
.\tools\docs-viewer\launch.cmd build
```

The launcher creates the local install sandbox at `.tools/docs-viewer-install/`; its `package.json`,
`package-lock.json`, and `node_modules/` live there instead of in the project root.

Flags: `--port <n>` (5173) · `--host <h>` (localhost) · `--open` · `--help`/`-h`.

## PRISM-aware view

When the `docs/` folder has the PRISM 2-layer phase structure, docs-view detects it (no `.prism` engine
required for detection) and adapts:

- **Composed** (engine present): a structured tree with **Living Truth** composed per document (grouped
  by phase), draft sprints, and sealed sprints. A sprint **picker + Apply** composes the truth up to the
  chosen sprint (with an optional **Include drafts**) live via the project's `effective_truth.py` —
  never written back to `docs/`.
- **Raw** (no engine): the same grouped layout, source files only.
- **Plain**: any other `docs/` is just the file browser above.

### Diff browser ("Show diffs")

A git-style diff of the current selection, with one consistent **file-browser (left) + diff (right)**
layout. Three groupings:

| Group by | Left browser | Right pane |
|----------|--------------|------------|
| **Net** (default) | documents, by phase | the doc's whole change vs the sealed Living Truth |
| **Per sprint** | sprint folders → files | the file's change in that sprint (vs the previous one) |
| **By change** | sprint folders → files | each proposal / change-pack (DRAFT/APPROVED) for that file |

Each diff renders three ways (a display toggle): **Unified**, **Side-by-side**, or **Rendered** — a
word-level rich diff on the formatted markdown (tables, lists, headings render; changed words marked in
place; unchanged mermaid blocks shown as real diagrams). Requires the project's `effective_truth.py` to
support `--per-source-diff --with-content`; older engines fall back gracefully with a notice.

## Runtime

docs-view never writes into your `docs/` (or `.prism/`). The generated runtime (VitePress config + theme
+ a mirror of your content) lives in a **per-project folder in the OS cache**:

- macOS: `~/Library/Caches/docs-view/<project>-<hash>/`
- Linux: `$XDG_CACHE_HOME/docs-view/...` (or `~/.cache/docs-view/...`)
- Windows: `%LOCALAPPDATA%\docs-view\...`

Override with `DOCS_VIEW_RUNTIME_DIR`. `build` writes its static site to `<project>/docs-dist` (only).

## Cross-platform

The content mirror uses **symlinks on macOS/Linux** and **file copies + directory junctions on Windows**
(per-file symlinks need admin there). Node.js 20+ required.

## Conventions

- Folder index file is **`index.md`** (not `README.md` — PRISM uses README for other purposes).
- Sidebar order is **alphanumeric**; prefix with `01-`, `02-`, … to sort naturally.
- Files/folders starting with `.` or `_` are skipped, along with common build folders.
- Each non-MD asset gets a viewer page at `<path>.view`; the raw asset stays at `<path>` so links work.

## Validation

From `docs-viewer/`:

```bash
npm test          # smoke build + the PRISM-view test suite (scripts/prism-test.mjs)
npm run smoke     # smoke build only
npm run test:prism
```

The smoke test builds a temporary project (markdown, mermaid, plantuml, draw.io, image, PDF, CSV,
download) and verifies generated files stay in the runtime. `prism-test.mjs` covers the structured
view, the rich-diff engine (htmldiff/cluster/frontmatter/code-aware/netByDoc), and a real-engine e2e.

## Package release

docs-viewer is released as its own standalone zip, independent from PRISM releases:

```bash
cd docs-viewer
npm run release   # runs the smoke test, then writes dist/*.zip + .sha256
```

Don't copy these artifacts into `prism/dist/` — the PRISM zip and the docs-viewer package are separate
streams. (PRISM releases bundle a copy of docs-viewer under `tools/docs-viewer` automatically.)
Each zip includes `MANIFEST.txt`, with paths relative to the extracted docs-viewer root, so installers
can remove stale managed files on upgrade without needing Node.js.

### Install from zip

```bash
unzip sdlc-framework-docs-viewer-X.Y.Z.zip
cd /path/to/your-project
/path/to/sdlc-framework-docs-viewer-X.Y.Z/launch.sh
```

Windows PowerShell:

```powershell
Expand-Archive sdlc-framework-docs-viewer-X.Y.Z.zip -DestinationPath . -Force
cd C:\path\to\your-project
powershell -ExecutionPolicy Bypass -File C:\path\to\sdlc-framework-docs-viewer-X.Y.Z\launch.ps1
```

## Limitations

- PlantUML and draw.io viewers need internet (they call `plantuml.com` / `viewer.diagrams.net`).
- The **Rendered** diff uses `marked`, so it matches the viewer for prose/tables/lists/mermaid but not
  VitePress-only extras (Shiki code highlighting, `:::` containers).
- Adding new files to `docs/` while the dev server runs needs a restart (the sidebar is built at startup).

Node.js 20 or newer is required.
