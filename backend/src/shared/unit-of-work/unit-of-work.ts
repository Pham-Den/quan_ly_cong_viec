import { AsyncLocalStorage } from 'node:async_hooks'

// Sprint: v1 | Feature: NFR-003 | Task Group: 01 Shared contracts
// Contract: API-004–007/009/011/021/022 | Project: PR-008
// Pack: v1.7.20-canonical-task-group-headings
export type UnitOfWork = {
  readonly transactionId: string
}

export interface UnitOfWorkAdapter {
  execute<T>(handler: (unitOfWork: UnitOfWork) => Promise<T>): Promise<T>
}

export class NestedUnitOfWorkError extends Error {
  readonly code = 'NESTED_UNIT_OF_WORK'

  constructor() {
    super('A UnitOfWork is already active; join the caller-owned transaction instead.')
    this.name = 'NestedUnitOfWorkError'
  }
}

const activeUnitOfWork = new AsyncLocalStorage<UnitOfWork>()

/**
 * Starts the sole transaction boundary and exposes its token to module services.
 * Services receiving the token must join it and must not call execute again.
 */
export class CallerOwnedUnitOfWork {
  constructor(private readonly adapter: UnitOfWorkAdapter) {}

  execute<T>(handler: (unitOfWork: UnitOfWork) => Promise<T>): Promise<T> {
    if (activeUnitOfWork.getStore()) {
      throw new NestedUnitOfWorkError()
    }

    return this.adapter.execute((unitOfWork) =>
      activeUnitOfWork.run(unitOfWork, () => handler(unitOfWork)),
    )
  }

  current(): UnitOfWork | undefined {
    return activeUnitOfWork.getStore()
  }
}
