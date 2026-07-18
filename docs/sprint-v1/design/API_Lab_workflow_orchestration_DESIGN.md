---
status: APPROVED
version: v1
sprint: 1
phase: design
task: API_Lab_workflow_orchestration
created: 2026-07-18
updated: 2026-07-18 14:16
approved_by: khanh-pham
---

# API Lab Workflow Orchestration — Design Entry Point

Canonical Design APPROVED:

- [Design system proposal](./proposals/design-system-v1.md)

Design inherits Product v1 `APPROVED`. The stakeholder-provided UI overview image is used as an information-layout reference; the running application's existing design system remains the visual source of truth.

Accepted Design feedback adds a breadcrumb Navigation Contract, phase-1 equal-permission matrix, 10-second API delete Undo, complete browser dirty-state handling, optimistic edit-conflict protection, ranked fuzzy Resource Tree search, server-paginated virtual History table, a dedicated Workflow Validation Report, explicit rejection of the 21st concurrent Workflow Run, and workflow-local static variable management.

Approved Product effective truth includes [Product delta `v1.7.18-api-lab-undo-warning-viewport`](../changes/v1.7.18-api-lab-undo-warning-viewport/product-delta-v1.7.18-api-lab-undo-warning-viewport.md): FR-001/003/007/011, BR-005/011/012 and AC-044–059. This Design APPROVED package implements same-identity 10-second API Undo while dependent Workflows remain DISABLED, warning-only confirmation for the three named advisory conditions, and compact editing through 200% zoom on supported desktop screens ≥1280px.

Do not edit scope in this entrypoint. Future Product- or Design-scope corrections in this open sprint must use `start change:` and a new governed change pack.
