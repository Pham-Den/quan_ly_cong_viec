# Detailed Procedure: 02-performance-testing

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## Pre-DONE Checklist

> **L2 - QA Lead review required.** Report must not be sent to stakeholders until "Approved" is received. See the Sign-off section at the end of this file.

- [ ] All test types covered: load, stress, spike (or confirmed scope)
- [ ] Results clearly compared against baseline (P95, error rate)
- [ ] Bottleneck analyzed with action items
- [ ] L2 sign-off emitted
- [ ] Append execution record to governance/audit-log.md
- [ ] Update project/session-state.yaml -> last_execution, pending_sign_offs

---

## Inputs

| Information | Required |
|---|---|
| Test environment URL (staging — configured equivalent to production) | ✅ |
| List of APIs / flows to measure | ✅ |
| Test type to perform (load / stress / spike / soak / scalability) | ✅ |
| SLA or expected performance threshold (if available) | Recommended |
| System scale (actual user count, peak time) | Recommended |
| Tool already used in the project (from `tools.automation.performance` in qa-config) | Recommended |

If required information is missing → write `[Needs to be provided]`, ask again.
If no SLA is available → use the default baseline from `../../references/performance-baseline.md`.

If the project has `qa-config.yaml` → read it first, do not ask again:
- `performance.*` → SLA thresholds: `concurrent_users_normal/peak`, `api_p95_ms`, `api_error_rate_threshold`, `rollback_error_rate`
- `tools.automation.performance` → execution tool (jmeter/artillery/locust/k6)
- `environments.staging.url` → default test environment URL
- `environments.staging.auth_required` → whether auth setup is needed

If no `qa-config.yaml` is available → use the default baseline from `../../references/performance-baseline.md`; ask the user if a specific SLA is required.

---

## Step 0 — Verify environment parity

Before any test configuration, check the staging environment against the Performance Environment Parity Checklist in `../../references/performance-baseline.md`.

- If all items match: proceed.
- If gaps exist: document each gap in the report under "Environment delta". Treat results as indicative only — not valid for go/no-go.

---

## Step 1 — Define baseline and targets

Read `../../references/performance-baseline.md` for default thresholds.

Use values already read from `qa-config.yaml` (above) if available; otherwise use the default baseline.

Record the applied baseline:

| API / Endpoint | Type | P50 target | P95 target | Error rate | Concurrent users |
|---|---|---|---|---|---|
| `GET /api/...` | Simple CRUD | ≤ 200ms | ≤ 500ms | < 1% | [N] |
| `POST /api/...` | Business logic | ≤ 500ms | ≤ 1000ms | < 1% | [N] |

---

## Step 2 — Select test type and configure

Read the "Types of Performance Tests" section of `../../references/performance-baseline.md` for detailed configuration.

**Execution tool:** prefer `tools.automation.performance` from `qa-config.yaml` if set; otherwise default to **JMeter**.

Tools best supported by this skill:
- **JMeter** — default, uses template and baseline from `../../references/performance-baseline.md`
- **k6** — preferred for CI/CD gate and open-model (arrival rate) scenarios
- **Artillery / Locust** — only use if the project has committed to this tool in config or the user explicitly requests it

### Workload model selection

Before configuring Thread Groups, decide the workload model:
- **Closed model (default — JMeter Thread Group):** fixed VU count. Use when simulating a bounded pool of active users.
- **Open model (k6 `constant-arrival-rate`, Artillery `arrivalRate`):** fixed request rate. Use when the SLA is expressed as "must handle N rps" or when testing public API/gateway endpoints.

Read the "Workload Model" section in `../../references/performance-baseline.md` for decision criteria.

### Select test type by objective

| Objective | Test type |
|---|---|
| Confirm stable operation under daily load | Load Test |
| Find the limit / breaking point | Stress Test |
| Test flash sale, traffic spike | Spike Test |
| Detect memory leaks, long-term degradation | Soak Test |
| Verify horizontal/vertical scaling behaviour | Scalability Test |

### Standard JMeter configuration

If the execution tool is **JMeter**, apply the standard configuration below. If the project uses **k6**, **Artillery** or **Locust**, keep the same load/SLA targets and translate to that tool's configuration format.

Read the "Standard JMeter Test Plan Structure" section of `../../references/performance-baseline.md` for the template.

**Thread Group configuration by test type:**

**Load Test:**
- Number of Threads (users): `${CONCURRENT_USERS}`
- Ramp-Up Period: `CONCURRENT_USERS × 0.75` seconds (set via `-JRAMP_UP`)
- Loop Count: Forever + Scheduler Duration: 3600 seconds (60 minutes)
- Startup Delay: 0 (increase if chaining with other Thread Groups)

**Stress Test:**
- Use Ultimate Thread Group or multiple incrementally increasing Thread Groups:
  - Group 1: 50% users — 10 minutes
  - Group 2: 100% users — 10 minutes
  - Group 3: 150% users — 10 minutes
  - Group 4: 200% users — 30 minutes (sustained breaking-point zone)

**Spike Test:**
- Thread Group 1 (low baseline): 10% users — 10 minutes
- Thread Group 2 (medium baseline): 50% users — 15 minutes
- Thread Group 3 (spike): 200% users — 30 minutes
- Thread Group 4 (recover): 10% users — 5 minutes
- Observe: system must recover within 2 minutes after spike ends

**Soak Test:**
- Number of Threads: 70% of normal concurrent users
- Duration: 8–12 hours (or overnight)
- Log metrics every 30 minutes to detect drift

**Scalability Test:**
- Baseline run: normal concurrent users on current infrastructure (same as Load Test)
- Scale step 1: add 1 instance / double resources → repeat same load
- Scale step 2: add 2 instances / 4× resources → repeat same load
- Compare throughput and P95 at each step against baseline
- Pass when: throughput increases ≥ 80% proportionally to resource increase

---

## Step 3 — Set up assertions / thresholds per tool

If using **JMeter**, configure as follows. If using another tool, apply the same response time, error rate, and throughput thresholds equivalently.

**Think time:** add Constant Timer (API: 0–500ms) or Uniform Random Timer (UI flows: 1000–3000ms) after each HTTP Sampler. See the "Think Time" section in `../../references/performance-baseline.md` for values.

Apply thresholds from Step 1 in JMeter:

| Assertion | Configuration |
|---|---|
| Response Assertion | Response Code = 200 (or expected code) |
| Duration Assertion | Response Time ≤ Baseline P95 |
| Aggregate Report | Monitor: Average, P90, P95, P99, Error%, Throughput per sampler |

**Required listeners:**
- **Aggregate Report** (primary — use instead of Summary Report; provides percentile breakdown per endpoint)
- Response Times Over Time (view latency trend)
- Active Threads Over Time (verify ramp-up shape)
- Backend Listener → InfluxDB/Grafana (if monitoring stack is set up)

---

## Step 4 — Run test and collect results

Metrics to collect (see full details in `../../references/performance-baseline.md`):

| Metric | Collection source |
|---|---|
| P50, P95, P99 response time | JMeter Aggregate Report (Average, 90th%ile, 95th%ile, 99th%ile columns) |
| Error rate | JMeter Aggregate Report — Error% column |
| Throughput (rps) | JMeter Aggregate Report — Throughput column |
| CPU usage | Server monitoring (CloudWatch, Grafana, htop) |
| Memory usage | Server monitoring — observe whether it increases continuously |
| DB connections | DB dashboard or `SHOW PROCESSLIST` |

**JMeter non-GUI command (CI-friendly):**
```bash
jmeter -n -t test-plan.jmx \
  -l results.jtl \
  -e -o html-report/ \
  -JCONCURRENT_USERS=50 \
  -JRAMP_UP=38 \
  -JDURATION=3600 \
  -JBASE_URL=https://staging.example.com
```
> `RAMP_UP` = `CONCURRENT_USERS × 0.75` rounded to nearest integer.

**Warm-up exclusion:** for JVM/Spring Boot services, exclude the first 3 minutes of steady-state data from reported results (JIT compilation + cache warm). Trim `.jtl` or set Flexible File Writer start offset = `RAMP_UP + 180` seconds.

**For Soak Test:** capture a metrics snapshot every 30 minutes to detect drift.
**For Scalability Test:** repeat the full run at each infrastructure configuration; record throughput and P95 per run.
**After Spike/Stress test:** monitor server metrics for 5 minutes post-test; record recovery time (MTTR) — time until P95 returns to ≤ baseline.

---

## Step 5 — Analyze results and bottlenecks

Use the Four Golden Signals as the analysis framework: Latency → Traffic → Errors → Saturation.

Compare results against baseline. If thresholds are exceeded, analyze the root cause:

| Symptom | Common cause | Investigation approach |
|---|---|---|
| High P95, low CPU | N+1 query, missing index | Enable slow query log, EXPLAIN query |
| High P95, high CPU | Missing caching, heavy computation | Profile code, add Redis cache |
| Memory continuously increasing | Memory leak | Heap dump, profiler |
| Error rate increases under load | Connection pool exhausted | Increase pool size, check timeout |
| Throughput drops when scaling | Bottleneck at shared resource | Check DB locks, message queue |
| Throughput does not scale proportionally | Auto-scaling misconfigured, session affinity issue | Check load balancer config, stateful sessions, DB connection pool per instance |
| Recovery time > 2 min after spike | Slow connection pool drain, memory not released | Check pool return logic, GC tuning |

---

## Output Format — Performance Test Report

```markdown
## Test metadata

| Field | Value |
|---|---|
| **Test date** | [dd/mm/yyyy] |
| **Environment** | [staging URL] |
| **Test type** | Load / Stress / Spike / Soak / Scalability |
| **Workload model** | Closed (JMeter Thread Group) / Open (k6 arrival-rate) |
| **Tool** | [JMeter / k6 / Artillery / Locust] |
| **Duration** | [X minutes / hours] |
| **Warm-up excluded** | Yes (first 3 min) / No |
| **Environment delta** | None / [list gaps] |

---

## Aggregate results

| Metric | Baseline | Result | Pass? |
|---|---|---|---|
| P50 response time | ≤ [N]ms | [N]ms | ✅ / ❌ |
| P95 response time | ≤ [N]ms | [N]ms | ✅ / ❌ |
| P99 response time | ≤ [N]ms | [N]ms | ✅ / ❌ |
| Error rate | < 1% | [x]% | ✅ / ❌ |
| Throughput | ≥ [N] rps | [N] rps | ✅ / ❌ |
| Max concurrent users | — | [N] | — |
| Breaking point (stress) | — | [N] users / [N] rps | — |
| Recovery time (MTTR) | ≤ 2 min | [N] min | ✅ / ❌ |

---

## Results by endpoint

| Endpoint | P50 | P95 | P99 | Error rate | Pass? |
|---|---|---|---|---|---|
| `GET /api/...` | [N]ms | [N]ms | [N]ms | [x]% | ✅ / ❌ |

---

## Server metrics (Four Golden Signals)

| Time | CPU (Saturation) | Memory (Saturation) | DB connections (Saturation) | Errors |
|---|---|---|---|---|
| Baseline (no load) | [x]% | [N]MB | [N] | [x]% |
| Peak load | [x]% | [N]MB | [N] | [x]% |
| After test | [x]% | [N]MB | [N] | [x]% |

---

## Bottlenecks detected

[Specific description: N+1 query at endpoint X / Memory grew from 512MB → 1.8GB / Connection pool timeout]

## Recommendations

1. [Specific action — add index to orders.created_at table]
2. [Specific action — cache /api/report endpoint result with TTL 5 minutes]
3. [Specific action]

---

## Conclusion

✅ SLA met / ⚠️ Optimization needed before release / ❌ SLA not met — not eligible for release

**Reason:** [1-2 sentence summary]
```

---

**Save file to:** `output_paths.reports.performance` from qa-config (default: `testing-output/reports/performance/`)
→ `reports/performance-report-{project}-{sprint}.md`

## Sign-off Request (L2)

After completing the report, emit:

```
[L2 SIGN-OFF REQUEST]
Skill: 02-performance-testing
Output: reports/performance-report-{sprint}.md
Reviewer: {qa_lead from qa-config}
Status: Awaiting approval before publishing to stakeholders.
```

After receiving Approved: update project/session-state.yaml, remove item from pending_sign_offs.

---

## CI/CD Integration Note

If the project has a CI/CD pipeline, recommend adding a performance regression gate. Reference the "CI/CD Performance Regression Gate" section in `../../references/performance-baseline.md` for k6 and JMeter gate examples.

Gate should run on every PR touching: API handlers, DB queries, cache layer, or auth middleware.

---

## Completion Status

- **DONE** — Test complete, report complete, results clearly compared against baseline
- **DONE_WITH_CONCERNS** — Complete but: {P95 exceeded baseline at endpoint X / Suspected memory leak / Soak test needs to run longer / Environment parity gap noted}
- **BLOCKED** — Cannot test due to: {Staging environment is not representative / No server monitoring / Script error}
- **NEEDS_CONTEXT** — Additional input needed: {Specific SLA / Endpoint URLs to test / Expected concurrent user count}
