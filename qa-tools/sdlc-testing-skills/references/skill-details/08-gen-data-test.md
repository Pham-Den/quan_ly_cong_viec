# Detailed Procedure: 08-gen-data-test

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## ⚑ Pre-DONE Checklist

- [ ] Every TC has data or N/A with a clear reason
- [ ] No orphan data rows (TC_ID does not exist in the input TC list)
- [ ] Teardown script/SQL provided for every TC that creates/modifies/deletes data
- [ ] Append execution record to `governance/audit-log.md`
- [ ] Update `project/session-state.yaml` → `last_execution`, `notes`

---

# Skill 05 — Gen Data Test

## Inputs

| Information | Required |
|---|---|
| TC list (from skill 05/06 or existing file) | ✅ |
| Description of data fields (type, constraint, format) | ✅ |
| Environment information (DB type, API endpoint) | Recommended |
| PII / data sensitivity requirements | Recommended |
| Test Plan (`testing-output/test-plan/Test_Plan_*.md`) | Optional — read if file exists |

> **If a Test Plan exists**, the following sections must be read before generating data:
>
> - **Section 3b — Test data generation strategy**: get golden dataset information, types of data to generate (BVA/EP/normalize/threshold), generation tools, teardown approach, and traceability
> - **Section 3a — Mutation strategy** (if available): get the approach for mutating from a golden dataset rather than creating data from scratch
>
> **Applied rules:**
> - If the test plan defines a golden dataset → use it as the base, do not regenerate from scratch
> - If the test plan defines a mutation strategy → apply it when generating BVA/EP: mutate 1 criterion at a time from the golden dataset
> - If the test plan defines the teardown approach → follow it rather than the default DELETE/UPDATE
> - If the test plan contradicts the skill's default data generation principles → **the test plan wins**, clearly note this in the output
> - If the test plan does not address a specific data type → use the skill's default principles

## Data Generation Strategy — Source Priority Order

Skill 05 determines the data generation strategy in the following priority order:

**Priority 1 — Test Plan with Section 3b:**
If a Test Plan file exists **and** Section 3b has specific data strategy content → follow it completely (golden dataset, mutation strategy, teardown approach). Do not reinvent.

**Priority 2 — Fallback when no Test Plan or Section 3b is empty:**
The primary source is the **Functional TC file (skill 05 — gen-tc-functional)**. Process:
1. Read the entire TC list from the functional TSV file
2. For each TC: analyze the `Test Data`, `Precondition`, `Step summary`, `Expected result` columns to determine what data needs to be generated
3. Supplement with domain rules from `qa-config.yaml` (`project.domain`) to apply appropriate constraints
4. Supplement with information from requirements/AC if the TC does not have enough detail about constraints

> **Mandatory mapping rules:**
> - Each TC must have at least 1 data row in the Master dataset (unless `N/A` with a reason is written in the TC Coverage Map)
> - 1 TC may have multiple data rows if the scenario requires multiple variants (BVA sub-values, EP partitions, normalize variants)
> - Every data row must have a corresponding `TC_ID` — no orphan data rows that do not map to any TC
> - The number of data rows depends on scenario content: TC is specific → 1 row; TC is generic → generate enough variants needed to cover the scenario

## Config (optional — read only if needed to apply domain rules)

> **Source priority order:** Test Plan (Section 3b/3a) > Functional TC file > qa-config.yaml > skill's default principles.

If `qa-config.yaml` exists and the user has not provided sufficient domain/environment context, read only:

| Field | Used for |
|---|---|
| `project.domain` | Choose domain-specific rules (Luhn for fintech, TEST_ prefix for ecommerce, synthetic for healthcare) |
| `environments.staging.url` | URL in teardown script if API reset calls are needed |
| `security.focus` | Identify sensitive data fields that require PII-safe generation |

## Data Generation Principles

- **Absolutely specific** — do not use `[valid data]`, `[valid name]`
- **PII-safe** — use synthetic data, do not use real production data
- **BVA** — generate all of: min, max, min−1, max+1 for every numeric/date/string field with limits
- **EP** — at least 1 representative value per valid and invalid partition
- **Realistic** — data must look real (person names, phone numbers, properly formatted emails)
- **Independent** — each test data set must be self-resettable, with no dependency on TC execution order

## Output format — 1 TSV file only

**Basic rule:** 1 row = 1 complete dataset. 1 TC may have multiple rows if multiple variants are needed (BVA sub-values, EP partitions, Data-Driven scenarios).

Header:
```tsv
TC_ID	Dataset_ID	Test_Data	Loại	Teardown	Ghi chú
```

Column descriptions:
- `TC_ID`: corresponding TC code (`TC-001`, `TC-002`…)
- `Dataset_ID`: dataset row code, numbered globally or per TC (`DS-001`, `DS-002`…)
- `Test_Data`: all field=value pairs for the dataset on 1 row, using `; ` as the separator between fields (e.g.: `FIELD_A=value1; FIELD_B=value2; FIELD_C=(empty)`). Do not split into multiple rows.
- `Loại`: `BVA-min` / `BVA-max` / `BVA-min-1` / `BVA-max+1` / `EP-valid` / `EP-invalid` / `Corner` / `Normal` — write the most characteristic type for the entire dataset
- `Teardown`: SQL statement or API call to reset data after the TC; write `—` if the TC does not create/modify/delete data
- `Ghi chú`: describe the scenario, the mutated field (if negative/BVA), expected engine behavior

**Save file to:** `output_paths.test_data` from qa-config (default: `testing-output/test-data/`)
→ `testing-output/test-data/data-{module}-{project.sprint}.tsv`

## Internal coverage verification step (mandatory before saving, not included in output)

Before saving the TSV, verify internally:
- Every `TC_ID` in the input list must have at least 1 row in the TSV
- TCs that do not require fixed data (Exploratory, independent Smoke, static UI) → write `N/A` + reason in the `Ghi chú` column of a representative row
- No TC is missing data without a reason → if still missing, add it before saving
- No orphan data rows — every row must have a valid `TC_ID` that references a TC in the input list

## Domain-specific notes

- **Fintech**: generate account numbers, card numbers using the Luhn algorithm; do not use real numbers
- **Ecommerce**: generate SKUs, order codes with a TEST_ prefix for easy cleanup
- **Healthcare**: data must comply with HIPAA if the context references it — use fully synthetic data

## Completion Status

- **DONE** — Single TSV file with data for all TCs; every TC has data or N/A with a reason; Teardown column complete for all TCs that create/modify/delete data
- **DONE_WITH_CONCERNS** — TSV saved but some TCs are missing data due to missing constraints (BA/Dev needs to provide them) or Teardown does not cover partial rollback
- **BLOCKED** — Cannot generate because: {No TC list / Field constraints unclear / DB schema missing}
- **NEEDS_CONTEXT** — Needs to be added: {TC list / Field descriptions (type, min, max, format) / DB type for generating teardown SQL}
