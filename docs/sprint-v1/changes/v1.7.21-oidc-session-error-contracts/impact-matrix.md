# Impact Matrix — v1.7.21-oidc-session-error-contracts

## 1. Overview

- Source phase: Architecture
- Earliest affected phase: Design
- Current downstream phase: Implement. The six TG-02/TG-03 candidate slices have source/test/config evidence and remain `IN_PROGRESS`; the selected DRAFT candidate truth is their only authorized contract until pack approval and implementation closure gates complete.

## 2. Phase Impact

| Phase | Status in current sprint | Impacted? | Action now | Stop / continue |
|---|---|---|---|---|
| Product | APPROVED | no — requirements and acceptance criteria are unchanged | none | continue |
| Design | APPROVED | yes — API-018 adds a public pre-session route plus distinct pre/post-claim and malformed-contract dependency-failure states that MSG-024 does not describe | delta: `design-delta-v1.7.21-oidc-session-error-contracts.md`; add SCREEN-009, DS-COMP-012/MSG-046/047/048 and public root-auth-shell ownership | continue |
| Architecture | APPROVED | yes — persistence, ERD ownership, API error, sequence, ADR, NFR, project-reference and DFD recovery contracts change | deltas: `architecture-delta-v1.7.21-oidc-session-error-contracts.md` routes `ENT-*` ERD truth and records API-017/018 public pre-session POST contracts/controls; `architecture-delta-v1.7.21-oidc-session-error-contracts-erd.md` carries the `ARCH-003` registry cross-reference | continue |
| Plan | APPROVED | yes — TG-02/TG-03 ownership and test surfaces change | absorption note: `plan-delta-v1.7.21-oidc-session-error-contracts.md`; six bounded slices and 34-heading invariant | continue |
| Test | APPROVED | yes — exact persistence/error/generator assertions and Test Plan CTI change | delta: `testing-delta-v1.7.21-oidc-session-error-contracts.md`; process absorption: `test-plan-absorption-v1.7.21-oidc-session-error-contracts.md` | continue |
| Implement | active | yes — Architecture API/component changes and Plan ownership/repo-test changes alter the open implementation contract | implement/refine TG-02/TG-02B/TG-02C/TG-03/TG-03B/TG-03C against this selected candidate; do not close until pack approval; run both completion modes after delivery | continue without fabricating runtime/coverage evidence |

## 3. Generated Artifacts

- [Change request](./change-request.md)
- [Design delta](./design-delta-v1.7.21-oidc-session-error-contracts.md)
- [Architecture delta](./architecture-delta-v1.7.21-oidc-session-error-contracts.md)
- [Architecture registry cross-reference delta](./architecture-delta-v1.7.21-oidc-session-error-contracts-erd.md)
- [Plan delta](./plan-delta-v1.7.21-oidc-session-error-contracts.md)
- [Testing delta](./testing-delta-v1.7.21-oidc-session-error-contracts.md)
- [Test Plan absorption](./test-plan-absorption-v1.7.21-oidc-session-error-contracts.md)
- [C4 Identity delta source](../../architecture/assets/c4-identity-session-delta.drawio)
- [Identity-session DFD source](../../architecture/assets/identity-session-data-flow.drawio)
- Pack-local diagram files under `assets/` are review mirrors only and must remain byte-identical to the two sprint-level governed Draw.io sources linked above. The sprint-level sources are the sole seal-routing authority; parity is checked during pack validation so mirrors cannot carry competing semantics.
- Candidate-effective source/export evidence: `generated/effective-test-cases-preview-v1.7.21.md`, `generated/test-cases-functional-vX.tsv`, `generated/test-cases-sit-vX.tsv`, and `generated/test-cases-export-manifest-vX.json`. `vX` deliberately denotes a DRAFT effective-truth preview; the manifest pins SHA-256 `4d524b512632bbee5cc5ca122f17e3dec599cc22dd332e025ed49f886dc55e58` and its repository-local source. `test-plan-absorption-v1.7.21-oidc-session-error-contracts.md` records the exact selected-draft composer command and the intentional noncanonical snapshot exception. Sprint-seal generation still emits canonical `v1` files from approved truth.
- Implement absorption target: TG-02 identity persistence, TG-02B backend identity, TG-02C browser cutover, TG-03 catalog generation, TG-03B runtime composition and TG-03C CODE-10. Candidate code exists and remains subject to fresh spec/quality validation; this matrix claims no unexecuted evidence.

## 4. Current Blockers

- Pack remains DRAFT until `validate changes v1.7.21-oidc-session-error-contracts` is clean and `approve changes v1.7.21-oidc-session-error-contracts` succeeds.
- TG-02 and TG-03 must not resume against the old contracts; they may resume against this selected DRAFT candidate truth before approval so implementation validation can produce real evidence.

## 5. Approval Rule

Approval requires clean Design, Architecture, Plan and Test candidate validations; zero pack-structure/collision findings; exact entity/API/sequence consistency; executable ownership/cutover zones; and both Implement pack-cycle modes validating the code actually produced by TG-02/TG-02B/TG-02C/TG-03/TG-03B/TG-03C. Candidate implementation may proceed while the pack is DRAFT, but merge/closure waits for pack approval. Historical evidence cannot satisfy the strict implementation-spec gate; after approval and delivery, both canonical completion validations (`--mode spec` and `--mode quality`) remain mandatory before `approve implement`.

## Self-Review Checklist

- [x] Quality Contract refs satisfied: `DOC-1`, `DOC-2`, `DOC-3`, `LINK-1`, `LINK-2`, `ORB-1`, `ORB-2`
- [x] All six phase rows are present; propagation reaches the active Implement pass and explicitly classifies its six candidate implementation slices
- [x] Generated artifacts and validation signals are concrete
- [x] Product is excluded with evidence; Design propagation is included explicitly
