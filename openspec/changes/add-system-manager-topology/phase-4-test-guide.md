# System Manager Phase 4 Test Guide

Phase 4 corrects the data model: topology nodes and dependency edges are global, while runtime/config/status/host/IP values are stored per environment.

## Automatic Checks

Run from repo root:

```bash
npm --workspace backend run prisma:validate
npm --workspace backend run db:push
npm --workspace backend run db:seed
npm --workspace backend run build
npm --workspace backend run test
npm --workspace frontend run typecheck
npm --workspace frontend run build
npx playwright test tests/e2e/system-manager.spec.ts --project=chromium
git diff --check
```

## Manual Review

1. Open `/system-manager`.
2. Confirm Local graph shows the B2P flow and global node names such as `MariaDB`, `Redis`, `Kafka`.
3. Switch to Dev and confirm the logical node/edge ids remain the same while service labels/config values switch to Dev.
4. Search `DB_HOST` in Local and Dev; confirm the same edge opens but the config value changes by environment.
5. Click `Quản lý dữ liệu`.
6. In `Nodes`, edit an existing node while on Local; confirm the form copy says node is global and runtime/config belongs to the selected environment.
7. Switch environment and edit the same node code; confirm you are editing a binding for that environment, not creating a duplicate node.
8. In `Dependencies`, edit an existing edge config for the selected environment; confirm edge source/target remains global.
9. In `Dependencies`, use `Environment config` to switch Local/Dev and confirm the same edge shows different config values per environment.
10. Start flow from `B2P Web/API`; confirm the flow path is stable across environments.

## Model Expectation

Correct shape:

```text
Global:
B2P Web/API -- REDIS_HOST --> Redis

Local binding:
REDIS_HOST=redis-local.company.local

Dev binding:
REDIS_HOST=redis-dev.company.local
```

## Edge Config Syntax

Use `.env` style in dependency edge config:

```env
REDIS_HOST=redis-dev.company.local
REDIS_PORT=6379
REDIS_PASSWORD=secret:dev-redis-password
```

- One config per line.
- Blank lines and `# comments` are ignored.
- Use `secret:` prefix when the value should be masked.
