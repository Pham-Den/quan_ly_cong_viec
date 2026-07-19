---
status: APPROVED
version: v1
sprint: 1
phase: architecture
sprint_id: sprint-v1
created: 2026-07-18
updated: 2026-07-19 11:17
approved_by: khanh-pham
applied_to_living: false
---

# Event Contracts Proposal — Sprint v1

**Architecture package references:** entrypoint `architecture-v1.md` (`ARCH-OVERVIEW-001`); companion set `adr-v1.md`, `api-specs-v1.md`, `data-flow-v1.md`, `erd-v1.md`, `events-v1.md`, `nfr-v1.md`, `project-reference-v1.md`, `sequence-v1.md`.

## New

<!-- ID: EVT-001 -->
### EVT-001: No Published Event Or Broker Contract In v1

- **Decision:** v1 publishes and consumes no Kafka, webhook, message-broker or partner event.
- **Runtime replacement:** accepted runs persist `execution_jobs`; workers claim through MySQL leases. UI observes execution state through conditional REST polling.
- **Domain facts:** modules may call typed in-process ports for audit/telemetry after or within the owning transaction as specified, but these are not distributed event contracts and have no external payload compatibility promise.
- **Delivery semantics:** job admission is atomic with the execution record; lease recovery is at-least-once at job claim level while persisted step transitions/idempotency prevent duplicate observable execution.
- **Dead-letter equivalent:** `execution_jobs.status=DEAD` after three claim failures; the row remains queryable with last error/lease evidence, emits an immediate critical alert owned by Operations and enters the `api-lab-dead-job-recovery` runbook. Manual replay requires idempotency verification and an audited operator action. There is no broker DLQ; ADR-004 governs this bounded exception.
- **Payload/schema/partition/consumer:** N/A because no published event exists.
- **Change trigger:** add an EVT contract and ADR before introducing a broker, webhook, external listener or cross-service asynchronous consumer.
- **Downstream impact:** Plan/Test must not create Kafka/webhook infrastructure or event contract tests for v1; they must test job leases, idempotency, polling, immediate alert ownership, runbook inspection and safe/audited DEAD recovery instead.

## Updated

## Removed

### Self-Review Checklist

- [x] No distributed event is fabricated.
- [x] Async durability, delivery and dead-job semantics are still explicit.
- [x] Future event introduction has a clear governance trigger.
