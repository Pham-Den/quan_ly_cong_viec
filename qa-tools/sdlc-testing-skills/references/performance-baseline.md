# Performance Baseline & Testing Guide

> Skill reads this file to determine baseline thresholds and how to conduct performance testing.
> The default baseline applies when a project has no dedicated SLA.
> Always prioritise the SLA defined in qa-config.yaml if one exists.

---

## Default Baseline Thresholds

### Response Time (API)

| API Type | P50 (median) | P95 | P99 | Max acceptable |
|---|---|---|---|---|
| Simple CRUD API (GET/POST) | ≤ 200ms | ≤ 500ms | ≤ 1000ms | 2000ms |
| API with business logic (calculations, workflows) | ≤ 500ms | ≤ 1000ms | ≤ 2000ms | 5000ms |
| Third-party integration API (payment, SMS) | ≤ 1000ms | ≤ 3000ms | ≤ 5000ms | 10000ms |
| Export / report API (processing large data) | ≤ 2000ms | ≤ 5000ms | ≤ 10000ms | 30000ms |
| File upload API | ≤ 3000ms | ≤ 8000ms | ≤ 15000ms | 30000ms |

### Page Load Time (Web)

| Page Type | FCP (First Contentful Paint) | LCP (Largest Contentful Paint) | TTI (Time to Interactive) |
|---|---|---|---|
| Landing page / Marketing | ≤ 1.5s | ≤ 2.5s | ≤ 3s |
| Dashboard / Main app page | ≤ 2s | ≤ 3s | ≤ 4s |
| Large data list page | ≤ 2s | ≤ 4s | ≤ 5s |
| Report / chart page | ≤ 3s | ≤ 5s | ≤ 6s |

> Source: Google Core Web Vitals thresholds (Good: ≤ 2.5s LCP, Poor: > 4s)

### Throughput & Concurrent Users

| System scale | Concurrent Users (normal) | Concurrent Users (peak) | Requests/second |
|---|---|---|---|
| Small (startup, internal) | 10–50 | 100 | 50–200 rps |
| Medium (SME, a few thousand users) | 100–500 | 1000 | 200–1000 rps |
| Large (enterprise, public) | 1000–5000 | 10000 | 1000+ rps |

---

## Four Golden Signals (Google SRE) — Primary Metrics Framework

Structure all metric collection around these four signals before drilling into percentiles:

| Signal | What to measure | Warning threshold |
|---|---|---|
| **Latency** | P50 / P95 / P99 response time (successful AND failed requests separately) | P95 > Baseline × 1.5 |
| **Traffic** | Requests per second (actual throughput, independent of response time) | Drops > 20% below target |
| **Errors** | % of failed requests (5xx, timeout, assertion failures) | > 1% |
| **Saturation** | CPU, memory, DB connections, connection pool fill % | CPU > 80%, memory continuously increasing |

> Measure latency for **failed requests separately** — a fast failure (e.g., 503 in 10ms) does not mean the system is healthy.

---

## Metrics to Measure

| Metric | Description | Warning threshold |
|---|---|---|
| **Response time P95** | 95% of requests complete within this duration | > Baseline P95 × 1.5 |
| **Response time P99** | 99th percentile — tail latency affecting 1% of users | > Baseline P99 × 1.5 |
| **Error rate** | % of failed requests (5xx, timeout) | > 1% |
| **Throughput (rps)** | Number of requests processed per second | Drops > 20% below baseline |
| **Recovery time (MTTR)** | Time for metrics to return to baseline after spike ends | > 2 minutes |
| **CPU usage** | Average CPU utilisation | > 80% sustained |
| **Memory usage** | RAM consumed; check for leaks | Continuously increasing with no decrease |
| **Database connections** | Number of simultaneously open connections | > Connection pool limit × 0.8 |
| **Cache hit rate** | % of requests served from cache | < 70% (if caching is in use) |

---

## Workload Model — Closed vs Open

Choose the workload model before configuring any test. This affects how load is applied.

| Model | How it works | Risk | When to use |
|---|---|---|---|
| **Closed (VU/Thread)** | Fixed number of virtual users; next request starts only after current response | Coordinated omission — slow responses reduce actual throughput artificially | Simulating a fixed pool of active sessions (e.g., logged-in users browsing) |
| **Open (Arrival Rate)** | Requests arrive at a fixed rate (rps) regardless of response time | System may queue up requests and collapse if rate > capacity | Simulating real internet traffic, API gateways, public endpoints |

**Default:** Use **Closed model (JMeter Thread Group)** for most functional-load scenarios.  
Use **Open model** (k6 `constant-arrival-rate`, Artillery `arrivalRate`) when the SLA is expressed as "must handle N rps" and throughput independence from latency matters.

> Coordinated omission risk: if response time doubles in a closed model, throughput halves — the test looks stable while the system is actually degrading. For realistic stress and spike tests, prefer open model or use JMeter Throughput Shaping Timer.

---

## Warm-Up Period

All JVM-based systems (Spring Boot, Tomcat, Java services) require warm-up before measurements are valid.

| Phase | Duration | Action |
|---|---|---|
| **Ramp-up** | `CONCURRENT_USERS × 0.75`s | Gradually increase load; JMeter captures data but treat as warm-up |
| **Warm-up steady state** | First 2–3 minutes at full load | JIT compilation, connection pool fill, cache population — **exclude from reported results** |
| **Measurement window** | Remaining duration | Official results; configure JMeter Start Offset or exclude via Flexible File Writer |

**How to exclude warm-up in JMeter:**  
Set `jp@gc - Flexible File Writer` to start logging after `RAMP_UP + 180` seconds, or post-process `.jtl` to trim the first 3 minutes.

---

## Think Time

Think time simulates realistic user pacing between requests. Without it, the test generates unrealistically high throughput for a given user count.

| Scenario | Recommended think time | JMeter element |
|---|---|---|
| API load test (batch/service) | 0–0.5s | Constant Timer: 0–500ms |
| Web UI flow (user clicks) | 1–3s | Uniform Random Timer: 1000–3000ms |
| Complex user journey | 3–8s | Gaussian Random Timer: mean 5s, σ 1s |

> Think time goes **inside the Thread Group**, after each HTTP Sampler. Do not add think time to endpoints that are called programmatically (not by a human click).

---

## Types of Performance Tests

### 1. Load Test — Verify behaviour under normal load

**Purpose:** Confirm the system operates correctly at the expected daily load.

**Standard configuration:**
- Users: normal concurrent users (see scale table above)
- Duration: 60 minutes (3600 seconds)
- Ramp-up: `CONCURRENT_USERS × 0.75` seconds (dynamic — scales with user count)
- Pattern: constant load after ramp-up

**Pass when:** P95 ≤ baseline, error rate < 1%, no memory leak.

---

### 2. Stress Test — Find the system's limits

**Purpose:** Identify the breaking point — the threshold at which the system starts to degrade.

**Standard configuration:**
- Users: ramp up from 0 to 2× normal concurrent users (step-wise)
- Duration: 60 minutes total across all steps
- Ramp-up pattern:
  - Group 1: 50% users — 10 minutes
  - Group 2: 100% users — 10 minutes
  - Group 3: 150% users — 10 minutes
  - Group 4: 200% users — 30 minutes (sustained breaking-point zone)
- Observe: the point where P95 exceeds baseline and error rate begins to climb

**Report:** Record the breaking point — the concurrent user count and rps at which the system starts to fail.

---

### 3. Spike Test — Verify reaction to sudden traffic surges

**Purpose:** Simulate flash sales, events, and sudden traffic spikes.

**Standard configuration:**
- Phase 1 (low baseline): 10% users — 10 minutes
- Phase 2 (medium baseline): 50% users — 15 minutes
- Phase 3 (spike): 200% users — 30 minutes
- Phase 4 (recover): 10% users — 5 minutes
- Observe: does the system recover within 2 minutes after spike? Does auto-scaling work?

---

### 4. Soak Test (Endurance) — Verify long-term stability

**Purpose:** Detect memory leaks, connection leaks, and performance degradation over time.

**Standard configuration:**
- Users: 70% of normal concurrent users
- Duration: 8–12 hours (or overnight)
- Capture metrics snapshot every 30 minutes to detect drift
- Observe: does response time gradually increase over time? Does memory grow continuously?

---

### 5. Scalability Test — Verify horizontal/vertical scaling behaviour

**Purpose:** Confirm the system scales correctly when infrastructure is added (horizontal scale-out) or upgraded (vertical scale-up), and that performance improves proportionally.

**Standard configuration:**
- Baseline run: normal concurrent users on current infrastructure
- Scale step 1: add 1 instance / double resources → repeat same load
- Scale step 2: add 2 instances / 4× resources → repeat same load
- Load pattern: same as Load Test per step (60 min, constant)
- Compare: throughput and P95 per step against baseline step

**Pass when:** throughput increases ≥ 80% proportionally to resource increase; P95 does not degrade.

**Report:** Record throughput and P95 at each infrastructure configuration.

---

### 6. Ramp-Down — Verify graceful degradation and recovery

**Purpose:** Confirm the system releases resources cleanly and recovers to baseline after load ends. Required as the final phase of Stress and Spike tests.

**Standard configuration:**
- After peak load: reduce load back to 0% over 5 minutes (mirror of ramp-up)
- Observe: memory released, DB connections returned to pool, response time returns to baseline P95

**Recovery time SLA (MTTR):** P95 must return to ≤ baseline within **2 minutes** of load reaching 0.

**In JMeter:** add a final Thread Group with 0 users and use `jp@gc - Stepping Thread Group` to ramp down, or simply end the test and monitor server metrics for 5 minutes post-test.

---

## Recommended Tools

| Tool | Use case | Notes |
|---|---|---|
| **JMeter** | Load test, Stress test, API test — GUI + script | Preferred — full-featured, familiar to the team |
| **k6** | Modern load testing with JavaScript — open/closed model, CI-native | Recommended for CI/CD pipeline gates and arrival-rate tests; outputs JSON/InfluxDB/Prometheus |
| **Artillery** | API + WebSocket test | Preferred for real-time apps |
| **Locust** | Load test in Python | Use when the team is comfortable with Python |
| **Lighthouse** | Web performance (FCP, LCP, TTI) | Integrated in Chrome DevTools |
| **WebPageTest** | Real browser performance from multiple locations | Use for frontend audits |
| **BlazeMeter** | Distributed load test from multiple regions | Paid; integrates with JMeter scripts |

---

## Standard JMeter Test Plan Structure

### Test Plan structure
```
Test Plan
├── Thread Group (Load Test)
│   ├── HTTP Request Defaults (base URL, headers)
│   ├── HTTP Header Manager (Authorization, Content-Type)
│   ├── HTTP Cookie Manager
│   ├── [Sampler] HTTP Request — endpoint under test
│   ├── [Assertion] Response Assertion (status code)
│   ├── [Assertion] Duration Assertion (≤ P95 target)
│   └── [Timer] Constant Timer — think time between requests
├── Listeners
│   ├── Aggregate Report
│   ├── Response Times Over Time
│   └── Active Threads Over Time
└── Test Fragments (reusable: login, setup, teardown)
```

### Standard Thread Group configuration — Load Test

| Parameter | Value | Notes |
|---|---|---|
| Number of Threads | `${CONCURRENT_USERS}` | Use JMeter property |
| Ramp-Up Period | `${CONCURRENT_USERS} × 0.75` seconds | Dynamic — scales with user count; set via `-JRAMP_UP` |
| Loop Count | Forever | Combined with Scheduler |
| Duration (Scheduler) | 3600 (seconds) | Run for 60 minutes |
| Startup delay | 0 | Increase if multiple Thread Groups run in sequence |

### Required Listeners

| Listener | Purpose |
|---|---|
| **Aggregate Report** | Primary results table — shows Average, P90, P95, P99, Error%, Throughput per sampler |
| Response Times Over Time | View latency trend across the test duration |
| Active Threads Over Time | Verify ramp-up shape matches configuration |
| Backend Listener → InfluxDB/Grafana | Real-time dashboard (if monitoring stack is set up) |

> Use **Aggregate Report** (not Summary Report) as the primary listener — it provides percentile breakdown per endpoint without extra plugins.

### Threshold checks

Read from Aggregate Report or InfluxDB/Grafana:

| JMeter metric | Display name | Pass threshold |
|---|---|---|
| Average | Average response time | ≤ Baseline P50 |
| 90th Percentile | P90 | ≤ Baseline P95 × 0.9 |
| 95th Percentile | P95 | ≤ Baseline P95 |
| 99th Percentile | P99 | ≤ Baseline P99 |
| Error % | Error rate | < 1% |
| Throughput | Requests/sec | ≥ Target rps |

### Run JMeter non-GUI (CI-friendly)

```bash
jmeter -n -t test-plan.jmx \
  -l results.jtl \
  -e -o html-report/ \
  -JCONCURRENT_USERS=50 \
  -JRAMP_UP=38 \
  -JDURATION=3600 \
  -JBASE_URL=https://staging.example.com
```

> `RAMP_UP` = `CONCURRENT_USERS × 0.75` (round to nearest integer).

---

## Performance Report Format

At the end of a performance test, the report must include:

| Metric | Baseline | Result | Pass? |
|---|---|---|---|
| P50 response time | {N}ms | {N}ms | ✅ / ❌ |
| P95 response time | ≤ {N}ms | {N}ms | ✅ / ❌ |
| P99 response time | ≤ {N}ms | {N}ms | ✅ / ❌ |
| Error rate | < 1% | {x}% | ✅ / ❌ |
| Throughput | ≥ {N} rps | {N} rps | ✅ / ❌ |
| Max concurrent users achieved | — | {N} | — |
| Breaking point (if stress test) | — | {N} users / {N} rps | — |
| Recovery time (MTTR) | ≤ 2 min | {N} min | ✅ / ❌ |

**Conclusion:** ✅ SLA met / ⚠️ Optimisation needed ({specific points}) / ❌ SLA not met

**Bottleneck identified:** {Database N+1 query / Missing index / Memory leak at X / Missing caching}

**Recommendations:** {Specific — not generic}

---

## Performance Environment Parity Checklist

Before running any performance test, verify staging matches production on every item below. Document any gap — a gap invalidates the result.

| Item | Required | How to verify |
|---|---|---|
| CPU count and type | Same as prod (or known ratio) | Cloud console, `lscpu` |
| Memory (RAM) | Same as prod (or known ratio) | Cloud console, `free -h` |
| Application instances / replicas | Same count as prod (or document difference) | K8s: `kubectl get deployment`, ECS: task count |
| Database: engine version | Exact match | `SELECT version()` |
| Database: connection pool size | Same config as prod | App config / `SHOW VARIABLES LIKE 'max_connections'` |
| Cache (Redis/Memcached): size and TTL config | Same as prod | Redis `INFO memory` |
| Network: internal latency | Within 10% of prod | `ping` between app and DB nodes |
| TLS / load balancer | Same topology (no direct IP bypass) | Verify via `curl -v` |
| Monitoring agents (APM, CloudWatch) | Active — same as prod | Check agent process |
| Test data volume | ≥ 70% of prod data volume (or note the difference) | DB row count query |

**If a gap exists:** document it explicitly in the test report under "Environment delta". Results from a non-parity environment are indicative only — not suitable for go/no-go decisions.

---

## CI/CD Performance Regression Gate

Integrate performance tests into CI/CD to catch regressions before merge. Use k6 or JMeter non-GUI.

### k6 threshold example (inline gate)

```javascript
// k6/load-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    load: {
      executor: 'constant-arrival-rate',
      rate: 50,             // 50 requests/second (open model)
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 100,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],   // fail build if P95 > 500ms
    http_req_failed:   ['rate<0.01'],                  // fail build if error rate > 1%
  },
};

export default function () {
  const res = http.get(`${__ENV.BASE_URL}/api/products`);
  check(res, { 'status 200': (r) => r.status === 200 });
}
```

```bash
# CI step — fails build if thresholds are breached
k6 run --env BASE_URL=https://staging.example.com k6/load-test.js
```

### JMeter gate via non-GUI + exit code check

```bash
jmeter -n -t test-plan.jmx -l results.jtl -e -o html-report/ \
  -JCONCURRENT_USERS=50 -JRAMP_UP=38 -JDURATION=600 -JBASE_URL=$STAGING_URL

# Parse results.jtl to check P95 and error rate
python tools/check_perf_threshold.py --jtl results.jtl --p95 500 --error-rate 0.01
# Exit code 1 = gate failed; CI pipeline fails the build
```

> **Frequency:** Run CI gate on every PR that touches: API handlers, DB queries, cache layer, or auth middleware. Skip for documentation-only PRs.
