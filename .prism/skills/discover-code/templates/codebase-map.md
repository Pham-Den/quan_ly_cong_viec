---
kind: codebase-map
schema_version: 1
generated_by: discover-code
repos:
  - repo_id: app
    path: .
    scanned_at_commit: "<git-sha-of-scan>"
    dirty: false
---

# Codebase Map — <project>

> **Fixed file: `docs/codebase-map.md`.** Coverage ledger: list EVERY area (capability) that exists in the code + path + entry point.
> PRISM reads it to route (governed? / exists-un-governed / brand-new) and to scope reflect — see PRISM `core/sprint-manager.md § Codebase Map`.
> Does NOT enter Living Truth. **Governance is decided by Living Truth**; the `onboarded` column is only a *hint* updated at reflect seal time.

## Areas

| Area (capability) | repo | Key paths | Entry points (citation) | onboarded | LT refs |
|---|---|---|---|---|---|
| notifications | app | `src/notifications/` | `order.completed` consumer — `notifications/email.py:20` | no | — |
| orders | app | `src/orders/`, `src/web/orders.py` | `POST /orders` — `web/orders.py:33` | yes | EP-003, ARCH-COMP-004 |
| payments | app | `src/payments/` | Stripe client — `payments/stripe_client.py:12` | no | — |
| reports | app | `src/reports/` | `cron daily-report` — `reports/daily.py:10` | no | — |

<!-- Column convention:
  - Area: capability/domain name (group by capability, NOT just by directory tree).
  - Key paths: core directory/file of the area (to scope discover-code `full --paths`).
  - Entry points: route/CLI/job/consumer/public-export + citation `path:line`.
  - onboarded: hint `no | partial | yes` — updated at reflect sprint seal. (LT is the source of truth, not this column.)
  - LT refs: Living Truth IDs covering the area (if already onboarded) — e.g. EP/ARCH-COMP/...
-->

## Not yet mapped / deferred
- `src/legacy/` — Python 2.7, frozen → deferred (out of scope, reason: dead/frozen).
<!-- List the areas deliberately NOT YET scanned + why (no-silent-truncation). -->
