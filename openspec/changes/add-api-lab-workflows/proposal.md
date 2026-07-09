## Why

Khi làm task nội bộ, người dùng không chỉ cần quản lý branch mà còn cần thử API liên quan ngay trong ngữ cảnh task đó. API Lab giúp lưu request, chạy nhiều request theo flow, lấy output của API trước làm input cho API sau, và giữ lịch sử test để truy vết cùng task.

## What Changes

- Add a new `API Lab` menu for project-scoped API collections, requests, environments, and multi-step flows.
- Allow API requests to be linked to a task so each task can keep its own internal API test notes and run history.
- Add a backend request runner so calls avoid browser CORS issues and can be audited consistently.
- Add variable support such as `{{baseUrl}}`, `{{token}}`, `{{task.code}}`, and captured variables from previous flow steps.
- Add response capture rules so a flow step can extract JSON/body/header/status values and pass them to later steps.
- Add simple assertions for status code, JSON path existence/value, response text, and response time.
- Add run history with minimal metadata by default: request, environment, status, duration, assertion results, captured variables, and errors; response body is saved only when the user explicitly saves it, attaches it to a task, or enables storage for that request/flow.
- Add timeline integration so important API run results can be attached to a task as evidence.
- Add cURL import in the MVP so existing internal API examples can become saved requests quickly.
- Add drag-and-drop UX for reordering flow steps and mapping fields from a response preview into a later request.
- Keep the MVP compact and local-first; do not build a full Postman replacement.

## Capabilities

### New Capabilities

- `api-lab`: Project/task-scoped API request lab, Postman-like collections, environments, request execution, multi-request flows, output-to-input chaining, assertions, minimal run history, optional saved responses, cURL import, and task timeline attachment.

### Modified Capabilities

- None. This is a new menu and capability that can link to existing projects/tasks without changing their core status rules.

## Impact

- Frontend: add `API Lab` route/menu, request editor, flow editor, response/history panels, and task-linked API run entry points.
- Backend: add Fastify APIs for API Lab CRUD, request execution, flow execution, captures/assertions, and run history.
- Database: add Prisma models for API environments, variable variants, requests, flows, flow steps, run records, captured variables, optional saved response bodies, and optional task links.
- Security: mask sensitive variables, avoid logging secrets by default, and keep execution behind authenticated backend APIs.
- Testing: add backend tests for variable resolution, chained flow execution, capture/assertion rules, and browser tests for the new API Lab workflow.
