# docs-viewer — PRISM sprint/changes selective preview + export

> ⚠ **SUPERSEDED (2026-06-27)** by `prism-preview-discussion.md` — the flat 4-phase preview +
> per-document picker described here was replaced by the single structured tree (Living Truth by
> phase + sprint picker A/B + draft sprints w/ merged + sealed at bottom). Kept for history.

Status: **requirements captured, awaiting design answers** · Created 2026-06-26

## Source request (user)

- docs-viewer phải **view được sprint + changes** (proposals + change packs).
- View được **cả sprint đã duyệt (approved/sealed) lẫn sprint chưa duyệt (đang làm) + changes**.
- **Nhiều sprint chưa duyệt** cũng view được.
- Có **checkbox** để chọn tài liệu đưa vào merge/preview:
  - mặc định **tích full theo từng sprint**;
  - **bỏ tick được** các phần đang **DRAFT**;
  - phần đã **APPROVED** thì **không** được bỏ tick (luôn included).
- Có **nút Export** tạo **1 file markdown đã combined**, **download về** (KHÔNG ghi vào `./docs` / folder hiện tại).

## Understanding / design sketch (to confirm)

- Reuse the single composer (`prism .../effective_truth.py`) — no merge logic reimplemented in Node (keeps one source of truth, as established).
- Two new pieces of engine support likely needed in `effective_truth.py`:
  1. **List sources** (`--list-sources --format json`): inventory of every composable source — sprint, phase, type (proposal | change-pack delta), status (APPROVED | DRAFT), rel path — so the viewer can render the checkbox tree.
  2. **Selective compose**: include living truth + ALL approved sources always, plus ONLY the user-selected DRAFT sources (e.g. `--include-draft <relpath>` repeatable; bare `--with-drafts` = all drafts as today).
- Viewer (dev mode): a checkbox tree (grouped by sprint) → posts the selection to a dev endpoint → re-composes → renders. Approved leaves are checked + disabled; draft leaves toggleable; default all-checked.
- Export: a button → server composes the current selection → returns the combined markdown as a **download** (Content-Disposition attachment), never written into the project.

## Open questions (asking the user before building)

1. **Checkbox granularity** — what is one selectable "part"? per source document (proposal / change-pack delta) grouped by sprint [proposed] · per phase per sprint · per individual anchored item (FR/US/…).
2. **Export format** — one combined `.md` for all phases [proposed] · one `.md` per phase.
3. **Scope/mode** — interactive picker + export are **dev-viewer only** (need the running server); static `build` keeps the default full preview [proposed] · must also work in static build.
4. **Sealed sprints in the picker** — shown as a locked "Living Truth (sealed)" base node, always on [proposed] · hidden (always included implicitly).

## Decisions (answered 2026-06-26)

- **Granularity: per source document** — each proposal / change-pack delta is one checkbox, grouped by sprint. APPROVED = checked + disabled (locked on); DRAFT = toggleable; default all checked.
- **Export: one `.md` per phase, bundled as a `.zip`** download (product.md, design.md, architecture.md, testing.md for the current selection).
- **Mode: dev viewer only** — picker + re-compose + export need the running `docs-view dev` server (server-backed endpoints, like the Refresh button). Static `build` keeps the default full preview.
- **Sealed sprints: locked base node** — show "Living Truth (sealed: v1, …)" as an always-on, non-untickable base in the picker.

## Implementation — DONE (2026-06-26)

- [x] `effective_truth.py`: `--list-sources` JSON inventory (`{sealed_sprints, sources:[{sprint,phase,type,status,path,pack?}]}`)
- [x] `effective_truth.py`: `--include-draft <relpath>` (compose only chosen drafts; APPROVED always) + `--preview` (lenient + banner without forcing all drafts; the "all unticked" case)
- [x] docs-viewer: interactive source-picker on the PRISM preview index (sealed locked base; APPROVED checked+disabled; DRAFT toggleable; default all-checked) — `renderPicker` in `src/prism-preview.js`
- [x] docs-viewer: dev endpoints `/__prism-compose` (set selection + recompose) and `/__prism-refresh`; selection held in `prismState.selection`, shared with the watcher (auto-refresh recomposes with the selection)
- [x] docs-viewer: **Export** → `/__prism-export` returns one `.md` per phase bundled by a no-dependency stored-ZIP writer (`src/zip.js`), as an attachment download (never written to the project)
- [x] tests: engine (`tests/test_effective_truth_drafts.py` — list-sources + selective inclusion); viewer node-only smoke (endpoint wiring + zip signature); real-core e2e (picker markup, compose-with-selection, export zip via `unzip -t`)

### How it behaves

- **Dev only** (`docs-view dev`): the picker + Apply + Export need the running server. Static `build` shows a non-interactive snapshot note.
- **Multiple unsealed sprints**: all appear in the picker, grouped by sprint; sealed sprints show as the locked "Living Truth (sealed: …)" base.
- **Compose semantics** (engine): APPROVED + sealed always composed; selection = the ticked DRAFT paths (`--include-draft`); none ticked → approved-only preview (`--preview`).
- **Anti-duplication**: one composer (`effective_truth.py`), invoked on demand; pages live only in the gitignored `.docs-view/` runtime, never in `./docs`.

### Polish (user feedback, 2026-06-26)

- [x] **#1 Friendly labels** — picker shows "PRD", "Change pack fix-payment · Product", "Epic EP-001 · …" instead of raw paths; raw path is a hover tooltip (`title=`).
- [x] **#2 Content-first** — the phase links are the landing; the picker / what-changed / Apply / Export live in a collapsed `<details>` panel.
- [x] **#4 Optional "what changed"** — engine `--change-summary` (op + id + title + source for the included drafts); viewer renders a checkbox (default OFF) that toggles a hidden list of Added / Updated / Removed.
- [x] **#6 Timestamped export** — `prism-preview-<YYYY-MM-DD-HH-MM-SS>.zip`.
- (#3 export stays per-phase `.zip`; #5 granularity stays per-document — per user.)

Status: **complete + polished; verified; awaiting commit (docs-viewer + prism engine flags).**
