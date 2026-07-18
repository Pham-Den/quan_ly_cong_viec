# Project Folder Convention

Each skill has a "Save file to:" section specifying the output path. If the project has `output_paths` defined in `qa-config.yaml`, use that path instead of the default.

## Output root (mandatory recommendation)

All testing output must reside under a single root folder:
- `testing-output/`

Default structure:
- `testing-output/test-plan/`
- `testing-output/test-cases/hltc/`
- `testing-output/test-cases/functional/`
- `testing-output/test-cases/sit/`
- `testing-output/test-data/`
- `testing-output/automation/`
- `testing-output/demo/`
- `testing-output/reports/` (daily/sprint/html/security/performance/accessibility)

## Naming convention

- `{Project}` = `project.code` from qa-config (e.g. `EW`, `PROJ`)
- `{Sprint}` = `project.sprint` from qa-config (e.g. `Sprint-12`)
- `{module}` = module name in lowercase with hyphens (e.g. `checkout`, `user-profile`)
- `{run-id}` = Run ID from Skill 07 (e.g. `15-04-2024-R1`)

## Global artifact traceability (mandatory)

Every artifact created per execution or per data generation run must include all 3 components:
- **Version** of the artifact (SemVer format `v{major.minor.patch}`)
- **Timestamp** of creation (`{yyyy-mm-dd}_{HHmm}`)
- **Result status** of the creation/run (`SUCCESS|PARTIAL|FAILED|BLOCKED`)

Do not overwrite old files with a "latest" approach. Each run must create a new record to maintain a traceable history.

## Standard file naming by artifact type

- High-level test design (Markdown outline, Mermaid optional): `hltc-{module}-{sprint}-v{semver}-{yyyy-mm-dd}_{HHmm}.md` → saved in `testing-output/test-cases/hltc/`
- Functional TC: `tc-functional-{module}-{sprint}-v{semver}-{yyyy-mm-dd}_{HHmm}.tsv` → saved in `testing-output/test-cases/functional/`
- SIT TC: `tc-sit-{module}-{sprint}-v{semver}-{yyyy-mm-dd}_{HHmm}.tsv` → saved in `testing-output/test-cases/sit/`
- Test data master: `master-dataset-{sprint}-v{semver}-{yyyy-mm-dd}_{HHmm}.tsv`
- Data teardown script: `teardown-{sprint}-v{semver}-{yyyy-mm-dd}_{HHmm}.sql`
- Automation script pack: `automation-pack-{module}-{sprint}-v{semver}-{yyyy-mm-dd}_{HHmm}.zip` (or a folder with the same name)
- Daily report: `daily-report-{yyyy-mm-dd}_{HHmm}-R{N}-v{semver}.md|html`
- Sprint report: `sprint-report-{sprint}-{yyyy-mm-dd}_{HHmm}-v{semver}.md|html`

## Result manifest required for each creation/run

Each artifact creation or test run must be accompanied by 1 result manifest file in the same output group.

### 1) Data generation manifest

File name:
- `data-generation-result-{yyyy-mm-dd}_{HHmm}-R{N}.yaml`

Minimum schema:
```yaml
run_id: <dd/mm/yyyy-RN>
artifact_type: test_data_generation
artifact_version: v<major.minor.patch>
timestamp: <yyyy-mm-dd_HHmm>
result: <SUCCESS|PARTIAL|FAILED|BLOCKED>
source_inputs:
	- <tc-file-path>
output_files:
	- <testing-output/test-data/master-dataset-...>
	- <testing-output/test-data/teardown-...>
summary:
	total_tc: <N>
	covered_tc: <N>
	uncovered_tc: <N>
notes: <optional>
```

### 2) Test run manifest

File name:
- `run-result-{yyyy-mm-dd}_{HHmm}-R{N}.yaml`

Minimum schema:
```yaml
run_id: <dd/mm/yyyy-RN>
run_type: <Full|Re-run|Smoke>
artifact_version: v<major.minor.patch>
timestamp: <yyyy-mm-dd_HHmm>
result: <SUCCESS|PARTIAL|FAILED|BLOCKED>
metrics:
	pass: <N>
	fail: <N>
	blocked: <N>
	not_run: <N>
	pass_rate: <N>
bug_summary:
	s1_open: <N>
	s2_open: <N>
report_files:
	- <testing-output/reports/daily/daily-report-...>
```

`result` convention:
- `SUCCESS`: the main objective of the run/data generation was achieved, no blockers
- `PARTIAL`: output exists but there are gaps or concerns that need further attention
- `FAILED`: run did not complete due to technical or quality issues
- `BLOCKED`: could not proceed due to dependency/environment/missing input issues

## Report convention (mandatory for skill 09/10 (check-result / test-report))

- Use the shared folder `output_paths.reports.root` (fallback: `testing-output/reports/`)
- Do not use generic file names like `test-report.md`
- Report file names must include a timestamp `{yyyy-mm-dd}_{HHmm}`
- Export at minimum 2 formats: Markdown + (HTML or DOCX)
