# Performance Testing Writing Guideline

> For QA engineers. Explains how to plan, scope, and document performance tests so they are consistent, executable, and reviewable.
> For numeric thresholds and tool configuration, see `references/performance-baseline.md`.
> For the full report template, see `references/skill-details/02-performance-testing.md`.

---

## 1. When to Write a Performance Test

Write a performance test whenever **at least one** of the following conditions applies:

| Trigger | Example |
|---|---|
| New feature handles high-volume traffic | Order checkout, payment gateway, search API |
| Existing feature is significantly refactored | Query rewrite, cache layer added/removed |
| System is approaching a known capacity limit | DB connections near ceiling, memory usage trending up |
| Release gate requires NFT sign-off | UAT or go/no-go requires performance evidence |
| A performance incident occurred in production | Slow API after a traffic spike, timeout under peak load |
| SLA is contractually defined | Enterprise customer contract specifies P95 ≤ 1000ms |

**Do not write** a performance test for CRUD features with fewer than 10 concurrent users or purely internal admin tools with no SLA requirement.

---

## 2. What to Gather Before You Start

Collect these inputs before writing anything. If a required item is missing, pause and request it.

| Input | Required | Where to find it |
|---|---|---|
| List of endpoints / user flows to test | ✅ | FSD, API spec, Swagger |
| Test environment URL (staging equivalent to prod) | ✅ | `qa-config.yaml > environments.staging.url` |
| Expected concurrent users (normal and peak) | ✅ | Product team, analytics, system scale table in `performance-baseline.md` |
| SLA or response time target | Recommended | Contract, `qa-config.yaml > performance.api_p95_ms`, or use baseline default |
| Test type requested (load / stress / spike / soak) | Recommended | Sprint scope or infer from trigger (see Section 3) |
| Performance tool already in use by the project | Recommended | `qa-config.yaml > tools.automation.performance` |
| Server monitoring access (Grafana, CloudWatch) | Recommended | DevOps team |

---

## 3. Choosing the Right Test Type

Select the test type based on **what question you need to answer**:

| Question | Test type | When to use |
|---|---|---|
| Does the system work correctly at daily load? | **Load Test** | Every release, pre-UAT sign-off |
| What is the maximum the system can handle before breaking? | **Stress Test** | New infrastructure, capacity planning, post-incident |
| Can the system survive a sudden traffic burst and recover? | **Spike Test** | Promotions, flash sales, marketing campaigns |
| Does the system stay stable over many hours without degrading? | **Soak Test** | Suspected memory leaks, connection leaks, first production deployment |
| Does performance scale proportionally with added resources? | **Scalability Test** | New infrastructure tier, K8s auto-scaling validation |

**Multiple test types in one sprint:** start with Load Test (baseline behaviour), then Stress Test (limits). Add Spike only if a promotion is planned. Add Soak only if stability is in doubt.

---

## 4. How to Write Test Scenarios

Each scenario must answer five questions clearly. Use the table below as your writing template.

### Scenario structure

| Field | Description | Example |
|---|---|---|
| **Scenario name** | Verb + subject. State what is being simulated | `Load test — POST /api/orders at 200 concurrent users` |
| **Objective** | One sentence: what you want to verify | Verify order creation API sustains P95 ≤ 1000ms under normal load |
| **Workload model** | Users, ramp-up, duration, pattern | 200 users, 2-min ramp-up, 10-min steady state, constant load |
| **Pass criteria** | Specific, measurable thresholds | P95 ≤ 1000ms, error rate < 1%, throughput ≥ 50 rps |
| **Data requirement** | What test data is needed | 500 unique product IDs, 200 pre-authenticated user tokens |

### Example — Load Test scenario

```
Scenario: Load test — GET /api/products/search at 100 concurrent users

Objective:
  Verify the product search API handles normal daily load within SLA.

Workload model:
  - Users:    100 concurrent
  - Ramp-up:  75 seconds (CONCURRENT_USERS × 0.75)
  - Duration: 60 minutes (constant load after ramp-up)
  - Think time: 500ms between requests (API batch scenario)

Pass criteria:
  - P95 ≤ 500ms
  - Error rate < 1%
  - Throughput ≥ 80 rps

Test data:
  - 200 search keyword variations (mix of popular and rare terms)
  - No authentication required (public endpoint)
```

### Example — Stress Test scenario

```
Scenario: Stress test — POST /api/checkout — find breaking point

Objective:
  Identify the concurrent user count at which checkout API starts to degrade.

Workload model:
  - Group 1: 50 users  — 10 minutes
  - Group 2: 100 users — 10 minutes
  - Group 3: 150 users — 10 minutes
  - Group 4: 200 users — 30 minutes (sustained breaking-point zone)

Pass criteria (record, not pass/fail):
  - Record the user count at which P95 first exceeds 2000ms
  - Record the user count at which error rate first exceeds 5%

Test data:
  - 500 unique cart sessions with items pre-added
  - 500 pre-authenticated user tokens (one per virtual user)
```

---

## 5. Workload Model — Choosing Open vs Closed

This choice affects how realistic the load is and whether results are trustworthy.

| Model | How it works | Choose when |
|---|---|---|
| **Closed (Thread Group / VU)** | Fixed virtual users — next request starts after previous response | Simulating bounded sessions (logged-in users, internal tools) |
| **Open (Arrival Rate)** | Requests arrive at fixed rps regardless of response time | Simulating internet traffic, API gateway, SLA is "handle N rps" |

**Risk of closed model (Coordinated Omission):** if the server slows down, each VU waits longer → fewer requests per second → test looks stable while system is degrading. Use Throughput Shaping Timer in JMeter or switch to k6 constant-arrival-rate to avoid this for stress/spike tests.

---

## 6. Scoping Rules — What to Include and Exclude

### Include
- Any endpoint called more than 1000 times per day in production (or estimated peak)
- The critical path of the main user journey (search → add to cart → checkout → payment)
- Endpoints that have historically been slow or caused incidents

### Exclude
- Admin/internal endpoints with fewer than 10 simultaneous users
- Background batch jobs — test separately outside business hours
- Third-party APIs you do not control (mock or stub them in test data)
- Static assets (CDN-served images, CSS, JS) — covered by Lighthouse, not JMeter

---

## 7. Determining SLA When None Is Provided

Follow this priority order:

1. **Check `qa-config.yaml`** — look for `performance.api_p95_ms` and `performance.concurrent_users_normal`.
2. **Check the contract or FSD** — search for "response time", "SLA", "NFT", "non-functional".
3. **Ask the product owner** — what response time would a user notice? (Rule of thumb: > 1s feels slow, > 3s causes drop-off.)
4. **Use the default baseline** from `references/performance-baseline.md` — classify the endpoint type (Simple CRUD, Business Logic, etc.) and apply the matching threshold.

**Document which source you used.** If using the default baseline, write: `SLA source: default baseline (no project SLA defined)` in the test plan.

---

## 8. Definition of Done — Quality Checklist

A performance test is considered complete only when **all** of the following are true:

### Planning done
- [ ] Test type selected with justification (see Section 3)
- [ ] Workload model chosen (open/closed) with rationale
- [ ] All in-scope endpoints listed with their API type classification
- [ ] Workload model defined: users, ramp-up, duration, pattern
- [ ] Pass/fail thresholds documented against a named SLA source
- [ ] Test data requirements identified and prepared

### Execution done
- [ ] Environment parity checklist completed before test run
- [ ] Test run on staging (not local, not production)
- [ ] Warm-up period excluded from reported results (JVM services)
- [ ] Server-side metrics collected (CPU, memory, DB connections) during the test
- [ ] All required metrics captured: P50, P95, P99, error rate, throughput, MTTR

### Reporting done
- [ ] Results compared against baseline — each metric shows Baseline vs Result vs Pass/Fail
- [ ] Any threshold breach has a root cause identified (not just "P95 exceeded")
- [ ] Bottlenecks have specific, actionable recommendations (not "improve performance")
- [ ] Report saved to `testing-output/reports/performance/`
- [ ] L2 sign-off requested before sharing with stakeholders

---

## 9. Environment Parity Checklist

Run this checklist before every test. One "No" invalidates the result for go/no-go.

| Item | Status |
|---|---|
| CPU count / type matches production (or ratio documented) | Yes / No |
| RAM matches production (or ratio documented) | Yes / No |
| App replicas / instances count matches production | Yes / No |
| Database engine version exact match | Yes / No |
| DB connection pool size same as production | Yes / No |
| Cache (Redis) size and TTL config same | Yes / No |
| Load balancer / TLS topology same (no direct IP bypass) | Yes / No |
| Monitoring agents active (APM, CloudWatch, etc.) | Yes / No |
| Test data volume ≥ 70% of production data volume | Yes / No |

**Any gap:** document under "Environment delta" in the report. Mark results as "Indicative only".

---

## 10. Common Mistakes to Avoid

| Mistake | Why it is a problem | What to do instead |
|---|---|---|
| Testing on localhost or a dev environment | Results are meaningless — no network latency, different resources | Always test on staging configured to match production |
| Using a single virtual user to measure "performance" | Not a load test — just a functional check | Define the real concurrent user count first |
| Setting thresholds after seeing results | Confirmation bias — you tune the target to match whatever you got | Set pass criteria before running the test |
| Ignoring server-side metrics | P95 can look fine while the server is actually at 95% CPU — a time bomb | Always collect CPU, memory, and DB connection data alongside JMeter results |
| Reporting average instead of percentiles | Averages hide tail latency — 5% of users could be waiting 10s | Always report P95 and P99, not just average |
| Not preparing test data | Tests fail because of missing auth tokens or empty carts, not performance | Prepare test data (tokens, records, sessions) before the test run |
| Running load test directly against production | Risk of real impact on real users | Use staging only; get explicit approval if production testing is ever required |
| Writing "performance tested" in the report without numbers | Unstatable claim — cannot be reviewed or compared in the future | Always include the numeric result for every metric |
| Using closed model for public API stress test | Coordinated omission masks true degradation | Switch to open model (k6 constant-arrival-rate) for stress/spike |
| Skipping warm-up exclusion for JVM services | Cold-start latency inflates P95 in the first 3 minutes | Trim first 3 min of steady-state from reported results |
