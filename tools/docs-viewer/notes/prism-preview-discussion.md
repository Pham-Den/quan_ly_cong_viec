# docs-viewer — PRISM preview: discussion & requirements log

Status: **ĐÃ TRIỂN KHAI + test xanh** (Q1–Q6, D1–D5) · Created 2026-06-26 · Implemented 2026-06-27

> Mục đích: note lại các trao đổi (Q&A, hiểu lầm cần làm rõ, quyết định UX/requirement)
> quanh tính năng "PRISM Preview (incl. drafts)" trong docs-viewer. Sẽ điền dần khi trao đổi.

## Bối cảnh đã thống nhất (từ trao đổi trước)

- Sidebar hiện có 2 tầng: **trên** = "PRISM Preview (incl. drafts)" (bản **combine** compose live qua
  `effective_truth.py`, 4 trang phẳng: Product/Design/Architecture/Testing); **dưới** = nguyên cây
  `./docs` (file gốc, **không** combine, gồm cả living truth lẫn draft sprint files).
- Nguyên tắc bất biến: **không reimplement merge ở Node** — luôn gọi `effective_truth.py` (1 source of truth);
  trang preview chỉ sống trong `.docs-view/` runtime, **không bao giờ ghi vào `./docs`**.

## Yêu cầu mới (user, 2026-06-26) — "tổ chức giống hệt docs, nhưng…"

Muốn thay bản preview 4-trang-phẳng bằng một cây **mô phỏng cấu trúc docs thật**, với điều khiển chọn sprint:

1. **Living Truth lên đầu, sắp theo đúng PHASE** (Product → Design → Architecture → Testing).
2. **Tại Living Truth (mức "document")**: có **nhiều checkbox chọn các sprint đang mở** — chọn 1 hoặc nhiều,
   nhưng **ràng buộc tuần tự**: muốn chọn `V(n+2)` thì phải chọn `V(n+1)` trước (không bỏ trống ở giữa).
   Kèm **2 nút**:
   - **Nút A — Merge approved**: gộp các document **APPROVED** (gồm cả changes/change packs) của các sprint đã tích.
   - **Nút B — Merge drafts (thêm)**: gộp thêm các document **DRAFT** (gồm cả changes). **Chỉ enable sau khi
     nút A đã chạy** với selection hiện tại.
3. **Khu sprints chia 2 loại:**
   - **Sealed / closed sprint** → đẩy **xuống dưới cùng**.
   - **Draft sprints** → ở trên; trong **mỗi draft sprint** có **checkbox "xem merged changes vào"**
     (gồm cả draft) — preview cục bộ của riêng sprint đó.

### Phác thảo nav đề xuất (để confirm)

```
PRISM Preview
├── Living Truth                       ← combine, mirror cấu trúc docs, nhóm theo phase
│   ├── Product/  (PRD, Personas, …)
│   ├── Design/
│   ├── Architecture/
│   └── Testing/
│   [chọn sprint đang mở: ☐v1 ☐v2 ☐v3  — ràng buộc prefix]
│   [Nút A: Merge approved (incl. changes)]
│   [Nút B: + Merge drafts (incl. changes)]   (enable sau khi A chạy)
├── Draft sprints
│   ├── Sprint v2   [☐ xem merged changes (incl. draft)]
│   └── Sprint v3   [☐ …]
└── Sealed / closed sprints            (dưới cùng)
    └── Sprint v1
```

### Ánh xạ sang engine (`effective_truth.py`) — cái gì đã có / cái gì cần thêm

- ✅ Ràng buộc tuần tự `V(n+2) ⇒ V(n+1)` khớp **đúng** mô hình cộng dồn `--up-to-sprint vN`
  (compose = living truth + approved proposals của các sprint Y<X theo thứ tự).
- ✅ Tách approved vs draft: default = approved-only; `--with-drafts` / `--include-draft <path>` / `--preview`.
- ✅ `--list-sources --format json` → inventory (`sealed_sprints`, `sources[{sprint,phase,status,path,pack?}]`).
- ❓ **Per-document compose** (1 trang/ document như PRD, Architecture…) thay vì 1 trang/ phase — cần xác nhận
  rồi mới biết có phải mở rộng engine không (hiện engine xuất **theo phase**).
- ❓ Preview cục bộ theo **từng sprint** (yêu cầu #3) — cần cách compose "chỉ base + changes của riêng sprint này".

## Quyết định (đã chốt 2026-06-26)

| # | Câu hỏi | Quyết định |
|---|---------|-----------|
| Q1 | Phạm vi chọn sprint ở Living Truth | **Toàn cục** — 1 selection áp cho mọi document; giữ effective truth nhất quán |
| Q2 | Mô hình ràng buộc tuần tự | **Prefix từ sprint mở thấp nhất** = "gộp tới sprint X"; mọi sprint thấp hơn luôn gồm → khớp đúng `--up-to-sprint` (không cần đụng engine cho phần này) |
| Q3 | Độ mịn draft (nút B) | **All-or-nothing theo sprint đã tích** — bỏ untick-từng-draft của bản hiện tại |
| Q4 | Độ mịn trang Living Truth | **Mỗi document 1 trang** (mirror docs thật), nhóm theo phase |
| Q5a | Quan hệ #3 vs #2 | **Độc lập hoàn toàn** — checkbox trong mỗi draft sprint chỉ đổi view của riêng sprint đó; không động tới selection Living Truth toàn cục |
| Q5b | Sealed/closed sprint (dưới cùng) | **Chỉ duyệt file gốc** — đã nằm trong Living Truth nên không có nút merge/checkbox |
| Q6 | Trạng thái 2 nút khi đổi tick sprint | **B disable lại, phải bấm A trước** — đổi selection ⇒ về trạng thái chưa-compose, khóa B tới khi chạy lại A. Preview là **thay thế** (approved → approved+draft), không xếp lớp |

## Thiết kế kỹ thuật (2026-06-26)

### A. Xác minh engine (`effective_truth.py`) — đã đọc code

| Hạng mục | Trạng thái | Chi tiết |
|----------|-----------|----------|
| **Per-document compose (Q4)** | ✅ **đã có** | `--format json` (`main_auto`) xuất **mảng**, mỗi phần tử = **1 living-truth document**: `{phase, living, content, includes_drafts, applied_proposals}`. `living` = `docs/<phase>/<doc>.md`. `--phase all --format json` → mọi document, mọi phase, **1 lần gọi**. (md mode mới là cái gộp-theo-phase mà viewer đang dùng.) |
| **Epic files** | ✅ động | product gồm thêm `product/epics/EP-NNN-*.md` (`discover_epic_files`) → mirror được đúng cây docs. |
| **Prefix "gộp tới X" (Q2)** | ✅ đã có | `--up-to-sprint vX`: enumerate bỏ sprint > X, bỏ sprint sealed; cộng dồn theo thứ tự sprint. |
| **Approved vs draft (Q3)** | ✅ đã có | default = approved-only; `--with-drafts` = thêm **tất cả** draft ≤ X. All-or-nothing khớp `--with-drafts`, không cần `--include-draft` từng path. |
| **Inventory cho picker** | ✅ đã có | `--list-sources --format json` → `{sealed_sprints:[v1,…], sources:[{sprint, sprint_n, phase, type, status, path, pack?}]}`. Sprint mở (draft) = các `sprint_n` distinct trong `sources`. |
| **What-changed (tùy chọn)** | ✅ đã có | `--change-summary` (op/id/title/source của draft đã chọn). |
| **Per-sprint cô lập (#3)** | ⚠ **một phần** | Engine **cộng dồn**, không có chế độ "chỉ sprint N, bỏ sprint ở giữa". Ngữ nghĩa **cộng dồn tới N + draft riêng N** thì làm được: `--up-to-sprint vN --preview --include-draft <paths của N>`. Cô lập thật (sealed base + chỉ N) cần **flag mới**. |

→ **Kết luận:** Q1–Q4 + #3 (theo nghĩa cộng dồn) **không cần sửa engine**. Chỉ viết lại phần viewer.

### B. Ánh xạ hành động UI → lệnh engine

| Hành động UI | Lệnh |
|--------------|------|
| Living Truth **base** (chưa chọn sprint) | `--phase all --format json --up-to-sprint v<minUnsealed − 1>` (không proposal nào áp ⇒ living truth nguyên bản) |
| Inventory cho picker | `--list-sources --format json` |
| **Nút A** — merge approved tới `vX` | `--phase all --up-to-sprint vX --format json` |
| **Nút B** — merge approved+draft tới `vX` | `--phase all --up-to-sprint vX --with-drafts --format json` |
| Draft sprint `vN` — merged **OFF** | `--phase all --up-to-sprint vN --format json` |
| Draft sprint `vN` — merged **ON** (incl. draft) | `--phase all --up-to-sprint vN --preview --include-draft <draft paths của vN> --format json` |
| Export | compose theo selection hiện tại → zip |

### C. Cấu trúc viewer (`src/prism-preview.js`) — MỘT cây duy nhất (D1)

**Bỏ mô hình 2 cây cũ** (preview node + cây `./docs` thô riêng). Thay bằng **biến đổi cây `./docs` thô thành
1 cây có tổ chức** — không mất file nào, chỉ-1-cây nên hết confusing:

```
PRISM Preview (1 cây)
├── Living Truth                    ← nhóm theo phase (product→design→arch→testing), ĐẦU
│   ├── (index) sprint-picker prefix + Nút A + Nút B + (what-changed)
│   ├── Product/      prd, glossary, personas, market-research, epics/EP-*  [.md → bản COMPOSE]
│   │                 + asset trong product/ (drawio/ảnh…) [để NGUYÊN, không engine]
│   ├── Design/       design-system
│   ├── Architecture/ architecture, nfr, … + diagram.drawio (raw)
│   └── Testing/      test-cases
├── Draft sprints/                  ← sprint mở (inventory); mỗi sprint: file gốc + [☐ xem merged (incl. draft)]
├── <file/folder "vô gia cư">       ← GIỮ NGUYÊN vị trí folder gốc (README, docs/assets/…), raw, không engine
└── Sealed / closed sprints/        ← DƯỚI CÙNG, chỉ duyệt file gốc, không control
```

**Quy tắc dựng cây (transform scan tree, không append):**
- File engine **nhận** (living-truth `.md` trong `PHASE_LIVING_FILES` + epics) → thay nội dung bằng bản
  **compose** (`--format json`), gom vào **Living Truth** theo phase.
- File **không nhận** → để **nguyên (raw)**, KHÔNG qua engine: nếu trong folder phase thì ghép vào phase đó;
  nếu vô gia cư thì **giữ nguyên vị trí folder gốc** (phản ánh cây thư mục thật).
- `sprint-v*` → tách draft (unsealed, từ inventory) vs sealed; sealed xuống **đáy**, browse-only.
- Thứ tự top-level: **Living Truth → Draft sprints → (folder vô gia cư theo vị trí thật) → Sealed (đáy)**
  *(chi tiết chèn folder vô gia cư chốt lúc code)*.

**State (server-side, như `prismState` hiện có):**
- Global Living Truth: `{ upTo: 'vX'|null, stage: 'base'|'approved'|'drafts' }`. Đổi `upTo` ⇒ `stage`
  về `approved`-chưa-chạy / khóa B (Q6). Nút A ⇒ stage=`approved`; Nút B (chỉ enable sau A) ⇒ stage=`drafts`.
- Per-sprint (#3, độc lập — Q5a): `merged: { [sprintN]: bool }`. Không liên quan global.

**Endpoints (mở rộng bộ compose/refresh/export hiện có):**
- set global selection (`upTo` + `stage`) → recompose Living Truth.
- set per-sprint merged toggle → recompose sprint đó.
- export theo selection hiện tại.

**Bất biến giữ nguyên:** chỉ gọi engine (không reimplement merge); chỉ ghi `.docs-view/`, **không** đụng `./docs`;
guard "`./docs` đã có `prism-preview/`".

### D. Quyết định (cập nhật 2026-06-26)

- **D2 — Ngữ nghĩa #3:** ✅ **Cộng dồn tới N + draft của N** — không cần sửa engine
  (`--up-to-sprint vN --preview --include-draft <paths của N>`).
- **D3 — Node draft sprint:** ✅ **File gốc + toggle merged** — duyệt được proposal/delta gốc, tick để xem
  bản compose.
- **D4 — Export:** ✅ **1 `.md`/document** — zip mirror cây docs (khớp Q4 per-document).
- **D5 — Living Truth base:** đề xuất mặc định **hiện sealed-only đã compose** (override được).
- **D1 — Cây mới vs cây `./docs` thô:** ✅ **1 cây duy nhất** (bỏ cây thô riêng để hết confusing). Biến đổi
  cây `./docs` thành cây có tổ chức (mục C): file merge-được → bản compose dưới Living Truth; file
  không-merge-được → để **nguyên vị trí folder gốc** (raw, không engine) → không mất asset/file nào.

## Đã triển khai (2026-06-27)

- [x] **Engine: KHÔNG sửa** — mọi quyết định map vào flag có sẵn (D2 = cộng dồn).
- [x] Viewer: **transform** scan tree thành 1 cây có tổ chức — `injectPrismStructure()` thay
  `injectPrismPreview()`; `dev.js`/`build.js` đổi từ `unshift` node sang transform cả cây.
- [x] Viewer: living-truth `.md` → bản compose (`--phase all --format json`); file không-nhận để raw
  đúng vị trí (asset drawio/pdf/ảnh giữ trong phase folder; file lạc giữ vị trí gốc).
- [x] Viewer: Living Truth nhóm theo phase (đầu); sprint-picker **prefix** + state máy **A/B** (Q2/Q6).
- [x] Viewer: Draft sprints (file gốc + subfolder "Merged (incl. draft)" — D3/D2, độc lập — Q5a).
- [x] Viewer: Sealed sprints browse-only ở **đáy** (Q5b).
- [x] Viewer: Living Truth base mặc định = sealed-only compose (`--up-to-sprint v0`) (D5).
- [x] Export: 1 `.md`/document, zip mirror cây (D4) — `/__prism-export`.
- [x] Tests: `scripts/prism-test.mjs` — 45 assertions (unit transform qua injected engine + source-safety
  + picker markup + pure helpers) **và** real-core e2e qua ENGINE THẬT (base/approved/drafts + per-sprint
  merged). Smoke (`scripts/smoke-test.mjs`) cập nhật cho API mới. Đã verify build VitePress thật (static +
  interactive SSR) + dev server + endpoints compose/export qua HTTP.

### Sửa UX picker sau feedback (2026-06-27)
Bản 2-nút A→B (Q6) gây khó hiểu khi dùng thật ("Merge approved sáng mặc định" tưởng đang active;
"+Merge drafts" bấm không thấy gì đổi vì chưa tick sprint → v0 rỗng; không có loading). **Đổi sang
mô hình checkbox** (rõ hơn — user yêu cầu):
- Tick sprint (prefix) + 1 checkbox **"Include drafts"** + **1 nút Apply** (thay 2 nút A/B).
- Apply/Export có **overlay loading chặn UI** ("Composing the Living Truth…") → không còn no-op im lặng.
- → **Q6 cũ (2 nút, B-sau-A) bị thay** bằng checkbox + Apply. Ngữ nghĩa engine không đổi (upTo + stage
  vẫn suy ra từ tick: stage = upTo>0 ? (drafts? 'drafts':'approved') : 'base').

### Lệch khỏi thiết kế ban đầu (ghi rõ)
- **#3 "checkbox xem merged"** → hiện thực bằng **subfolder "Merged (incl. draft)"** dưới mỗi draft sprint
  (không phải checkbox). Lý do: VitePress sidebar là tĩnh (sinh 1 lần ở config), checkbox client-side không
  đổi được cấu trúc nav mà không regen config. Subfolder cho cùng giá trị, luôn sẵn, không cần server.
- **Đã bỏ** (cái không cần thiết): per-document draft picker cũ, panel "what changed", các trang
  `prism-preview/` phẳng 4-phase. (Flag engine `--change-summary`/`--include-draft` vẫn còn, chỉ viewer
  không dùng nữa.)

### File đụng tới
- `src/prism-preview.js` (viết lại), `src/dev.js`, `src/build.js` (`copyRawAssets` tính path theo
  docs-relative thay vì tree-nesting), `scripts/smoke-test.mjs`, `scripts/prism-test.mjs` (mới),
  `package.json` (test script).

## Source resolution + 2-layer detection + folder picker (2026-06-27)

Yêu cầu mới: docs-viewer chạy được ở bất kỳ đâu, tự tìm docs, và nhận diện theo **cấu trúc thư mục**
(không bắt buộc `.prism`). Quyết định: walk-up tìm `docs/` · trang chọn trong browser khi không thấy ·
2-layer-không-engine → Living Truth layout raw.

**Đã làm:**
- `src/resolve-docs.js`: `findDocsDir` (đi ngược cây tìm `docs/` gần nhất), `resolveDocsArg`
  (`docs-view [dev|build] <path>` — nhận docs dir hoặc project root), `discoverDocsCandidates` (cho picker).
- `src/folder-picker.js`: trang picker (liệt kê `docs/` gần đó + ô nhập path) + endpoint `/__docs-pick`.
- `src/cli.js`: positional `<path>` arg; **projectRoot = dirname(docsDir)** (nơi `.prism`/config/runtime/
  `docs-dist` sống) — tách khỏi cwd.
- `src/prism-preview.js`: `detect2Layer(docsDir)` (≥1 phase folder product/design/architecture/testing có
  `.md`, bỏ qua folder khác). `injectPrismStructure` trả **`{ mode }`**:
  - `composed` — 2-layer + `.prism` engine: như mục trên (compose + picker + sprints).
  - `raw` — 2-layer, KHÔNG engine: chỉ gom phase folders thành "Living Truth" (file RAW, không compose/picker);
    sprint/file khác giữ nguyên vị trí.
  - `none` — không 2-layer: cây phẳng + note "ℹ Browser view".
- `src/dev.js`: vòng đời `serve(dir)` — runtime prepare 1 lần; đổi docs (qua picker) chỉ rebuild `content/`
  + config rồi **đóng + tạo lại server trên cùng port** (để re-register endpoint; Vite config-watch không
  chạy lại endpoint của ta). `docsDir=null` → picker. **Quan trọng**: build content TRƯỚC khi đóng server
  (nếu lỗi thì server cũ còn nguyên).

**Đã verify (live):** picker phục vụ khi không có docs → POST `/__docs-pick` → server trỏ lại đúng project
trên cùng port; composed-dev + `/__prism-compose` vẫn chạy sau khi viết lại dev.js; re-point từ PRISM project
sang raw project OK. Tests: `scripts/prism-test.mjs` (75 assertions, gồm resolve-docs/detect2Layer/raw/none/
picker) + smoke + real-core e2e — xanh.

**Lưu ý:** picker browser **không** mở hộp thoại OS (VitePress không trỏ live sang folder OS bất kỳ được) —
nó liệt kê các `docs/` tìm được gần đó + cho nhập path. Đã thống nhất ở Q2.

### UI/UX polish round (2026-06-28)
1. **Dark buttons dịu hơn**: tab active dùng `--vp-c-brand-soft` (không fill solid chói); primary dùng
   `--vp-c-brand-3`. Áp cho DiffBrowser tabs, FolderBrowser, picker buttons (BTN/BTN_GHOST).
2. **Spacing rộng hơn** giữa button (gap/margin) ở cả 2 theme.
3. **FolderBrowser tách rõ**: 2 lựa chọn đánh số (1 = OS dialog, 2 = browse) + divider "or"; folder có
   `docs/` được tag + highlight; current-dir có docs hiện bar "Found a docs/ folder" tách riêng.
4. **Doc-diff**: cột trái sắp theo **phase order** (product→design→arch→testing); panel trái **đóng/mở
   được** (nút "‹ hide" / "›") để rộng chỗ.
5. **Ẩn/hiện cả sidebar**: nút "⟨ Hide menu" trên nav bar (theme `Layout.vue` slot `nav-bar-content-after`
   + `SidebarToggle.vue`) → toggle class `.prism-hide-sidebar` (ẩn `.VPSidebar`, content full width),
   nhớ qua localStorage. Verified build + smoke (Layout tuỳ biến chạy cả trang non-PRISM).

### Diff: wide layout + rendered preview (2026-06-28)
- **Rộng hơn**: trang Living Truth thêm frontmatter `aside: false` + `pageClass: prism-wide`; `theme/style.css`
  `.prism-wide` cho content full băng layout (1600px) → side-by-side thoải mái. Scoped, trang prose khác không đổi.
- **Rendered preview**: thêm chế độ xem thứ 3 (control **Unified / Side by side / Rendered**). Rendered =
  render **markdown** của nội dung "after" (ctx + dòng thêm) bằng `marked` (đã pin vào deps; mermaid giữ marked@16
  nested, không xung đột). `DiffBlock` đổi prop `sbs`→`mode`. Verified build (marked bundle) + `Layout prism-wide`.
- **(2026-06-28) Rendered khớp viewer**: bỏ chrome/override riêng, render vào `.vp-doc` (đúng class VitePress
  dùng cho mọi trang md) → look giống render md toàn viewer. Lưu ý còn khác ở extras VitePress (code Shiki,
  mermaid diagram, container `:::`) — preview dùng `marked` không có; chỉ khớp cho nội dung thường/bảng.
- **(2026-06-28) Đã thử full-doc rồi REVERT**: từng đổi Rendered sang render **toàn bộ** composed content
  (để bảng to render đủ) nhưng user thấy "render tất cả ra ko hay" → quay lại render **chỉ phần hunk** (sau).
  Gỡ sạch plumbing `content`. Đây là baseline trước khi làm Part 2.

### Part 2 — Rich rendered diff (2026-06-28)
User chốt: tab **Rendered** không chỉ show kết quả sạch mà show **diff ngay trên bản render** (xanh/đỏ +/−),
là một *cách hiển thị* chứ không phải tab thứ 4.

**Tiến hoá:** Hướng C (block-level, tách khối + gap `⋯`) → user "ko dễ nhìn" → BỎ. → Hướng B
structure-aware (token markdown, tự dựng table/list HTML) → user "tạm ok" nhưng muốn **bản tốn kém
nhất = word-level toàn DOM** + **màu rõ ràng hơn**. → CHỐT: **word-level trên HTML đã render** (htmldiff).

Hạ tầng dùng chung (giữ qua C/B/htmldiff):
- **Engine** (`effective_truth.py`): cờ **`--with-content`** cho `--per-source-diff` → mỗi entry diff kèm
  `before`/`after` **markdown đầy đủ** (không chỉ hunk n=3). Opt-in, output mặc định vẫn gọn. Additive (752 pytest pass).
- **Runner** (`prism-preview.js perSourceDiff`): gọi kèm `--with-content`; **fallback** tự bỏ cờ nếu engine
  `.prism` cài cũ chưa hỗ trợ (rich mode khi đó render từ hunk, không vỡ).
- **`DiffBrowser.vue`**: tải `before`/`after` qua cả 2 grouping (Source + Document) xuống `DiffBlock`.
- **`DiffBlock.vue`**: prop `before`/`after`; `mode==='rendered'` → `richDiffHtml` khi có content, else fallback `marked(afterText)`.

**`rich-diff.js` (CHỐT — word-level trên HTML đã render, kiểu htmldiff):** thử pure word-level chèn vào
*markdown source* thì **vỡ cấu trúc** (added row → text, tag span `\n` ăn nội dung sau); structure-aware
token thì "tạm ok" nhưng không phải "toàn DOM". Bản cuối = **render before/after ra HTML rồi diff token
của HTML**:
- `marked.parse` 2 bên → `tokenize` HTML thành: thẻ `<…>` | entity `&…;` | từ (chữ/số) | khoảng trắng |
  ký tự đơn (dấu câu tách riêng để từ chung vẫn khớp).
- `diffArrays(aTokens, bTokens)` → walk: equal nối thẳng; added → `wrap('ins')`; removed → `wrap('del')`.
- `wrap` **chỉ bọc chạy token KHÔNG-phải-thẻ** (từ), **emit thẻ nguyên** ra ngoài → HTML **luôn hợp lệ**:
  bảng vẫn là bảng, hàng mới là `<tr>` thật có chữ tô, item mới là `<li>` thật, sửa = word-level ở *mọi*
  chỗ (prose/ô/heading). Không bao giờ bọc whitespace-only.
- Pure string (không DOMParser) → chạy cả browser + node (test import trực tiếp). identical → render phẳng.
- **Màu (rõ ràng 2 theme):** `ins.rd-ins` nền xanh + **gạch chân** (box-shadow inset), `del.rd-del` nền đỏ +
  **gạch ngang** dày → phân biệt được **không chỉ bằng hue**. Dark mode override sáng hơn (`.dark .dvd-rendered`).
- **Hàng/item thêm-bớt nguyên cái** (user hỏi "removed row"): word-mark trong ô dễ bỏ sót → thêm **full-row
  tint** bằng `:has()` — `tr/li:has(ins):not(:has(del))` = xanh cả hàng, `:has(del):not(:has(ins))` = đỏ cả
  hàng; hàng vừa thêm vừa sửa thì giữ word-mark. (Lưu ý: removal hiếm vì PRISM proposal chủ yếu `## New`;
  source nào *sửa/xoá* mới ra đỏ — vd prd.md v4 có ~900 vệt del, 34/90 hàng có chữ bị gạch.)
- Tests: `unit_richDiff` (word ins/del + ô bảng + **added row = `<tr>` thật, không leak `| pipes`** +
  **added item = `<li>` thật** + removed row + **tag-balance** + doc-mới + identical) + e2e real-core
  `--with-content` (before/after thật, default lean) + runtime `/__prism-diff` + **tag-balance trên nội
  dung THẬT**. **118 assertions, all green.**

**Render lỗi table/mermaid? (2026-06-28):** user báo Rendered "ko render table/mermaid". Soi TẤT CẢ
composed docs: **table KHÔNG hề vỡ** (malformed=0, `.vp-doc table` của VitePress vẫn style — đã verify
selector). Vấn đề thật chỉ là **mermaid**: `marked` không có plugin nên ```mermaid ra **code block** thay
vì diagram (khác viewer dùng `vitepress-plugin-mermaid` = transform markdown-it lúc compile → `<Mermaid>`).
**Fix:** trong `DiffBlock`, sau khi v-html render, `onMounted`/`watch` quét `pre>code.language-mermaid`,
**block KHÔNG đổi** (không có ins/del bên trong) → `import('mermaid')` render SVG thay vào (theme theo
`.dark`); **block ĐÃ đổi** → giữ source để thấy thay đổi. Dynamic import nên SSR build không vỡ. Code
thường (non-mermaid) vẫn là code thuần (không Shiki) — chấp nhận trong ngữ cảnh diff.

**Chống confetti (cluster collapse) + sửa lỗi HTML hỏng → diff PER BLOCK (2026-06-28):** khi 1 đoạn bị
viết lại nhiều, word-level thành "lỗ chỗ" đỏ/xanh xen kẽ. Heuristic theo **mật độ** (không phải % tổng):
gom thay đổi thành **cụm** (cách nhau ≤ `BRIDGE_WORDS`=3 từ chung; xa hơn → cụm riêng, vẫn inline); cụm
**dày** (≥ `COLLAPSE_WORDS`=10 từ đổi, có cả thêm LẪN xoá) → hiện **trọn đoạn cũ (đỏ) + trọn đoạn mới
(xanh)**, hết xen kẽ.
QUAN TRỌNG — khi làm phát hiện cách cũ (diff toàn bộ HTML token stream) **tạo HTML hỏng**: `diffArrays`
(Myers LCS) khớp chéo các thẻ cấu trúc giống nhau (`<table>`/`<tr>`/`<code>`) → mồ côi thẻ đóng (prd.md
lệch table/tr/tbody/code mỗi thứ −1). ⇒ Viết lại **diff THEO BLOCK**: `marked.lexer` tách block, diff
chuỗi block; **dựng cấu trúc tường minh** (table per-row/cell, list per-item) nên HTML LUÔN cân; chỉ
word-diff *nội dung* trong block prose (kèm cluster-collapse). Block thêm/xoá nguyên cái → tint khối
(`rd-blk-ins/del`); code/html đổi → render bản mới sạch (tránh `marked` escape thẻ `<ins>` trong fence);
heading thêm mới → tint khối (tránh `<ins>` chặn cú pháp `#`). Verify nội dung THẬT: **mọi doc cân thẻ
100%**, đoạn AS-IS confetti giờ gộp 1 đỏ + 1 xanh. Tests 129 + smoke OK.

**Refactor 3 view về chung master-detail + sửa spam mermaid (2026-06-29) — đợt đóng:**
- **Layout nhất quán**: cả 3 view dùng 1 khung **trái (FILE browser) + phải (diff)**. Cột trái LUÔN là
  browser theo file; chỉ khác cách nhóm: **Net** = nhóm theo **phase** (như LT) → phải = diff gộp doc vs LT;
  **Per sprint** & **By change** = nhóm file vào **folder sprint** (📂 Sprint v3 / v4 → các file đổi trong sprint
  đó). Bấm 1 file trong folder sprint → phải hiện đúng file đó: Per-sprint = delta của file trong sprint đó
  (vs sprint trước, gộp change-unit), By-change = từng change-unit của file đó (proposal/change-pack +
  [DRAFT/APPROVED]). `sprintFolders` (per sprint → docs, mỗi doc có `diff` gộp + `changes[]`); chọn = cặp
  (sprint, doc) qua `curFolder`/`curSprintDoc`. `watch([data,groupBy])` giữ selection hợp lệ; badge `+X/−Y`;
  cột trái collapse được. Bỏ layout cũ (Net stack phẳng, Source sprint-first, Document master-detail riêng).
- Verify data thật: sprint list v3(+94/−12)/v4-draft(+573/−82); Per-sprint v3=6 doc (vs base), v4=4 doc (vs v3);
  By-change v4=4 DRAFT source. Smoke build OK (component compile sạch), 134 assertions.
- **Mermaid "báo ầm" khi view**: nội dung 43 block hợp lệ; lỗi là do `DiffBlock.renderDiagrams`:
  `mmidSeq` để **per-instance** → nhiều DiffBlock cùng id `rd-mmd-0` → **trùng id mermaid → lỗi hàng loạt**;
  thêm không `suppressErrorRendering` nên block lỗi nào cũng nhét "bomb" SVG + log. Fix: **id ngẫu nhiên duy
  nhất** (Date.now+random), **`initialize({suppressErrorRendering:true})`**. (Refactor master-detail cũng
  giảm số DiffBlock render cùng lúc.)

**(2026-06-29) Mermaid trong diff vẫn "ko hiển thị" → bỏ gate `parse`:** đợt trên mình thêm
`mermaid.parse(suppressErrors)` validate-trước, NHƯNG `parse` **trả `false` cho graph TD HỢP LỆ** (test trên
Flow B của design-system) → gate skip MỌI diagram → ra text. (Trang Living Truth thường vẫn render OK:
vitepress-plugin-mermaid transform 3/3 fence, 0 untransformed — nên diagram chắc chắn hợp lệ.) Fix: **bỏ
gate `parse`**, render thẳng `mermaid.render` trong try/catch (id duy nhất + `suppressErrorRendering` đã đủ
chống spam/bomb; diagram lỗi thật → catch → giữ code). Q "assets trong menu kiến trúc": project test
**không có file asset rời** — 9 doc kiến trúc đều `.md` (đủ trong menu), diagram là **mermaid inline** trong
`sequence.md`/`erd.md`/`design-system.md`; nếu có `.drawio/.puml/ảnh` thì viewer mới hiện entry asset.

**Đổi tên view cho dễ hiểu (2026-06-29):** nhãn UI: **Net** | **Per sprint** (groupBy `document`, doc→delta
từng sprint) | **By change** (groupBy `source`, từng proposal/change-pack + DRAFT/APPROVED). Giữ NGUYÊN 3
view (không bỏ "source"): soi lại log thấy per-source = yêu cầu GỐC "show diff rõ sprint/draft nào" (dòng
378) + "#2 gồm cả changes/change packs" (dòng 24) → 1 sprint có nhiều change-unit/mix draft, chỉ By-change
giữ tách + nhãn trạng thái. Test data hiện chỉ có proposal thuần nên By-change trông ≈ Per-sprint, nhưng
khái niệm khác. groupBy values nội bộ giữ 'net'/'document'/'source'; chỉ đổi label + hint + thứ tự nút.

**Net diff (vs sealed Living Truth) — chế độ mặc định (2026-06-28):** thêm nhóm thứ 3 **Net** (mặc định),
cạnh Source/Document. Source/Document chỉ **pivot** cùng bộ delta per-sprint; Net là **phép tính khác**:
gộp tất cả delta thành **1 diff `base → final` mỗi doc** (base = sealed Living Truth = `before` của source
đầu; final = `after` của source cuối = bản merged hiện tại). ⇒ doc bị nhiều sprint sửa (vd prd.md: v3+v4)
hiện **1 thay đổi tổng** thay vì N mảnh. Use case: review/duyệt trước khi seal, preview drafts. Tính
**client-side** từ data `/__prism-diff` sẵn có (không đụng engine): `netByDoc(sources)` trong `diff-parse.js`
(testable) gom first.before→last.after, lọc doc thực đổi; `netPatch` (jsdiff `createPatch`, cắt header) cho
view Unified/Side-by-side; Rendered dùng richDiffHtml(before,after). Verify thật: 7 doc net-changed, prd.md
cân thẻ + BR-006 consolidated, patch +197/−71 parse OK. Mặc định **view = Rendered**. Thêm **chú thích UI**
(`groupHint`/`viewHint`) giải thích Source=pivot theo change, Document=pivot theo doc, Net=base→final.
**134 assertions.**

**Inline-code trong diff + collapse cho ô bảng + spacing (2026-06-28):** ảnh user cho thấy ô bảng (a)
vẫn confetti, (b) **rò thẻ `<ins>/<del>` thành text**. Nguyên nhân (b): ô có **inline code** `` `…` `` —
chèn mark VÀO trong code span thì `marked` escape → tag hiện literal (giống lỗi code fence). Fix: word-diff
**giữ code span `` `…` `` nguyên khối** (`mdWordTokens`, diff `diffArrays` thay vì `diffWordsWithSpace`),
mark đặt QUANH code, không vào trong. Gộp `proseDiff`+`inlineDiff` thành 1 hàm `diffMarks` dùng chung →
**ô bảng giờ cũng cluster-collapse** (hết confetti, vd ô QR gộp 1 đỏ + 1 xanh). Verify nội dung thật: mọi
doc cân thẻ + không rò tag. Thêm **spacing** trong DiffBrowser: header Sprint to + gạch chân + margin lớn;
mỗi change cách nhau bằng divider gạch đứt (`.dvb-src + .dvb-src`). Ngưỡng 10 từ giữ nguyên (hợp cả ô bảng).

**Frontmatter + code fence khớp viewer (2026-06-28):** `marked` ≠ markdown-it của VitePress ở 2 chỗ:
(1) **frontmatter** `--- … ---` → marked đọc nhầm thành setext `<h2>` (xấu); (2) **code fence** ra `<pre><code>`
trần → VitePress chỉ style code khi có wrapper `div[class*=language-]` nên nhìn như vỡ. Fix trong
`rich-diff.js` (pure, test được): `frontmatterToTables()` đổi mọi block YAML (top + mid, mọi dòng `key:
value`) → **bảng markdown** (đổi giá trị diff ngay trong bảng; `---` + list/prose thì KHÔNG đụng);
`styleCodeBlocks()` bọc `<pre><code class=language-X>` vào `<div class="language-X">` để CSS code của
VitePress áp (hộp + chữ `--vp-code-block-color`, hợp cả 2 theme) — **trừ** `language-mermaid` (để component
render diagram). Verify nội dung thật: prd frontmatter→table (hết setext-h2), design json wrapped, mermaid
vẫn là diagram, tag-balance 884/884. (Shiki color thì không có — chấp nhận trong diff.)

**Chẩn đoán "ko khác gì" (2026-06-28):** user không thấy đổi gì vì (1) dev server đang chạy chỉ
`--watch-path=bin`, **không reload `src/`** → runner chưa gửi `--with-content`; (2) project test
`claude-prism-v2.2.3-test-viewer` dùng engine **v2.2.3 chưa có `--with-content`** → runner fallback **âm
thầm** bỏ content → render phẳng. Fix: copy engine mới vào `.prism` của project test (diff = đúng phần
`--with-content`, an toàn) + **DiffBlock hiện cảnh báo** `.dvd-oldengine` khi thiếu content (hết im lặng).
Bài học: server-side (`src/`) cần restart/`dev:watch`; fallback phải **nhìn thấy được**.

### Diff UI/UX polish + jsdiff word-level (2026-06-27)
Diff hiển thị đẹp/rõ hơn cho tracking:
- **Word-level highlight** (jsdiff `diffWordsWithSpace`): chỉ tô **chữ thực sự đổi** trong dòng (không tô cả dòng).
- **Số dòng** (cũ | mới) + cột marker `+/-/space` (gutter kiểu GitHub).
- **Badge `+X −Y`** mỗi source + mỗi document; cả unified + side-by-side dùng renderer mới.
- `theme/components/diff-parse.js` (`parseDiff` → blocks có line-number + word segs; `diffStat`) — đặt
  TRONG theme/ vì theme symlink + `preserveSymlinks` làm import `../../src/...` không resolve được lúc build.
- Lib `diff` (jsdiff ^9) thêm vào deps (như mermaid/papaparse — Vite bundle vào runtime).
- **Không dùng diff2html**: đã có renderer riêng (master-detail + grouping + side-by-side) tốt hơn cho ngữ cảnh.
- Tests: `unit_diffParse` (98 assertions tổng) + build VitePress thật (bundle jsdiff OK) + live `/__prism-diff`.

### Fix re-point "unreachable → 404" (2026-06-27)
Bấm Open xong server "unreachable" rồi 404, refresh mới được. 2 nguyên nhân + fix:
1. **Unreachable**: `await viteServer.close()` không resolve (Vite close treo trên in-flight work; kể cả
   `closeAllConnections` cũng treo) → server mới không bind được. **Fix**: KHÔNG await Vite close — giải phóng
   port ngay bằng `httpServer.closeAllConnections()` + `httpServer.close()`, chạy `viteServer.close()` detached,
   rồi createServer+listen lại (retry nếu EADDRINUSE). Re-point ~1.2s, lặp nhiều lần OK.
2. **404 sau reload**: project chọn **không có `docs/index.md`** → `/` 404. **Fix**: `ensureHome()` tự sinh
   `index.md` tối thiểu (link tới Living Truth nếu composed) khi project thiếu → `/` luôn 200.
3. **Reload đúng lúc**: thêm token `/__docs-ready` (generation++ sau mỗi serve); FolderBrowser **poll tới khi
   gen tăng** rồi mới reload (thay vì delay cố định 1.3s) → hết race.
Verified live: re-point (kể cả project không index) → `/` 200, `/prism-living-truth` 200, gen tăng, lặp 3 lần OK.

## PlantUML + per-source diff (2026-06-27)

**PlantUML** (bật lại — trước bị bỏ vì "nặng"): render **online qua plantuml.com** (giống drawio).
`src/file-types.js` nhận `.puml/.plantuml/.iuml/.pu` → viewer `plantuml`; `theme/components/PlantUmlViewer.vue`
fetch nội dung → hex-encode (`~h`, không cần deflate) → `https://www.plantuml.com/plantuml/svg/~h<hex>` → `<img>`.
Cần mạng (gửi nội dung diagram lên plantuml.com). Đã verify qua smoke build thật.

**Per-source diff** ("ô checkbox show diff giống git diff, rõ sprint/draft nào"):
- Engine: `effective_truth.py --per-source-diff` — apply **tuần tự** từng source (proposal/change-pack delta,
  theo thứ tự sprint, tôn trọng `--up-to-sprint` + selection draft), mỗi source xuất **unified diff** (Python
  `difflib`) cho từng Living Truth doc nó đổi, kèm `{sprint, status, type, pack, path}`. Best-effort (draft
  không apply được thì bỏ qua). Approved-only ⇒ chỉ source APPROVED; `--with-drafts` ⇒ thêm DRAFT.
- Viewer: checkbox **"Show diffs (N sources)"** trên trang Living Truth → block ẩn (client-side toggle) liệt kê
  diff **nhóm theo sprint**, mỗi source gắn nhãn `[DRAFT]`/`[APPROVED]` + label + path, diff tô màu git-style
  (xanh `+` / đỏ `-` / `@@` brand). `perSourceDiff(state)` map state→flags như compose.
- Tests: engine (bash live) + viewer (fake-engine markup + **real-engine** diff render trong picker) — trong
  `prism-test.mjs` (80 assertions). Engine pytest cũ vẫn xanh (14 passed).

**File thêm:** `theme/components/PlantUmlViewer.vue`; sửa `src/file-types.js`, `src/stubs.js`, `theme/index.js`,
`src/prism-preview.js` (perSourceDiff + renderDiffSection), `prism/core/tools/effective_truth.py`
(`--per-source-diff`), `scripts/smoke-test.mjs` (+.puml fixture), `scripts/prism-test.mjs`.

## "0 sources" + cô lập runtime khỏi project (2026-06-27)

**"Show diffs (0 sources)" dù chọn sprint approved:** nguyên nhân = viewer gọi engine ở
`<project>/.prism/core/tools/effective_truth.py` (bản **đã cài trong project**), bản đó **chưa có**
`--per-source-diff` (flag mới phiên này) → argparse exit 2, stdout rỗng → `runJson` nuốt lỗi → 0.
Sửa: (a) `perSourceDiff` trả **null** khi engine lỗi (phân biệt với `[]` rỗng thật) → viewer hiện
**"⚠ Diff unavailable — cập nhật .prism/core (cần --per-source-diff)"**; (b) engine `per_source_diff`
**luôn liệt kê mọi source** kèm `note` (`no change…` / `could not apply…`) thay vì âm thầm bỏ. Khắc phục
phía user: cập nhật `.prism/core` của project (symlink sang workspace `prism/core` cho dev realtime, hoặc copy).

**`--per-source-diff` có phá code cũ?** KHÔNG — thuần thêm (hàm mới + 1 nhánh CLI chỉ chạy khi có flag).
Verified: **full prism pytest 751 passed, 1 skipped**.

**Runtime KHÔNG còn ghi vào thư mục project (cực kỳ quan trọng):** trước đây shadow runtime (gồm
`prism-merged`, `prism-living-truth.md`, bản compose…) nằm ở `<project>/.docs-view/` — tuy gitignore nhưng
vẫn nằm trong cây project → nhiễu context. Giờ `src/runtime.js runtimeRootFor` đặt runtime ở **OS temp dir**
(keyed theo project path), override bằng env `DOCS_VIEW_RUNTIME_DIR`. Verified: **docs/ + .prism/ byte-identical
trước/sau**; **dev tạo 0 file trong project**; runtime temp vẫn có nội dung mới nhất (symlink tuyệt đối tới
`./docs` + engine `--project-root`). `docs-dist/` (build output) vẫn cạnh project (deliverable, gitignored).
Tests: smoke set `DOCS_VIEW_RUNTIME_DIR` để giữ assertion in-project; suite xanh (80 + smoke + e2e + engine 751).

## Cross-platform (Windows) — copy thay symlink (2026-06-27)

`src/fs-link.js`: POSIX symlink (file + dir, live). **Windows**: **copy file** (symlink file cần quyền
Developer Mode/admin → tránh) + **junction** cho thư mục (`node_modules`/`theme` — không cần quyền, cùng ổ;
fallback dir-symlink rồi lỗi rõ ràng kèm hướng dẫn `DOCS_VIEW_RUNTIME_DIR` cùng ổ). `mirror.js`→`linkFile`,
`runtime.js`→`linkDir`. `DOCS_VIEW_COPY=1` ép copy-mode để test ở mọi OS.
- **Trade-off Windows**: file raw là snapshot → sửa file non-PRISM phải restart; PRISM Living Truth vẫn
  live (watcher recompose ghi file thật). Dev in cảnh báo khi copy-mode.
- Verified: copy-mode build thật (DOCS_VIEW_COPY=1) → dist đầy đủ, contentDir là **file thật (không symlink)**,
  content compose đúng, `./docs` untouched. Default symlink (mac) không đổi. Tests: 87 assertions + smoke + e2e.

## Folder picker interactive (2026-06-27)

Thay ô paste-path bằng chọn thư mục tương tác (user: "paste link mệt quá"). 2 cách:
1. **Nút "Browse with your OS"** → endpoint `/__docs-native` chạy folder-dialog NATIVE của máy local
   (dev server chạy local): macOS `osascript choose folder`, Windows PowerShell `FolderBrowserDialog`,
   Linux `zenity --file-selection --directory`. Lỗi/cancel/không có tool → fallback sang (2).
2. **Trình duyệt thư mục trong trang** (`theme/components/FolderBrowser.vue`) → endpoint `/__docs-list?dir=`
   liệt kê subfolder server-side (đa-OS, mọi browser, không cần File System Access API): bấm vào/ra (`..`),
   đánh dấu folder nào có `docs/`, nút **Open this folder**. + quick-links candidates + ô paste (fallback).
Chọn xong → `/__docs-pick` re-point như cũ.
- **Vì sao không dùng `showDirectoryPicker()` của browser:** nó chỉ cho JS đọc file client-side, KHÔNG
  trả path tuyệt đối cho server → không re-point được. Dev server local nên dialog/list **server-side** mới đúng.
- `folder-picker.js`: thêm `listDir`, `osFolderDialog`, gộp `registerPickEndpoints` (list/native/pick).
  `renderFolderPicker` giờ chỉ nhúng `<FolderBrowser />`. Component đăng ký ở `theme/index.js`.
- Verified: FolderBrowser.vue **compile** qua VitePress build; live: `/__docs-list` trả entries+candidates,
  navigate, `/__docs-pick` re-point OK. (`/__docs-native` chưa auto-test vì bật GUI thật — test tay.)
- **ASYNC (2026-06-27):** `osFolderDialog` đổi sang `execFile` (Promise) → **không block event-loop** khi
  dialog mở (server vẫn phục vụ request khác). Handler `/__docs-native` await async. Guard "1 dialog 1 lúc"
  + `windowsHide`. Test hook `DOCS_VIEW_NATIVE_DIR` (+`DOCS_VIEW_NATIVE_DELAY`) để test luồng native không cần GUI.
  Verified live: `/__docs-list` trả ở **56ms** trong khi `/__docs-native` (delay 600ms) còn pending → non-blocking ✅.
- Tests: 92 assertions + smoke + e2e — xanh.
