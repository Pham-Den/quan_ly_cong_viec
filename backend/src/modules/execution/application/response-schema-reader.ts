// Sprint: v1 | Feature: FR-006/FR-007 | Task Group: 01 Shared contracts
// Contract: ARCH-COMP-005 ExecutionResponseSchemaReader | Project: PR-005
// Pack: v1.7.20-canonical-task-group-headings
export type MaskedResponseField = {
  path: string
  type: 'null' | 'boolean' | 'number' | 'string' | 'array' | 'object'
  masked: boolean
}

export type MaskedResponseSchemaProjection = {
  sourceApiId: string
  capturedAt: Date
  fields: readonly MaskedResponseField[]
}

export interface ExecutionResponseSchemaReader {
  latestMaskedSchemas(input: {
    sourceApiIds: readonly string[]
    actorId: string
    hostId: string
  }): Promise<readonly MaskedResponseSchemaProjection[]>
}
