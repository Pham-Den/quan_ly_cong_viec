# Confidence & citation scheme

The label set used on **every** as-built item — so that a later person/agent knows *how far to trust* and *where it came from*.

## Confidence labels
| Label | Meaning | Allowed for | Condition |
|---|---|---|---|
| `verified` | cross-checked against code this time, correct | **mechanism (WHAT)** only | has a `path:line` citation that resolves |
| `inferred` | derived from code, plausible but not directly proven | mechanism | state clearly *what was checked / what was not checked* |
| `assumed` | a person/old-doc says so; not yet cross-checked against code | **intent (WHY)** or not-yet-verified mechanism | record the source (who / which doc) |
| `unknown` | a gap | any | has a row in the Skip Register |

Hard rules:
- **WHY is never `verified`.** The highest is `assumed` until the owner confirms.
- `verified` **without** a citation → invalid, downgrade it.
- Better to have few truly `verified` than many optimistic `verified`.

## How to tag
- **Claim-level:** `- [verified] Send email on order.completed — notif/email.py:30`
- **Section-level (rollup):** `### Billing  <!-- confidence: verified (structure), assumed (SLA) -->`
- **Suspected defect:** `- [observed] X happens — a.py:12  ⚠ suspected defect: <why suspected> → Open Question`

## Citation
- Point: `path/to/file.ext:line` · Range: `:48-71` · Symbol when line is volatile: `InvoiceController.create`
- Multi-repo: keep the repo prefix — `billing/src/...`
- Cluster: block `> Evidence: routes …:48,71 · schema …/Invoice.java:12`

## ID — discover-code does NOT assign them
- **Do not assign an ID/slug** to a new item. Parent-child relationships are expressed through **structure** (nested in the inbox doc); `import` assigns the real ID (`FR-002`…) via `get_next_id`.
- Exception, use a real ID right away: code already has a **marker-ID** (a project once built by PRISM) → reuse it verbatim; an item **already in LT** → use the real ID directly (read-only read).

## Inline assumption (keep the PRISM convention)
```
> Assumption: retry idempotent via `idempotency_key` — saw the header set (StripeClient.java:90); have not verified server-side dedup.
```

## "as-of" mark
Every artifact/Map records the commit it was cross-checked against:
```
<!-- as-built verified against: <repo>@<commit-sha> on <YYYY-MM-DD> -->
```
→ this is exactly the Map's `scanned_at_commit`; it is the baseline for the drift-check (`git diff <commit>..HEAD`). Code changed after this baseline → a `verified` claim may already be stale.

## Inline open-question marker (spec-kit) + the "0 new markers at handoff" gate
Where something is unclear → plant it **right at the item** instead of only leaving it in the Skip Register:
```
**AC** ... [NEEDS CLARIFICATION: KPI baseline? — not in code/ticket]
```
- The marker sits *right at the FR/AC* where it is ambiguous (more visible than a separate ledger); the Skip Register is an *index* of the markers.
- **Gate:** do not hand off to PRISM while the as-built still has a `[NEEDS CLARIFICATION]` that is **neither resolved nor recorded as a Skip Register row** (`type: intent`/`unknown`). Recording it in the Skip Register **satisfies** the gate — discover-code does not (cannot) create PRISM Open Questions; PRISM `import` routes those rows into the PRD §10b Open Risks / §11 deferred Open Questions (`core/import-validator.md § Reflect Mode → Deferred intent`). The bar is "no *untracked* marker remains", not "no marker remains".
