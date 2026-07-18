# TC Type & Technique Taxonomy
# Single source of truth — referenced by Skill 05 (gen) and Skill 07 (review).
# Do not duplicate this content inside skill files.

## Type — valid values for `[Type]` in Summary

| Type | When to use |
|---|---|
| `Happy` | Valid input, main success flow |
| `Neg` | Error input, invalid condition — system rejects request due to **wrong data** |
| `Auth` | RBAC boundary: allowed role / blocked role; cross-entity violation — **different from `Neg`**: Neg = wrong data, Auth = correct data but wrong permission |
| `State` | Entity lifecycle, state machine transition (e.g.: PENDING → ACTIVE → DEACTIVATED) — **different from `Corner`**: Corner = boundary value/edge data |
| `Corner` | BVA boundary, edge data, error guessing — does **not** include auth boundary (`Auth`) or state transition (`State`) |
| `Impact` | Effect on another feature/service: cascade, API contract, cross-module state |
| `E2E` | Full flow across multiple ACs, actors, services |
| `Security` | OWASP: JWT tamper, injection, broken auth, multi-tenancy boundary |
| `Perf` | Latency SLA, throughput, concurrent load |
| `Reliability` | Retry, fail-closed, DLQ, eventual consistency, error handling |
| `Regression` | Existing flow not affected by new change |
| `Exploratory` | Free-form, unscripted — always at end of file |

**Easily confused pairs:**
- `Neg` vs `Auth`: Neg = user submits invalid data (wrong email format); Auth = user submits correct data but lacks permission (wrong role, different entity)
- `State` vs `Corner`: State = checking sequence of state transitions; Corner = boundary value of a field/condition
- `Impact` vs `E2E`: Impact = cascade effect to another service; E2E = full happy flow from start to end

---

## Technique — valid values for column 16

| Value | Meaning |
|---|---|
| `—` | Basic Happy/Neg — no special technique applies |
| `EP` | Equivalence Partitioning only |
| `BVA` | Boundary Value Analysis only |
| `EP+BVA` | EP and BVA merged into 1 DataDriven TC |
| `DT` | Decision Table only |
| `DT+BVA` | Decision Table and BVA merged into 1 DataDriven TC |
| `DataDriven` | Multiple data combinations merged in 1 TC (no specific named technique) |
| `ST` | State Transition |
| `EG` | Error Guessing |
| `Idem` | Idempotency |
| `Race` | Race condition / concurrency |
| `Security` | OWASP, injection, auth bypass, multi-tenancy |
| `Perf` | Latency SLA, throughput |
| `Reliability` | Retry, DLQ, fail-closed |

---

## Type → Review group mapping (Skill 07 reference)

| Summary `[Type]` | Applicable review group |
|---|---|
| `Happy` | 1 — Happy path |
| `Neg` | 2 — Negative/Invalid |
| `Corner` | 3 (Boundary/EP) or 12 (Edge) — check Technique: BVA/EP → group 3; EG/Race → group 12 |
| `Auth` | 4 — Authorization & Security |
| `Reliability` | 5 (Error handling) or 9 (Data integrity) — depends on Technique |
| `State` | 6 — State transition |
| `Regression` | 7 — Regression |
| `Perf` | 8 — Performance |
| `Impact` / `E2E` | 11 — Integration/API |
| `Security` | 4 (auth/OWASP boundary) or 12 (edge injection) |
| `Exploratory` | 12 — Edge/Exploratory |
