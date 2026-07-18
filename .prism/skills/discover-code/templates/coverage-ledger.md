# Coverage Ledger — "NO-OMISSION" evidence

> Checklist generated from the **Census** (methodology Step 1). Every artifact must end at `documented` OR `deferred (reason)` — **no more `pending`**. This is coverage evidence, instead of "I think it's done". Copy it into each slice's output (`_coverage.md`).

<!-- as-of: <repo>@<commit> on <date> -->
<!-- The "inbox item" column points to an item by its DESCRIPTIVE NAME / heading in the inbox doc (not an ID). discover-code does not assign IDs; import assigns the number. -->


## 1. Entry-points (reachability anchor)
| Entry-point | Type | path:line | → inbox item | Status |
|---|---|---|---|---|
| `POST /invoices` | route | web/InvoiceController.java:48 | Invoice creation | documented |
| `order.completed` consumer | event | notif/handler.py:20 | Email notify | documented |
| `cron daily-report` | job | reports/daily.py:10 | — | deferred (out of scope this slice) |

## 2. Data (table/entity)
| Table/entity | path | → entity item | Status |
|---|---|---|---|
| `invoices` | domain/Invoice.java | Invoice (entity) | documented |
| `email_log` | migrations/V12.sql | — | deferred (just a dependent of email, keep the contract) |

## 3. Events / Integrations
| Name | direction | path | Status |
|---|---|---|---|
| Stripe charge | calls-out | payments/stripe_client.py:30 | documented |
| topic `order.completed` | pub+sub | orders/events.py:14 | documented |

## 4. Cross-cutting
| Concern | location | Status |
|---|---|---|
| auth | security/JwtFilter:30 | documented |
| error handling | web/ErrorHandler:12 | documented |
| transaction | service `@Transactional` | inferred |

## 5. Branch coverage (branch-inventory anchor)
| Item (inbox) | #branches seen | #turned into AC | Status |
|---|---|---|---|
| Invoice creation | 5 (1 happy/3 validation/1 conflict) | 5 | complete |
| Email notify | 3 | 2 | ⚠ missing 1 (timeout path) → read further / Open Q |

## Rollup (completeness critic)
```
- Census: <#total> | documented <#> | deferred <#+reason> | pending 0  ← must = 0
- Entry with no-FR: <none/list>   · Table with no-entity: <none/list>
- Topic/integration omitted: <none/list>
- Branch not-yet-AC: <none/list>
- Artifact type not yet enumerated: <none — already swept: route/cli/job/consumer/export/table/topic/client/flag>
- Reachability: code not reachable from any entry? <none/list dead-or-missing-entry>
```
> If any rollup line ≠ "none/0" without a `deferred` reason → **not yet allowed to report "done"**.
