# Self-verify — 5 steps (MANDATORY)

> Because **PRISM does not verify on your behalf** for discover-code (it trusts the citation, it does not re-read the code). So discover-code **must self-verify** before emitting to the inbox.
> Run on the generated as-built, BEFORE handoff to PRISM.

---

## Check 1 — Traceability sweep (cheap, do first)
Review every **mechanism claim**:
- Has a `path:line`/symbol pointing straight to the proof? → keep `verified`.
- No citation but it can be inferred? → add a citation, or demote to `inferred`/`assumed`.
- No citation and cannot be inferred? → **delete or move to Open Question.** An unsourced claim = not a fact.

## Check 2 — Tool cross-check (deterministic, no human needed)
Re-run the extractor (Step 1 of the methodology) and **diff against the as-built**:
| As-built | Compared with | If it diverges |
|---|---|---|
| api-specs | router introspection / OpenAPI | **tool wins** → fix the doc |
| erd/schema | migrations / ORM / introspect DB | tool wins → fix |
| dependency boundaries | import/dependency graph | tool wins → fix |
| service/cross-repo edges | client call / config | tool wins → flag/fix |

## Check 3 — Adversarial refute (catch hallucination)
A **separate skeptical** pass (ideally: a different agent whose SOLE task is to *refute*):
> "Try to PROVE this claim WRONG using the code. If you cannot find supporting code within N lookups → mark it unsupported."
- Survives (has supporting code) → `verified`.
- Refuted (code contradicts) → fix; the code wins.
- Unsupported (no two-way code) → demote to `inferred`/`assumed` or Open Question.
- **Sensitive** claim (auth/money/data deletion/transaction) → run multiple refuters, take the majority.

## Check 4 — Intent-boundary audit (block "wrong intent")
Scan for the most dangerous error: **intent recorded as fact**.
- Any sentence about *why / should / goal / business rule* that is tagged `verified` or has only a code-citation → **wrong label**. Code proves the mechanism, it does not prove the intent. Change to `assumed` (if a person/doc says so) or Open Question.
- `assumed` intent that no one has confirmed yet → flag it to ask, do not let it drift as if settled.

## Check 5 — Confidence recompute + honesty + observed≠correct
- Recompute the confidence labels to match Check 1–4.
- Any item that *looks* solid but rests on `inferred`/`assumed` → add a visible caveat.
- **Suspected defect:** observed behavior that is suspected-wrong/abnormal → record `suspected defect` + Open Question, **not** an AC.
- Reconcile against the coverage ledger (methodology Step 7): is the doc honest about the scope it covered?

---

## Verify report (attach to output)
```
Verify — <area>
- Claims: N | verified A | demoted B | refuted&fixed C | →Open Q D
- Tool cross-check: api ✓ | erd ✓(2 fix) | dep ✓ | edges ⚠1
- Intent-as-fact fixed: E | Suspected defects flagged: F
- Coverage ledger: <#documented>/<#census> | deferred: <list+reason>
```

### Exit criteria
- [ ] Every `verified` has a citation that resolves; non-citation ones have been demoted/removed.
- [ ] Tool cross-check ran; every divergence resolved as "tool wins".
- [ ] Adversarial pass done; refuted ones fixed, unsupported ones demoted.
- [ ] No intent is labeled code-verified.
- [ ] Suspected defect has been flagged (not turned into an AC).
- [ ] Coverage ledger closed; uncovered parts state their reason clearly.
