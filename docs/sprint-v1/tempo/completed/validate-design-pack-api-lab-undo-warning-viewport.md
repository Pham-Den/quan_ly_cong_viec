---
status: APPROVED
command: validate design
cycle: pack-api-lab-undo-warning-viewport
sprint: 1
change_pack: v1.7.18-api-lab-undo-warning-viewport
timestamp_utc: 2026-07-18T06:46:58Z
latest_conclusion: clean
approved_by: khanh-pham
approved_at: 2026-07-18T06:52:37Z
---

# Validate Design — pack-api-lab-undo-warning-viewport

## 1. Target

- **Command:** `validate design` through `validate changes v1.7.18-api-lab-undo-warning-viewport`
- **Target:** current Design DRAFT after absorbing the selected Product delta.
- **Design absorption aggregate fingerprint:** `sha256:a70686a1b255b6d19673b75d50ac6b06174250bcd35265016eecebe2df8af0b7`
- **Pack aggregate fingerprint:** `sha256:393cb0120a311dac3eaa997a430a53b70685227d0b51de99b94c00656322e691`
- **Key source fingerprints:** Design proposal `9c8324bb6b37`; Design entry point `f0f19642ac6b`; Product delta `db948482154c`; change request `d7988585646b`; impact matrix `a1fb09c22d24`.
- **Conduct:** A fresh-context reviewer re-derived Product/Design expectations and impacted phases before reading the pack matrix, then independently searched every applicable fail signal (`VAL-3`). The primary run repeated deterministic, effective-truth and semantic checks.

### Expectation sources (`VAL-3`)

- `.prism/core/phase-quality-standards.md`
- `.prism/core/phase-design.md`
- `.prism/core/change-propagation.md`
- `.prism/core/change-manager.md`
- `.prism/core/templates/proposal-template.md`
- `.prism/core/templates/design-template.md`
- approved sprint-v1 Product split proposals + selected Product delta
- current Design proposal and Design entry point

### Independent impact re-derivation

The Product FR/AC/lifecycle changes require Design flow, state, exact-copy, validation, responsive and accessibility absorption. Design is the current DRAFT downstream artifact. Architecture and later phases have not started, so Design is the propagation endpoint. This matches the pack matrix.

## 2. Structural Coverage (`DOC-3`)

| Required Design area | Result | Evidence |
|---|---|---|
| Proposal/frontmatter | Pass | Deterministic proposal validator passed |
| Principles and resolvable source | Pass | Product/pack references and repository CSS/component/System Manager sources are linked |
| Screen inventory and flows | Pass | 8 screens, 13 flows and all Must FRs are traced |
| Four states per screen | Pass | SCREEN-001–008 each define Empty/Loading/Populated/Error with identifier, visible signal and exit |
| Exact message copy | Pass | MSG-022/025/029/036–040 cover unsupported device, Undo, confirmation and all three warning categories |
| Form and submit validation | Pass | Field rules and per-form Loading/Success/client/server behavior are defined |
| Design-to-FR/US traceability | Pass | All 12 Must FRs are present; SCREEN-006 consistently carries FR-003/FR-011 and US-009 |
| Components/tokens | Pass | DS-COMP-001–010 and semantic token aliases are defined |
| Responsive/platform | Pass | Physical screen gate is distinct from zoom-reduced viewport; compact/scroll behavior through 200% is explicit |
| Accessibility | Pass | WCAG target, keyboard/focus rules, Undo live countdown and stable hooks are explicit |
| Open questions/risks | Pass | No unresolved Design blocker or Product `PENDING` marker remains |

## 3. Rule Coverage (`VAL-1`)

| Rule ID | Result | Evidence |
|---|---|---|
| `DOC-1` | Pass | Numbered overview and stable anchored screen/component catalogs |
| `DOC-2` | Pass | DESIGN-OVERVIEW/SCREEN/DS-COMP/MSG/UX-FLOW identifiers are stable |
| `DOC-3` | Pass | Every required Design template area is present or explicitly scoped |
| `LINK-1` | Pass | Product, pack, repository source and FR/US/screen/component links are concrete |
| `LINK-2` | Pass | Dependencies, validators, downstream impact and change triggers are explicit |
| `ORB-1` | Pass | Sprint, approved Product base and selected proposed truth are linked |
| `ORB-2` | Pass | Pack-cycle source is explicit in the proposal and Design entry point |
| `SEM-1` | Pass | No contradiction, duplicate intent, stale assumption, terminology drift or out-of-scope UI behavior found |
| `DES-1` | Pass | Every Must FR has flow, four states, exact copy, validation behavior and FR/US mapping |
| `DES-2` | Pass | States and added behaviors have stable hooks/labels, visible signals and exit conditions |
| `VAL-3` | Pass | Fresh reviewer independently re-read sources, re-derived expectations and graded fail signals |

## 4. Semantic Integrity (`SEM-1`)

| Area | Evidence | Result |
|---|---|---|
| Undo | Same-identity restore, 10-second window, late/failed restore and no auto-enable align with AC-046–048/052 | Pass |
| Warning gate | Exactly three Cảnh báo categories, all other invalid states as Lỗi, and Run/Bật confirmation align with AC-049–059 | Pass |
| Responsive/zoom | `screen width >= 1280px` support gate and compact editing through 200% zoom are non-contradictory | Pass |
| Terminology/copy | Visible labels use Đạt/Cảnh báo/Lỗi and Rà soát/Kiểm tra/Bật workflow consistently | Pass |
| Trace ownership | SCREEN-006 inventory, block and trace table all include FR-003/FR-011 and US-009 | Pass |
| Duplicate/out-of-scope intent | No duplicated SCREEN/DS-COMP intent or unrelated pack behavior found | Pass |

## 5. Findings

No blocker, warning or informational finding.

## 6. Deterministic Evidence

- Design proposal validation: no findings.
- Product delta proposal validation: no findings.
- Pack structure check: OK.
- Same-sprint collision check: none.
- Candidate Design effective-truth validation with `--candidate-phase design --candidate-pack ...`: passed.
- `git diff --check`: passed.

## 7. Conclusion

- **blocker:** 0
- **warn:** 0
- **info:** 0
- **latest conclusion:** `clean`
- **Approval readiness:** Design absorption is clean for this pack cycle.
