// CODE-1: Sprint v1 · TG-01 Shared Contracts · FR-006/007 · ARCH-COMP-005 · PR-005
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
