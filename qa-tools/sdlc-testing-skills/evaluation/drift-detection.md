# AI Drift Detection Guide

Guide for detecting and handling situations where the AI starts producing lower-quality output over time (model drift, prompt drift, context drift).

---

## Why does drift happen?

1. **Model update**: The AI model is updated and its behavior changes
2. **Context accumulation**: A long session causes the AI to gradually "forget" early instructions
3. **Skill file stale**: Skill files are not updated when processes change
4. **Shortcut learning**: The AI learns that users accept shorter output and progressively produces shorter responses
5. **Routing failure**: The AI routes to the wrong skill and uses heuristics instead of reading the skill file

---

## Signals to monitor every sprint

### Signal 1 — Output length drift
```
Baseline: Sprint 1, skill 09-check-result output averaged 800 lines
Alert: Sprint 5, output averages 400 lines (-50%)
```
How to check: Compare file sizes of daily-reports across sprints.

### Signal 2 — Missing sections
```
Sprint 1: Every daily report has an improvement_snapshot YAML block
Sprint 4: 3/10 reports are missing improvement_snapshot
```
How to check: `grep -l "improvement_snapshot" testing-output/reports/daily/`

### Signal 3 — Format regression
```
Sprint 1: TSV has all 16 columns, traces correctly to Rule ID
Sprint 6: TC file only has 10 columns, trace field is empty
```
How to check: Count header columns in TSV files, grep the trace field.

### Signal 4 — Gate bypass
```
Sprint 1: go-no-go report always includes a sign-off request
Sprint 7: AI sometimes concludes DONE on its own without emitting a sign-off request
```
How to check: `grep "APPROVAL REQUIRED" testing-output/reports/gate/*.md`

### Signal 5 — Routing accuracy
```
Sprint 1: User says "daily report" → AI runs skill 09
Sprint 5: User says "daily report" → AI generates its own format without reading skill 09
```
How to check: Review audit-log, verify that skill names match the intent.

---

## Drift detection protocol (run at end of each sprint)

```markdown
### Sprint Drift Check — {Sprint-N}

**1. Sample 3 random outputs from the sprint:**
- [path/output-1]
- [path/output-2]
- [path/output-3]

**2. Score according to evaluation/skill-quality-rubric.md**
Avg score: [N]/10

**3. Compare with previous sprint:**
- Sprint N-1 avg: [N]/10
- Delta: [+/-N]

**4. Check specific signals:**
- [ ] Output length within ±20% of baseline
- [ ] improvement_snapshot present in 100% of daily reports
- [ ] TSV files have all 16 columns
- [ ] Sign-off requests present in L2/L3 skills
- [ ] Audit log entries are complete

**5. Conclusion:**
- ✅ No drift detected
- ⚠️ Minor drift — monitor
- ❌ Drift detected — action required
```

---

## Actions when drift is detected

### Minor drift (score drops 1–1.5 points):
1. Re-read the skill file and check if any section is unclear
2. Add explicit examples to the skill file for the drifting section
3. Re-test with the same input and compare output

### Major drift (score drops >1.5 points or signals 4/5):
1. Start a new conversation (clear context)
2. Explicitly re-read CLAUDE.md / AGENTS.md
3. Re-run the skill with the instruction: "Read [skill-file] carefully before responding"
4. If drift persists → review and rewrite the skill file

### Structural drift (AI not following routing):
1. Verify the SKILL.md routing table is still correct
2. Verify AGENTS.md / copilot-instructions.md still matches the routing table
3. Check if new keywords need to be added to routing

---

## Baseline metrics (set on first deployment)

```yaml
# Save this file after the first successful sprint
baseline:
  sprint: "Sprint-1"
  date: "{yyyy-mm-dd}"
  skills_evaluated:
    - skill: "09-check-result"
      avg_output_lines: 280
      avg_score: 9.0
      sections_present: ["improvement_snapshot", "sprint_snapshot", "health_score"]
    - skill: "05-gen-tc-functional"
      avg_output_lines: 120
      avg_score: 8.5
      tc_columns: 16
    - skill: "13-go-no-go"
      avg_output_lines: 80
      avg_score: 9.0
      sign_off_emitted: true
  alert_thresholds:
    score_drop_minor: 1.0
    score_drop_major: 1.5
    output_length_drop_pct: 20
```

Save this file at: `evaluation/baseline.yaml`
