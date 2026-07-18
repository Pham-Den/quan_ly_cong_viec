# TC Self-review Checklist (C01–C11)
# Single source of truth — referenced by Skill 05 Step 7 (fix) and Skill 07 Step 4 (flag).
# Skill 05: fix every failing criterion immediately. Skill 07: report TC-XXX: [C-nn] per failure.

| # | Criterion | Skill 05 — fix | Skill 07 — flag |
|---|---|---|---|
| C01 | Priority=`High`/`Medium`/`Low` only; Priority=`High` → Smoke=`Y`; if Smoke=`N` → add `HighPriority-NoSmoke: <reason>` in Trace | Fix Priority format or Smoke value; add reason if keeping N | TC-XXX: Priority wrong format or High+Smoke=N without reason |
| C02 | Auto ≥80% of file; every `Auto=N` has a reason in Trace column | Set Auto=Y if assertable; if keeping N, add reason | TC-XXX: Auto=N with no reason; or file <80% Auto=Y |
| C03 | Expected result specific (HTTP code, field value, entity state) — no vague phrases: "hoạt động đúng", "thành công", "works correctly"; Test Data has no placeholders: `[dữ liệu hợp lệ]`, `[any value]`, `...` | Rewrite Expected result; fill specific Test Data values | TC-XXX: Expected result vague; TC-XXX: Test Data has placeholder |
| C04 | Trace not empty and maps to a Rule ID in Rule Inventory; BR/AC ID in Summary and Trace must exist in input requirements — no self-assigned IDs | Add Trace or fix incorrect ID; use descriptive label e.g. `[OnboardingFlow]` if no ID exists | TC-XXX: Trace empty or non-existent Rule ID |
| C05 | Component not empty, format `{ProjectAbbr}-{FeatureFolder}`; Precondition not empty — write `None` if no precondition | Fill Component from qa-config module; add `None` to Precondition | TC-XXX: Component empty/wrong format; TC-XXX: Precondition empty |
| C06 | Summary ≥10 characters and clearly describes action + object | Rewrite with sufficient meaning | TC-XXX: Summary too short or unclear |
| C07 | Type semantic correct: `Neg`=wrong data; `Auth`=correct data+wrong permission; `State`=entity lifecycle; `Corner`=boundary/edge — see `references/tc-type-taxonomy.md` | Fix Type to match true nature | TC-XXX: Type semantically wrong — state what it should be |
| C08 | ET rows present at end of file; STT sequential from last scripted TC; Test Type=`Exploratory`; Auto=`N`; all 6 SFDPOT dimensions explored; 1 row per identified risk area; no count target | Add ET rows if missing; document which SFDPOT dimensions were explored | File missing ET rows, wrong ET STT, or SFDPOT dimensions not documented |
| C09 | Technique column (16) has valid value from taxonomy — use `—` if no special technique; must not be blank | Fill `—` or correct technique; see `references/tc-type-taxonomy.md` | TC-XXX: Technique empty or invalid |
| C10 | Each row has exactly 16 tab-separated columns; no duplicate Summary values | Fix missing/merged columns; append `[variant-N]` to duplicate or merge into DataDriven | TC-XXX: wrong column count; TC-XXX: duplicate Summary |
| C11 | TC order: within each AC: Happy → Neg → Auth → State → Corner; then Impact/E2E → Security/Perf/Reliability → Regression → Exploratory last | Reorder before saving | (advisory only — note if order deviates) |
| C12 | *(File-level)* Implicit scanning inventory complete: all 10 categories from Step 1 were applied to this spec — each category has ≥1 `[Implicit-X]` Rule ID in inventory table, or an explicit `N/A + reason` entry. Missing category scan = incomplete Rule Inventory regardless of TC count. | Revisit Step 1; add missing `[Implicit-X]` Rule IDs or `N/A + reason` for each unscanned category | File: implicit inventory incomplete — list which of the 10 categories have no Rule ID and no N/A entry |
