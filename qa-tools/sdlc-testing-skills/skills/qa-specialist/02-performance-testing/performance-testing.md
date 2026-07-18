---
name: 02-performance-testing
description: >
  Plan and execute performance testing: load test, stress test, spike test,
  soak test, scalability test. Define baseline, configure JMeter test plan, analyze results, detect
  bottlenecks. Trigger: performance test, load test, stress test, spike test, soak test,
  scalability test, JMeter, k6, Artillery, Locust, load testing, performance testing.
  Output: Performance Test Plan + results compared against baseline
  (JMeter default; k6, Artillery, Locust also supported when the project has confirmed the tool).
---

# Performance Testing

> **Output language:** → See SKILL.md output rules.

Compact workflow. Read the detailed procedure only when exact legacy wording or edge cases are needed:
`references/skill-details/02-performance-testing.md`.

## Read First

- Read `project/qa-config.yaml` only if it exists and the task needs project config.
- Use `references/INDEX.md` to choose optional references; do not open all references.
- Governance gate: L2 — save artifacts, emit sign-off request, wait for explicit approval before publishing.

## Inputs

- Performance scope, workload model (open/closed), SLA/baseline, target environment, tool choice, test data

## Core Workflow

1. Verify environment parity against staging checklist in `references/performance-baseline.md`.
2. Read SLA/baseline from qa-config or performance reference.
3. Select workload model (closed = JMeter Thread Group / open = k6 arrival rate), test type, and configure ramp-up (`CONCURRENT_USERS × 0.75`s), duration, think time, and pass/fail thresholds.
4. Generate or review JMeter/k6/Artillery plan; use Aggregate Report (JMeter) or built-in thresholds (k6) as primary listener.
5. Exclude warm-up period (first 3 min) from reported results for JVM-based services.
6. Analyze Four Golden Signals: latency, traffic, errors, saturation. Record recovery time (MTTR) after spike/stress.
7. Emit L2 review request.

## Outputs

- Performance test plan/report and bottleneck analysis

## References

- references/performance-baseline.md
- references/performance-testing-guideline.md

## Stop Conditions

- Required input is missing and cannot be inferred from provided artifacts.
- Staging environment parity cannot be verified and no waiver is documented.
- The task requires external publishing but the required governance approval is not present.
