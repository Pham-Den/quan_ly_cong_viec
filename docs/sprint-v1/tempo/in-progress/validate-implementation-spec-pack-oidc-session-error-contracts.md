# Validate Implementation Spec — pack-oidc-session-error-contracts

## 1. Target And Fingerprint

- Command: `validate implementation --mode spec` within `validate changes v1.7.21-oidc-session-error-contracts`
- Cycle: `pack-oidc-session-error-contracts`
- Task groups: TG-02, TG-02B, TG-02C, TG-03, TG-03B, TG-03C
- Git HEAD: `20f7266922f7e15e6b534387fbf662250f908990`
- Owned implementation-surface SHA-256: `60ddaf372cbf767471ac633c60b8ba6a37b5ca7ebafcf7c5d895662dba73bba0`
- Plan delta SHA-256: `8d398812924652336ca2c3dbd335e58bfcad4ec1034f09134929ef8b8c783213`
- Pack aggregate SHA-256: `6fb55aaced64b4b612234dc584dff1b60038db1c53ded314f865c8659e4b7302`
- Timestamp (UTC): `2026-07-20T10:49:52Z`
- `VAL-2`: a fresh-eyes reviewer re-read standards, current effective Plan/Test and selected pack, re-derived task obligations, refuted every slice and re-ran deterministic tests. The orchestrator independently completed the current CODE-10 Compose path after the reviewer time box.

## 2. Expectation Sources And Rule Coverage

Sources: `.prism/core/phase-quality-standards.md`; `.prism/core/phase-implement.md`; backend/frontend/unit-test/security standards; approved upstream truth plus selected pack; effective Plan/Test; current code, repo tests and implementation evidence.

| Rule | Result | Evidence |
|---|---|---|
| `VAL-1`, `VAL-2` | Pass | Fresh eyes, re-derived expectations, per-slice refutation, fresh execution and fingerprints are recorded. |
| `VI-1`–`VI-5` | Pass | Six `validate_implementation.py --run` checks return 0 blockers/0 warnings; VI-2/VI-5 are informational. |
| `CODE-3`, `CODE-3a`, `CODE-3c`, `CODE-10` | Pass | Deterministic unit/integration/browser tests, techniques/property rows and isolated Compose failure paths execute. |
| `CODE-3b` | **Fail** | Two governed owned files are below the required per-surface 90% branch threshold. |
| `CODE-1`, `CODE-2`, `CODE-4`–`CODE-9` | Pass | Meaningful markers, boundaries, dependencies, security seams and complexity remain within contract. |
| `SEM-1` | **Fail** | TG-02C evidence claims API service 100%, contradicting the current exact-command result. |

## 3. Per-Slice Refutation

| Slice | Result | Evidence |
|---|---|---|
| TG-02 | Pass | Persistence, encryption, expiry, rollback, replay and concurrency contracts pass. |
| TG-02B | Pass | API-017–020/024 happy/error/IAM/key/store and header behavior passes. |
| TG-02C | **Fail coverage** | Functional/session/callback/browser behavior passes, but owned `frontend/src/services/api.ts` is 84.69% branch. |
| TG-03 | Pass | Catalog generation, canonical errors and rollback/freshness checks pass. |
| TG-03B | **Fail coverage** | Composition/redaction/observability tests pass, but owned `backend/src/app.ts` is 89.19% branch without an accepted branch-level exclusion. |
| TG-03C | Pass | Compose happy/IAM/key/store self-test completes and cleans project resources. |

## 4. Fresh Execution Evidence

| Check | Result |
|---|---|
| Six deterministic TG runs with `--run` | PASS — each 0 blocker / 0 warning |
| Combined focused unit/contract suites | PASS — frontend 20/20; fresh combined contract run 62/62; reviewer backend focus 31/31 |
| Playwright callback/recovery runtime | PASS — 12/12 |
| Build / lint / typecheck / generator / Prisma / diff | PASS |
| Frontend exact coverage command | **FAIL threshold** — API service 97.00% line / 84.69% branch |
| Backend focused coverage | **FAIL threshold** — `app.ts` 100.00% line / 89.19% branch |
| CODE-10 Compose | PASS — dependencies healthy; happy/IAM/key/store self-test passed; cleanup left containers=0 and volumes=0 |

## 5. Semantic Integrity Evidence

- Runtime behavior, public-shell exclusion, one-time callback submission, typed errors and redaction agree with the intended Plan/Test contracts.
- `tg-02c-browser-session.md` claims the API service is 100% and all governed branches exceed the threshold, while the current exact required command reports 84.69% branch.
- `tg-03b-runtime-composition.md` records 89.19% for `app.ts` but excludes unspecified “unrelated composition alternatives”; the new TG-03B-owned file has no branch-level exclusion inventory supporting that carve-out.

## 6. Findings

| Severity | Rule | Finding | Required resolution |
|---|---|---|---|
| blocker | `CODE-3b`, TG-02C DoD, `SEM-1` | `frontend/src/services/api.ts` lines 49–52 and 60–61 yield 97.00% line / 84.69% branch under the required focused command, below the per-governed-surface 90% branch gate; TG evidence claims 100%. | Add decision-focused tests for login start/invalid auth URL branches, rerun the exact coverage command, and update evidence with the real result. |
| blocker | `CODE-3b`, TG-03B DoD | New TG-03B-owned `backend/src/app.ts` reports 100.00% line / 89.19% branch; no accepted branch-level exclusion inventory justifies dropping it from the gate. | Cover the remaining composition branch or document a precise governed exclusion accepted by the Plan quality contract, then rerun focused coverage. |

## 7. Conclusion

- blocker: 2
- warn: 0
- info: 2
- latest conclusion: `issues-found`

Implementation spec is not clean for this pack cycle.
