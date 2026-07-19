// Sprint: v1 | Feature: NFR-004 | Task Group: 01 Shared contracts
// Contract: API-002/021/022 ApprovedAddressSetRegistry | Project: PR-002
// Pack: v1.7.20-canonical-task-group-headings
export type ApprovedAddressSetRequest = {
  approvalRef: string
  hostId: string
  environmentKey: string
  canonicalCidrHash: string
}

export type VerifiedApprovedAddressSet = ApprovedAddressSetRequest & {
  canonicalCidrs: readonly string[]
  manifestVersion: string
}

export type AddressSetManifestFailure = 'MISSING' | 'INVALID' | 'STALE' | 'UNAVAILABLE' | 'MISMATCH'

export class AddressSetManifestVerificationError extends Error {
  readonly code = 'ADDRESS_SET_MANIFEST_VERIFICATION_FAILED'

  constructor(readonly reason: AddressSetManifestFailure) {
    super(`Approved address-set manifest verification failed: ${reason}.`)
    this.name = 'AddressSetManifestVerificationError'
  }
}

/**
 * Infrastructure implements signature, version, freshness and exact-record checks.
 * Missing, invalid, stale or unavailable manifests must reject; no permissive result exists.
 */
export interface ApprovedAddressSetRegistry {
  verify(request: ApprovedAddressSetRequest): Promise<VerifiedApprovedAddressSet>
}
