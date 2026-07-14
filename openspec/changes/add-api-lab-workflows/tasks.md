## 1. Review Gate

- [x] 1.1 Wait for user review and explicit approval before implementing API Lab code.
- [x] 1.2 Confirm MVP scope: project-scoped API Lab, Postman-like collections, optional task links, backend runner, single request runner, multi-step flow runner, capture variables, assertions, minimal history, optional saved responses, cURL import, and task timeline attachment.
- [x] 1.3 Confirm response body save behavior in attach-to-task dialog: summary-only by default or include-body option.

## 2. Data Model And Backend Foundation

- [x] 2.1 Add Prisma models for API environments, variable variants, saved requests, flows, flow steps, request runs, flow runs, step runs, and optional saved response bodies.
- [x] 2.2 Add project and optional task relations, with guards that reject cross-project task links.
- [x] 2.3 Apply Prisma schema with existing `db:push` workflow and generate Prisma client.
- [x] 2.4 Add backend route module registration under authenticated `/api/api-lab`.
- [x] 2.5 Add CRUD APIs for environments, saved requests, flows, and flow steps.
- [x] 2.6 Add response DTOs that mask secret variables by default.
- [x] 2.7 Stop for user review before adding request execution.

## 3. Request Runner

- [x] 3.1 Implement variable resolution for environment variables, task variables, and runtime variables using `{{variableName}}`.
- [x] 3.2 Implement backend outbound HTTP execution with method, URL, query, headers, body, auth metadata, timeout, and response size limit.
- [x] 3.3 Store request run metadata by default: response status, duration, assertion summary, captured variables, error reason, and truncation metadata when applicable.
- [x] 3.4 Keep response body ephemeral by default and store it only when the user explicitly saves it, attaches it to a task with body storage enabled, or enables response storage for that request/flow.
- [x] 3.5 Mask secret values in stored run logs, saved response bodies, and returned run details.
- [x] 3.6 Add cURL import parser for method, URL, query parameters, headers, and body.
- [x] 3.7 Add backend tests for variable resolution, cURL import, successful run, timeout failure, invalid URL failure, response-save opt-in, response truncation, and secret masking.
- [x] 3.8 Stop for user review before building the API Lab UI.

## 4. API Lab Menu And Single Request UI

- [x] 4.1 Add `API Lab` item to the main sidebar and route guard.
- [x] 4.2 Build compact API Lab layout with left request/flow list, center editor, and right response/history panel.
- [x] 4.3 Build environment selector and environment variable editor with masked secret display.
- [x] 4.4 Build saved request editor for method, URL/path, query, headers, body type, body content, timeout, response-storage option, and optional task link.
- [x] 4.5 Build cURL import UI that creates a request draft before saving.
- [x] 4.6 Build single request run action and response viewer with status, duration, headers, body preview, save-response action, and assertion summary placeholder.
- [x] 4.7 Add browser test for opening API Lab, creating an environment, importing cURL, saving a request, and seeing it in the list.
- [x] 4.8 Stop for user review before adding multi-step flows.

## 5. Flow Runner And Output-To-Input Chaining

- [x] 5.1 Build backend capture rule support for JSON path, response header, status code, and raw text.
- [x] 5.2 Build backend flow execution that runs steps sequentially and passes captured variables into later steps.
- [x] 5.3 Support required captures and continue-on-failure behavior.
- [x] 5.4 Store parent flow run and child step run records with per-step captured variables and errors.
- [x] 5.5 Build flow editor with drag-and-drop ordered steps, saved-request picker, inline overrides, capture rules, and continue-on-failure toggle.
- [x] 5.6 Build drag-and-drop mapping from response JSON preview into a later request URL, query, header, or body field.
- [x] 5.7 Build flow run UI with per-step result, captured variables, skipped steps, and failure reason.
- [x] 5.8 Add backend and browser tests proving output from one API can be used as input for the next API and that drag/drop step ordering persists.
- [x] 5.9 Stop for user review before adding assertions and timeline integration.

## 6. Assertions And Run History

- [x] 6.1 Implement declarative assertions for status equals, JSON path exists, JSON path equals, body contains, header exists, and duration below threshold.
- [x] 6.2 Mark request or step runs failed when a required assertion fails while keeping current response details visible in UI and storing assertion failure metadata in history.
- [x] 6.3 Build assertion editor and assertion result display as compact tags.
- [x] 6.4 Build run history filters by project, task, request, flow, status, and date.
- [x] 6.5 Add backend tests for passed assertions, failed assertions, and assertion failure summaries.
- [x] 6.6 Stop for user review before attaching runs to tasks.

## 7. Task And Timeline Integration

- [x] 7.1 Add API run attachment action for linked task runs.
- [x] 7.2 Write timeline events when a request run or flow run is attached as task evidence.
- [x] 7.3 Add task detail API Lab section or tab showing linked requests, flows, and attached runs.
- [x] 7.4 Ensure API Lab events do not change task branch status or task work status.
- [x] 7.5 Add tests for attaching successful and failed runs to task timeline.
- [x] 7.6 Stop for user review before final verification.

## 8. Verification And Documentation

- [ ] 8.1 Run typecheck, lint, backend tests, frontend build, and Playwright tests.
- [ ] 8.2 Add a phase test guide for API Lab beside the existing change task docs.
- [ ] 8.3 Manually verify flow: create task -> create environment -> import cURL login request -> capture token -> drag response field into next request -> use token in next request -> attach run to task timeline.
- [ ] 8.4 Update `agent-tasks/plans.md` with final API Lab status and review notes after implementation.
- [ ] 8.5 Stop for user review before any commit or push.
