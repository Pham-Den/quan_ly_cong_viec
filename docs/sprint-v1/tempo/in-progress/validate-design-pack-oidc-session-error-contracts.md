# Validate Design — pack-oidc-session-error-contracts

## 1. Target And Fingerprint

- Command: `validate design` within `validate changes v1.7.21-oidc-session-error-contracts`
- Cycle: `pack-oidc-session-error-contracts`
- Candidate: approved sprint-v1 Design + APPROVED deltas + only this selected DRAFT Design delta
- Candidate-effective SHA-256: `ac5921aaaae5c40f27195acccaafe0b94c558c0c816048fb40317b5e0a0f429d`
- Design delta SHA-256: `2c3906bacd154f950aa2a7ebbf0114a8765072ddded4bd2737a30c402a7d0a94`
- Pack aggregate SHA-256: `6fb55aaced64b4b612234dc584dff1b60038db1c53ded314f865c8659e4b7302`
- Timestamp (UTC): `2026-07-20T10:49:52Z`
- `VAL-3`: a fresh-context reviewer re-read the current target, templates and approved upstream truth, re-derived impact before reading the pack matrix, and searched for fail signals rather than trusting prior validation claims.

## 2. Expectation Sources And Impact

Sources: `AGENTS.md`; `.prism/core/phase-quality-standards.md`; `.prism/core/phase-design.md`; Design/proposal/delta templates; approved Product and Design truth; selected Architecture and Test candidate contracts.

Independent derivation: API-018 creates distinct public callback/recovery states, so Design, Architecture, Plan, Test and Implement are impacted; Product meaning is unchanged. The pack matrix agrees.

## 3. Structural, Rule And Semantic Coverage

| Rule | Result | Evidence |
|---|---|---|
| `DOC-1`, `DOC-2` | Pass | Stable `SCREEN-009`, `DS-COMP-012`, message and overview anchors are present. |
| `DOC-3` | **Fail** | SCREEN-009 has route, entry, exit, interactions and four states but omits the required detailed Layout/wireframe contract. |
| `LINK-1`, `LINK-2`, `ORB-1` | Pass | Concrete API/sequence/test dependencies and selected-pack provenance are explicit. |
| `DES-1` | Pass | Must FR coverage is preserved; SCREEN-009 has exact callback/recovery states and copy. |
| `DES-2` | Pass | Every recovery branch has a stable hook, observable signal and deterministic exit. |
| `SEM-1` | Pass | Recovery semantics agree with API-017/018/024 and SEQ-001; no duplicate Design meaning found. |
| `VAL-1`, `VAL-3` | Pass | Fingerprints, expectation sources, rule coverage, semantic evidence, findings and conclusion are recorded. |

## 4. Deterministic Evidence

| Check | Result |
|---|---|
| Pack structure / collision | PASS / PASS — no collision |
| Design proposal / candidate Living Truth | PASS / PASS |
| Independent Product FR-001–012 coverage | PASS |

The deterministic checks do not enforce the per-screen Layout field, so their success does not override the `DOC-3` finding.

## 5. Semantic Integrity Evidence

- SCREEN-009 correctly stays in the public root authentication shell and excludes protected workspace content.
- Empty, Loading, Recovery and Error states agree with API-017/018 and DS-COMP-012.
- The missing layout leaves header/main arrangement, placement of the countdown/recovery panel and CTA region unspecified, unlike the existing screen inventory contract.

## 6. Findings

| Severity | Rule | Finding | Required resolution |
|---|---|---|---|
| blocker | `DOC-3` | `SCREEN-009` at Design delta lines 64–82 has no `**Layout:**` or equivalent detailed wireframe field required by the Design template; sibling screens define the page/panel arrangement explicitly. | Add a concrete public-auth-shell layout covering header/main content, recovery/countdown region, CTA placement and absence of authenticated sidebars/footer content as applicable. |

## 7. Conclusion

- blocker: 1
- warn: 0
- info: 0
- latest conclusion: `issues-found`

Design is not clean for this pack cycle.
