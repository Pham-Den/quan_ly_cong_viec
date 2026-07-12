# Phase 6 Test Guide: Detailed Import Preview And Templates

Phase 6 improves the import review workflow before scanner work. The goal is to make every imported change visible before apply.

## Scope

Included:

- Item-level import preview details.
- Create/update badges per preview row.
- Environment scope shown for hosts and bindings.
- JSON/YAML topology templates.
- Template loading into the import editor.
- Template download actions.

Not included:

- Scanner from source, `.env`, docker-compose, or Laravel config.
- Destructive sync/delete import mode.
- Health checks.
- Incidents.
- SSH/logs/Docker actions.

## Automatic Checks

Run from repo root:

```bash
npm --workspace backend run prisma:validate
npm --workspace backend run build
npm --workspace backend run test
npm --workspace frontend run typecheck
npm --workspace frontend run build
npm run test:ui -- tests/e2e/system-manager.spec.ts
```

Expected:

- Backend preview includes `summary`, `details`, and `issues`.
- Invalid dependency source/target references keep preview invalid.
- Frontend build passes.
- Playwright verifies template loading, preview detail rows, apply, and graph refresh.

## Manual Review

1. Open `/system-manager`.
2. Open `Settings / Import / Export`.
3. Go to `Import / Export`.
4. Click `Template`.
5. Try `Dùng template JSON`.
6. Confirm the editor is filled with a valid topology import document.
7. Click `Preview import`.
8. Confirm the summary cards still show totals.
9. Confirm detailed groups appear:
   - Environments.
   - Hosts.
   - Global nodes.
   - Node bindings.
   - Global dependencies.
   - Dependency bindings.
10. Confirm rows show `create` or `update`.
11. Confirm binding rows show environment scope such as `sandbox`.
12. Click `Apply import`.
13. Confirm the new environment appears in the environment selector and graph renders the imported nodes.

## Invalid Preview Review

Paste a dependency that references a missing target node:

```json
{
  "dependencies": [
    {
      "code": "missing-target",
      "sourceCode": "sandbox-web",
      "targetCode": "missing-node",
      "label": "MISSING_NODE"
    }
  ]
}
```

Expected:

- Preview status is `Blocked`.
- Apply remains disabled.
- Issues explain the missing target node.

## Notes

- Import remains non-destructive.
- Missing records in the import document do not delete existing data.
- Detailed preview is the safety layer future scanner output will pass through before apply.
