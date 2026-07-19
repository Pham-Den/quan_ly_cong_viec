// CODE-1: Sprint v1 · TG-01 Shared Contracts · NFR-004 · API-002/021/022 · PR-002
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
