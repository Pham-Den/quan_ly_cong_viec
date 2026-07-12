# Phase 5 Test Guide: Settings And Safe Import/Export

Phase 5 adds local UI settings and safe topology import/export. It keeps the System Manager direction unchanged: graph + side panel + search remain the primary dev workflow, topology nodes/dependencies stay global, and runtime/config stays environment-specific.

## Scope

Included:

- Local persistent System Manager settings.
- Export topology as JSON.
- Import JSON/YAML with preview before apply.
- Non-destructive import apply through upsert.
- Graph refresh after import.

Not included:

- Scanner from source, `.env`, or docker-compose.
- Health checks.
- Incidents.
- SSH/logs/Docker inspect/exec.
- Destructive import sync/delete behavior.

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

- Backend import/export tests pass.
- Frontend typecheck/build pass.
- Playwright System Manager smoke passes.

## Manual Review

1. Open `/system-manager`.
2. Click the settings icon in the header.
3. In `Settings`, change:
   - `Default graph view`.
   - `Detail panel default`.
   - `Reset search when changing environment`.
4. Save settings, reload the page, and confirm the local behavior is restored.
5. Open `Import / Export`.
6. Click `Export JSON` and confirm the file includes:
   - `environments`.
   - `hosts`.
   - `nodes`.
   - node `bindings`.
   - `dependencies`.
   - dependency `bindings`.
7. Paste or select a JSON/YAML import document.
8. Click `Preview import`.
9. Confirm the preview shows create/update counts and blocks invalid references.
10. Click `Apply import`.
11. Confirm the environment selector refreshes and imported nodes/dependencies appear in the graph.
12. Search for an imported config key and confirm it jumps to the dependency edge.

## Import Shape

Minimal shape:

```json
{
  "version": 1,
  "environments": [
    { "key": "sandbox", "name": "Sandbox", "color": "#059669" }
  ],
  "hosts": [
    { "environmentKey": "sandbox", "name": "sandbox-app-01", "ip": "10.50.0.11" }
  ],
  "nodes": [
    {
      "code": "sandbox-web",
      "name": "Sandbox Web",
      "kind": "app",
      "type": "Web/API",
      "positionX": 80,
      "positionY": 180,
      "bindings": [
        {
          "environmentKey": "sandbox",
          "hostName": "sandbox-app-01",
          "status": "healthy",
          "configs": [
            {
              "name": "App",
              "items": [{ "key": "APP_ENV", "value": "sandbox" }]
            }
          ]
        }
      ]
    }
  ],
  "dependencies": []
}
```

## Review Notes

- Import is intentionally non-destructive in this phase.
- Missing records in an import file do not delete existing data.
- Host references that do not exist are warning-level; the binding can still be imported without host assignment.
- Dependency source/target node references are blocking errors.
