# CHANGELOG — QA Skill Suite v2.2.0

**Release date:** 2026-06-24
**Previous version:** v2.1.0
**Type:** Minor — backward-compatible enhancements to performance testing skill

---

## Summary of changes

| # | Changed file | Type | Short description |
|---|---|---|---|
| 1 | `references/performance-baseline.md` | Enhancement | Added Four Golden Signals framework, Workload Model (open/closed), Warm-Up Period, Think Time, Scalability Test, Ramp-Down, k6 tool, Environment Parity Checklist, CI/CD Regression Gate |
| 2 | `references/skill-details/02-performance-testing.md` | Enhancement | Added Step 0 (env parity), workload model selection, Scalability Test config, warm-up exclusion, MTTR tracking, Four Golden Signals analysis, CI/CD gate note; upgraded Listeners to Aggregate Report |
| 3 | `skills/qa-specialist/02-performance-testing/performance-testing.md` | Enhancement | Expanded Core Workflow to 7 steps covering env parity, workload model, warm-up, Four Golden Signals; added k6 to tool list; added performance-testing-guideline.md reference |
| 4 | `references/performance-testing-guideline.md` | New | Human-facing writing guideline for QA engineers: when to test, how to write scenarios, open/closed model, scoping rules, SLA determination, DoD checklist, env parity checklist, common mistakes |
| 5 | `references/INDEX.md` | Update | Added `performance-testing-guideline.md` to Performance testing row |

---

## Detailed changes

---

### 1. performance-baseline.md — Major enhancement

**Reason for update:**
The v2.1.0 baseline file lacked coverage of five key areas from ISTQB CTAL-PT, Google SRE, and k6/Gatling industry standards: warm-up handling, workload model selection (coordinated omission risk), Four Golden Signals as a metrics framework, environment parity validation, and CI/CD integration. Test durations and Spike Test phasing were also shorter than production-realistic values.

**Changes:**

| Section added / updated | Detail |
|---|---|
| **Four Golden Signals** (new) | Google SRE framework: Latency / Traffic / Errors / Saturation as primary collection structure. Note on measuring failed-request latency separately. |
| **Workload Model — Closed vs Open** (new) | Explains coordinated omission risk of closed model; when to use k6 `constant-arrival-rate` or Artillery `arrivalRate` for open model. |
| **Warm-Up Period** (new) | JVM warm-up exclusion: ramp-up + first 3 min of steady state excluded from reported results. JMeter Flexible File Writer technique. |
| **Think Time** (new) | Recommended values by scenario (API: 0–500ms, UI flow: 1–3s, complex journey: 3–8s) with JMeter element mapping. |
| **Scalability Test** (new) | New test type: baseline run + scale steps, ≥80% proportional throughput increase as pass criterion. |
| **Ramp-Down** (new) | Explicit ramp-down phase; recovery time SLA (MTTR ≤ 2 min). |
| **Recovery time (MTTR)** (new metric) | Added to Metrics to Measure table with warning threshold > 2 minutes. |
| **Load Test duration** | Updated: 600s (10 min) → 3600s (60 min). |
| **Load Test ramp-up** | Updated: fixed 120s → dynamic `CONCURRENT_USERS × 0.75`s. |
| **Stress Test phases** | Updated: 5 min/phase → 10 min × 3 phases + 30 min final sustain. |
| **Spike Test phases** | Updated: 3 phases → 4 phases (added medium baseline before spike); recovery window explicit. |
| **Soak Test duration** | Updated: 4 hours → 8–12 hours. Metrics snapshot every 30 min. |
| **Recommended Tools** | Added **k6** (CI-native, open model, InfluxDB/Prometheus output). |
| **JMeter Listeners** | Changed primary listener: Summary Report → **Aggregate Report** (provides P90/P95/P99 per endpoint without plugins). Added Required Listeners table. |
| **JMeter CLI command** | Added `-JRAMP_UP` parameter; updated `-JDURATION=3600`. |
| **Environment Parity Checklist** (new) | 10-item checklist: CPU, RAM, replicas, DB version, connection pool, Redis, network latency, TLS, monitoring agents, test data volume. |
| **CI/CD Performance Regression Gate** (new) | k6 `constant-arrival-rate` example with inline thresholds; JMeter non-GUI + Python parser gate. Frequency guidance. |

---

### 2. skill-details/02-performance-testing.md — Enhancement

**Reason for update:**
Aligned detailed procedure with new baseline content. Added env parity as a pre-test gate, workload model selection guidance, updated all thread group configs, replaced Summary Report with Aggregate Report, added warm-up exclusion and MTTR tracking, extended bottleneck analysis table with Two Golden Signals symptoms.

**Changes:**
- Added **Step 0 — Verify environment parity** before any test configuration
- Added **workload model selection** sub-section in Step 2
- Added **Scalability Test** Thread Group config
- Updated all thread group durations and ramp-up to match new baseline
- **Spike Test**: updated from 3 phases to 4 phases
- **Soak Test**: 4h → 8–12h
- Step 3: added Think Time configuration note; replaced Summary Report → **Aggregate Report**
- Step 4: added JMeter non-GUI command; added warm-up exclusion note; added MTTR monitoring for Spike/Stress
- Step 5: added Four Golden Signals analysis framing; added 2 new bottleneck rows (scaling, MTTR)
- Output report: added Workload model, Warm-up excluded, Environment delta, Recovery time (MTTR) fields
- Added **CI/CD Integration Note** section
- Pre-DONE checklist: added env parity and MTTR items; added scalability to test type list

---

### 3. performance-testing.md (compact card) — Enhancement

**Reason for update:**
Compact card workflow (5 steps) did not reflect new capabilities: env parity, workload model, warm-up, Four Golden Signals, or MTTR. Triggers were incomplete (missing k6, scalability).

**Changes:**
- Description: added scalability test, k6, Artillery to tool list
- Inputs: added workload model (open/closed)
- Core Workflow: expanded from 5 to 7 steps:
  1. Env parity verification (new)
  2. Read SLA/baseline (unchanged)
  3. Workload model + ramp-up formula + think time (updated)
  4. Tool-specific listener setup (updated)
  5. Warm-up exclusion (new)
  6. Four Golden Signals analysis + MTTR (new)
  7. L2 review request (unchanged)
- References: added `performance-testing-guideline.md`
- Stop Conditions: added env parity waiver condition

---

### 4. performance-testing-guideline.md — New file

**Reason for addition:**
No human-facing writing guideline existed. Skill files instruct Claude; engineers had no structured reference for when and how to write performance tests.

**Content (10 sections):**
1. When to write a performance test (trigger conditions)
2. What to gather before starting (input checklist)
3. Choosing the right test type (decision table)
4. How to write test scenarios (5-field template + 2 examples)
5. Workload model — open vs closed (coordinated omission risk)
6. Scoping rules — include/exclude criteria
7. Determining SLA when none is provided (priority order)
8. Definition of Done — quality checklist (planning / execution / reporting)
9. Environment parity checklist (9 items)
10. Common mistakes to avoid (10 anti-patterns)

---

## Upgrade guide from v2.1 → v2.2

1. **No breaking changes** — all existing skill trigger keywords unchanged
2. **Existing performance test plans**: no changes needed — new configs apply to new tests only
3. **JMeter scripts**: update Duration to 3600s and Ramp-Up to `N × 0.75`s when re-running existing plans for accuracy
4. **Summary Report → Aggregate Report**: swap listener in existing `.jmx` files for richer percentile data
5. **New file**: `performance-testing-guideline.md` added to `references/` — no action needed, loaded automatically by INDEX routing

---

## Compatibility

| Component | v2.1 | v2.2 |
|---|---|---|
| Skills qa-core 01-15 | ✅ | ✅ (unchanged) |
| qa-automation 01-02 | ✅ | ✅ (unchanged) |
| qa-specialist 01 (security) | ✅ | ✅ (unchanged) |
| qa-specialist 02 (performance) | ✅ | ✅+ major enhancement |
| qa-specialist 03 (accessibility) | ✅ | ✅ (unchanged) |
| performance-baseline.md | ✅ | ✅+ extended (backward compat) |
| performance-testing-guideline.md | — | ✅ New |
| Existing JMeter .jmx scripts | ✅ | ✅ (run as-is; update params for accuracy) |
| k6 scripts | — | ✅ Now supported as primary CI gate tool |
