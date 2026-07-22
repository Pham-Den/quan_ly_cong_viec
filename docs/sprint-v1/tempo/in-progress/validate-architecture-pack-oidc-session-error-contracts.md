# Validate Architecture — pack-oidc-session-error-contracts

## 1. Target And Fingerprint

- Command: `validate architecture` within `validate changes v1.7.21-oidc-session-error-contracts`
- Cycle: `pack-oidc-session-error-contracts`
- Candidate-effective SHA-256: `cb08e1cba296e498db9927228858d77e5d29907006d932593642f22a724efeab`
- Main Architecture delta SHA-256: `fcdf54890d2a18f4d4c353bcc73fcaa130e451280679766b344a448026ad93e2`
- Registry delta SHA-256: `590de4ba0c713509a73c81b254b8dad85fdf4a0d8ea4ac2a4ae317a489262d0a`
- C4 / DFD SHA-256: `2905ae5e912a82629703d0016600d7f3cc4c7f266391d12d31e020025ef5ec51` / `33e2b256270be4c101dabe80cbabb6b9dca16a26b04039fb4d5119fa32e3f8a8`
- Pack aggregate SHA-256: `6fb55aaced64b4b612234dc584dff1b60038db1c53ded314f865c8659e4b7302`
- Timestamp (UTC): `2026-07-20T10:49:52Z`
- `VAL-3`: a fresh-context reviewer re-derived Architecture expectations, inspected current candidate truth and XML sources, and graded all three required layers.

## 2. Expectation Sources And Impact

Sources: `AGENTS.md`; `.prism/core/phase-quality-standards.md`; `.prism/core/phase-architecture.md`; proposal/delta/API/ERD/sequence/NFR/ADR/data-flow/project-reference templates; applicable backend/security standards; approved Product/Architecture truth; selected pack only.

Independent derivation matches the matrix: API/error semantics, identity persistence/ERD, sequence, NFR/ADR, project boundaries, C4/DFD and downstream Design/Plan/Test/Implement are impacted; Product is unchanged.

## 3. Structural And Three-Layer Coverage

| Rule / layer | Result | Evidence |
|---|---|---|
| `DOC-1` | Warn | The registry delta has no numbered review sections. |
| `DOC-2` | **Fail** | The intended API-023 Updated anchor is `+<!-- ID: API-023 -->`, not the exact anchor syntax. |
| `DOC-3` | **Fail** | The registry delta omits required Rationale, Downstream Impact and Acceptance Notes sections. |
| `LINK-1` | **Fail** | API-024 claims API-023 replacement, but effective composition omits that malformed update. |
| `LINK-2`, `ORB-1` | Pass | Sources, downstream effects, selected pack and verification context are explicit. |
| `ARCH-1` | **Fail** | Effective API/error truth and the protected-workspace sequence are internally contradictory. |
| `ARCH-2` | Pass | FLOW-004 and DFD cover actors, processes, stores and 20 labeled movements. |
| Layer 1 — internal consistency | **Fail** | API-023 update is absent and SEQ-001 falls through from failure branches into protected reads. |
| Layer 2 — Product fit | Pass | Product FR-001–012 meaning and trace coverage are preserved. |
| Layer 3 — standards compliance | Pass | Security, persistence, retry, observability and governed method contracts are otherwise aligned. |
| `SEM-1` | **Fail** | Candidate truth retains superseded aliases and depicts protected reads after typed authentication failures. |
| `VAL-1`, `VAL-3` | Pass | Required fingerprint, rule, semantic, layer, finding and conclusion evidence is recorded. |

## 4. Deterministic And Diagram Evidence

| Check | Result |
|---|---|
| Pack structure / collision | PASS / PASS — no collision |
| Proposal validators / candidate Living Truth | PASS |
| Candidate change summary | **FAIL semantic check** — `API-023` is absent while `API-024`, `ARCH-003`, `ENT-022` and `ENT-023` are present |
| C4 strict | PASS — Context, Container and Component pages are non-empty |
| DFD XML | PASS — required shapes; 20/20 arrows labeled and routed |
| Governed/mirror parity | PASS |

The malformed anchor is a deterministic-validator false negative: exact candidate composition proves the update is not applied.

## 5. Semantic Integrity Evidence

- API-024 declares canonical error precedence and removal of legacy IAM aliases, but the malformed API-023 anchor leaves the approved base catalog active.
- SEQ-001 returns 401/503 in authentication failure branches, then unconditionally executes Catalog and Workspace DB reads after the `alt` block, contrary to its own “no workspace payload” and fail-closed contracts.
- C4/DFD structure and Product trace remain complete; the blockers are concentrated in executable candidate routing and sequence semantics.

## 6. Findings

| Severity | Rule / layer | Finding | Required resolution |
|---|---|---|---|
| blocker | `DOC-2`, `LINK-1`, `ARCH-1`, `SEM-1`, Layer 1 | Architecture delta line 250 uses literal `+<!-- ID: API-023 -->`; effective change summary omits API-023, so deprecated aliases and stale identity error rows survive despite API-024 claiming replacement. | Remove the literal `+` so the exact Updated anchor composes, then verify API-023 appears in candidate change summary and contains only canonical identity errors. |
| blocker | `DOC-3` | The registry delta jumps from its title to `## New` and lacks required `### 1. Rationale`, `### 2. Downstream Impact`, and `### 3. Acceptance Notes`. | Add the three required delta-template sections without changing its governed scope. |
| blocker | `ARCH-1`, `SEM-1`, Layer 1 | SEQ-001 lines 1268–1287 continue into Catalog/Workspace reads after inactive/IAM-uncertain/repository-unavailable outcomes. | Put domain reads inside the verified-actor branch or model explicit termination for every typed failure. |
| warn | `DOC-1` | The registry delta has no numbered review sections; this is secondary to its DOC-3 omission. | Number the required sections when adding them. |

## 7. Conclusion

- blocker: 3
- warn: 1
- info: 0
- latest conclusion: `issues-found`

Architecture is not clean for this pack cycle.
