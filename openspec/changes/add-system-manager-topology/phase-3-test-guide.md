# System Manager Phase 3 Test Guide

Phase 3 adds manual topology management. It does not add JSON/YAML import, scanner, health checks, incidents, SSH, logs, or Docker actions.

## Automatic Checks

Run from repo root:

```bash
npm --workspace backend run prisma:validate
npm --workspace backend run db:push
npm --workspace backend run build
npm --workspace backend run test
npm --workspace frontend run typecheck
npm --workspace frontend run build
npx playwright test tests/e2e/system-manager.spec.ts --project=chromium
git diff --check
```

## Manual Review

1. Open `/system-manager`.
2. Click `Quản lý dữ liệu`.
3. In `Environments`, create a custom environment such as `staging`.
4. Switch to that environment and create one host.
5. Create one app node and one service node.
6. Create one dependency from the app node to the service node with a config key such as `REDIS_HOST`.
7. Confirm the graph reloads and shows the new nodes/edge.
8. Search by node name, host IP, and config key.
9. Click the edge and confirm config detail appears in the side panel.
10. Start flow from the app node and confirm the downstream service is highlighted.
