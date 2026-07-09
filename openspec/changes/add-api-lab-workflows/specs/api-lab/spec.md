## ADDED Requirements

### Requirement: User can open API Lab by project
The system SHALL provide a new authenticated `API Lab` menu where API requests, flows, environments, and run history are scoped by the selected project.

#### Scenario: Open API Lab menu
- **WHEN** the user opens the `API Lab` menu after selecting a project
- **THEN** the system shows API collections, saved requests, flows, environments, and recent run history for that project

#### Scenario: API Lab requires login
- **WHEN** an unauthenticated user tries to access API Lab data or execution APIs
- **THEN** the system rejects the request using the existing auth guard

### Requirement: User can link API Lab items to a task
The system SHALL allow API requests, flows, and run records to be project-only or linked to one task.

#### Scenario: Link request to task
- **WHEN** the user saves an API request and selects a task
- **THEN** the system stores the task link and shows the request as related to that task

#### Scenario: Keep project utility request unlinked
- **WHEN** the user saves an API request without selecting a task
- **THEN** the system stores the request as a project utility request that remains available in API Lab

### Requirement: User can manage API environments and variables
The system SHALL allow project-scoped environments for `local`, `dev`, `uat`, `prod`, and custom names, with plain variables, masked secret variables, and variable variants.

#### Scenario: Create environment
- **WHEN** the user creates an environment with name, base URL, variables, and secret variables
- **THEN** the system stores the environment under the selected project and makes its variables available to request execution

#### Scenario: Use default environment types
- **WHEN** the user opens environment settings for a project
- **THEN** the system supports `local`, `dev`, `uat`, `prod`, and custom environment records

#### Scenario: Switch variable variant
- **WHEN** the user selects a variable variant such as another token or test account
- **THEN** the system uses that variant during request execution without requiring the saved request definition to change

#### Scenario: Mask secret variable
- **WHEN** an environment variable is marked secret
- **THEN** the system masks the value in UI previews, run logs, saved response records, and API responses that return saved configuration

### Requirement: User can create and edit saved API requests
The system SHALL allow saved requests with method, URL or path, query parameters, headers, body type, body content, timeout, optional auth metadata, and optional task link.

#### Scenario: Save JSON request
- **WHEN** the user saves a `POST` request with JSON body, headers, and timeout
- **THEN** the system stores the request and shows it in the API Lab request list

#### Scenario: Resolve environment URL
- **WHEN** a saved request uses `{{baseUrl}}/api/tasks/{{task.code}}`
- **THEN** the system resolves `{{baseUrl}}` from the selected environment and `{{task.code}}` from the linked task when the request is executed

#### Scenario: Import request from cURL
- **WHEN** the user pastes a cURL command into API Lab
- **THEN** the system parses method, URL, query parameters, headers, and body into a saved request draft for review before saving

### Requirement: User can execute a single API request
The system SHALL execute API requests through the backend and store minimal run logs by default.

#### Scenario: Execute request successfully
- **WHEN** the user runs a saved request with a selected environment
- **THEN** the backend sends the outbound HTTP request, stores run metadata with response status, duration, assertion summary, captured variables, and errors, and shows the current response in API Lab without saving the response body by default

#### Scenario: Handle request error
- **WHEN** the outbound request fails because of timeout, network error, invalid URL, or response size limit
- **THEN** the system stores a failed run with the error reason and shows the failure without crashing the UI

#### Scenario: Save response body explicitly
- **WHEN** the user clicks `Luu ket qua` or enables response storage for a request
- **THEN** the system stores the response body subject to configured size limits and masks known secret values

### Requirement: User can define multi-step API flows
The system SHALL allow flows made of ordered steps where each step references a saved request or an inline request override.

#### Scenario: Create API flow
- **WHEN** the user creates a flow with multiple ordered steps
- **THEN** the system stores the flow, step order, selected requests, per-step overrides, capture rules, assertion rules, and continue-on-failure setting

#### Scenario: Reorder flow steps
- **WHEN** the user changes the order of flow steps
- **THEN** the system persists the new order and executes the steps in that order on the next run

#### Scenario: Drag flow step order
- **WHEN** the user drags a flow step above or below another step
- **THEN** the system updates the visual order and persists the new execution order

### Requirement: Flow steps can pass output into later requests
The system SHALL allow a step to capture values from its response and expose them as variables for later steps in the same flow run.

#### Scenario: Capture JSON value for next step
- **WHEN** step `Create user` captures `$.data.id` as `userId`
- **THEN** later steps in the same flow can use `{{userId}}` in URL, query, headers, or body

#### Scenario: Drag response field into next request
- **WHEN** the user drags a field from a response JSON preview into a later request URL, query, header, or body field
- **THEN** the system creates a capture rule and inserts the matching `{{variableName}}` reference into the target request field

#### Scenario: Capture header value for next step
- **WHEN** step `Login` captures response header `x-session-token` as `sessionToken`
- **THEN** later steps can use `{{sessionToken}}` in request headers

#### Scenario: Missing required capture stops flow
- **WHEN** a step has a required capture rule and the value cannot be found
- **THEN** the system marks the step as failed and stops the flow unless the step is configured to continue on failure

### Requirement: User can run API flows and inspect per-step results
The system SHALL execute flow steps sequentially through the backend and store a parent flow run with child step run metadata.

#### Scenario: Run flow successfully
- **WHEN** the user runs a flow with three steps and all steps pass
- **THEN** the system stores the flow run as successful, stores each step's status, duration, assertion summary, captured variables, and errors, shows current response details in API Lab, and makes the run available in history

#### Scenario: Stop flow on failed step
- **WHEN** a step fails and continue-on-failure is disabled
- **THEN** the system stops executing later steps and records the skipped steps in the flow run result

### Requirement: User can add assertions to requests and flow steps
The system SHALL evaluate declarative assertions after a response is received.

#### Scenario: Assert status code
- **WHEN** a request has assertion `status equals 200`
- **THEN** the run result shows the assertion as passed only when the response status is `200`

#### Scenario: Assert JSON path exists
- **WHEN** a request has assertion `$.data.id exists`
- **THEN** the run result shows the assertion result with pass/fail status and failure reason

#### Scenario: Failed assertion marks run failed
- **WHEN** the request completes but one required assertion fails
- **THEN** the system marks the request run or step run as failed while preserving the current response details in UI and storing the assertion failure summary in run history

### Requirement: User can view API run history
The system SHALL keep API request and flow run history with minimal metadata by default and optional saved response bodies while masking secrets.

#### Scenario: View request run history
- **WHEN** the user opens a saved request
- **THEN** the system shows recent runs with status, response code, duration, started time, linked task, and assertion summary

#### Scenario: Inspect run detail
- **WHEN** the user opens a run detail
- **THEN** the system shows request metadata, response status, duration, captured variables, assertion results, and error details with secret values masked

#### Scenario: Inspect saved response body
- **WHEN** the user opens a run detail whose response body was explicitly saved
- **THEN** the system shows the saved response body preview with truncation and secret masking indicators

### Requirement: User can attach API run evidence to task timeline
The system SHALL allow important API run results to be attached to the linked task timeline without changing task branch or work status.

#### Scenario: Attach successful run to task timeline
- **WHEN** the user attaches a successful API request or flow run to a linked task
- **THEN** the system creates a timeline event referencing the run, request or flow name, status, duration, and summary, without changing task branch status or task work status

#### Scenario: Attach failed run to task timeline
- **WHEN** the user attaches a failed API run to a linked task
- **THEN** the system creates a timeline event with the failure summary so the user can track API test evidence for that task, without changing task branch status or task work status

### Requirement: API Lab protects local data and execution
The system SHALL apply guardrails for execution timeout, response size, secret masking, and project/task access.

#### Scenario: Timeout outbound request
- **WHEN** an outbound API request runs longer than the configured timeout
- **THEN** the backend aborts the request, stores a timeout failure, and returns a readable error to the UI

#### Scenario: Do not store response body by default
- **WHEN** an API request or flow step completes
- **THEN** the system does not store response body unless the user explicitly saves the response, attaches it to a task with body storage enabled, or enables response storage for that request or flow

#### Scenario: Limit explicitly saved response body storage
- **WHEN** an explicitly saved response body exceeds the configured storage limit
- **THEN** the system stores a truncated body preview, records the original size if available, and marks the response as truncated

#### Scenario: Reject cross-project task link
- **WHEN** the user tries to link an API request, flow, or run to a task from another project
- **THEN** the system rejects the operation and keeps project data separated
