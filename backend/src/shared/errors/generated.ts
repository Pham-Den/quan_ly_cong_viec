// Generated from backend/errors.yml. Do not edit.
export const ERROR_METADATA = {
  "ACCESS_DENIED": {
    "code": "ACCESS_DENIED",
    "http": 403,
    "message_key": "errors.api_lab.access_denied",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "auth",
    "condition": "actor cannot access scoped Host/resource"
  },
  "ADMISSION_TRANSACTION_FAILED": {
    "code": "ADMISSION_TRANSACTION_FAILED",
    "http": 500,
    "message_key": "errors.api_lab.admission_transaction_failed",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "system",
    "condition": "execution/idempotency/job admission failed"
  },
  "API_DEFINITION_INVALID": {
    "code": "API_DEFINITION_INVALID",
    "http": 422,
    "message_key": "errors.api_lab.api_definition_invalid",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "saved API version cannot execute"
  },
  "API_NOT_ACTIVE": {
    "code": "API_NOT_ACTIVE",
    "http": 409,
    "message_key": "errors.api_lab.api_not_active",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "API lifecycle blocks run"
  },
  "API_NOT_DELETABLE": {
    "code": "API_NOT_DELETABLE",
    "http": 422,
    "message_key": "errors.api_lab.api_not_deletable",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "API cannot enter delete transition"
  },
  "API_NOT_FOUND": {
    "code": "API_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.api_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "API absent in Host Workspace"
  },
  "API_OR_HOST_NOT_FOUND": {
    "code": "API_OR_HOST_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.api_or_host_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "API or owning Host absent"
  },
  "API_STATE_CONFLICT": {
    "code": "API_STATE_CONFLICT",
    "http": 409,
    "message_key": "errors.api_lab.api_state_conflict",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "API lifecycle state disallows action"
  },
  "API_TOMBSTONE_NOT_FOUND": {
    "code": "API_TOMBSTONE_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.api_tombstone_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "undoable deletion record absent"
  },
  "API_UNDO_FAILED": {
    "code": "API_UNDO_FAILED",
    "http": 500,
    "message_key": "errors.api_lab.api_undo_failed",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "system",
    "condition": "restore transaction failed and fail-closed recovery runs"
  },
  "API_UNDO_WINDOW_EXPIRED": {
    "code": "API_UNDO_WINDOW_EXPIRED",
    "http": 409,
    "message_key": "errors.api_lab.api_undo_window_expired",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "server-authoritative 10-second undo deadline elapsed"
  },
  "API_VERSION_OR_BINDING_NOT_FOUND": {
    "code": "API_VERSION_OR_BINDING_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.api_version_or_binding_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "API version or Environment binding absent"
  },
  "AUTH_REQUIRED": {
    "code": "AUTH_REQUIRED",
    "http": 401,
    "message_key": "errors.api_lab.auth_required",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "auth",
    "condition": "no or expired authenticated session"
  },
  "CALLBACK_REPLAYED": {
    "code": "CALLBACK_REPLAYED",
    "http": 409,
    "message_key": "errors.api_lab.callback_replayed",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "OIDC callback state/code was already consumed"
  },
  "CLAIM_MAPPING_INVALID": {
    "code": "CLAIM_MAPPING_INVALID",
    "http": 422,
    "message_key": "errors.api_lab.claim_mapping_invalid",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "required identity claim mapping invalid"
  },
  "CSRF_INVALID": {
    "code": "CSRF_INVALID",
    "http": 403,
    "message_key": "errors.api_lab.csrf_invalid",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "auth",
    "condition": "missing, expired or mismatched CSRF token"
  },
  "DEFINITION_SCHEMA_INVALID": {
    "code": "DEFINITION_SCHEMA_INVALID",
    "http": 422,
    "message_key": "errors.api_lab.definition_schema_invalid",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "saved definition cannot be validated structurally"
  },
  "DELETE_TRANSACTION_FAILED": {
    "code": "DELETE_TRANSACTION_FAILED",
    "http": 500,
    "message_key": "errors.api_lab.delete_transaction_failed",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "system",
    "condition": "API delete/disable transaction failed"
  },
  "DUPLICATE_SIBLING": {
    "code": "DUPLICATE_SIBLING",
    "http": 409,
    "message_key": "errors.api_lab.duplicate_sibling",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "sibling name already exists"
  },
  "DUPLICATE_STEP_KEY": {
    "code": "DUPLICATE_STEP_KEY",
    "http": 422,
    "message_key": "errors.api_lab.duplicate_step_key",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "immutable Step key duplicated"
  },
  "ENABLE_TRANSACTION_FAILED": {
    "code": "ENABLE_TRANSACTION_FAILED",
    "http": 500,
    "message_key": "errors.api_lab.enable_transaction_failed",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "system",
    "condition": "recovery enable transaction failed"
  },
  "ENVIRONMENT_DELETE_FAILED": {
    "code": "ENVIRONMENT_DELETE_FAILED",
    "http": 500,
    "message_key": "errors.api_lab.environment_delete_failed",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "system",
    "condition": "Environment binding/value/audit delete transaction failed"
  },
  "ENVIRONMENT_INCOMPLETE": {
    "code": "ENVIRONMENT_INCOMPLETE",
    "http": 409,
    "message_key": "errors.api_lab.environment_incomplete",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "required Environment value is missing"
  },
  "ENVIRONMENT_PRECONDITION_FAILED": {
    "code": "ENVIRONMENT_PRECONDITION_FAILED",
    "http": 409,
    "message_key": "errors.api_lab.environment_precondition_failed",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "create/update precondition does not match Environment existence"
  },
  "ENVIRONMENT_REVISION_CONFLICT": {
    "code": "ENVIRONMENT_REVISION_CONFLICT",
    "http": 409,
    "message_key": "errors.api_lab.environment_revision_conflict",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "admission binding revision changed"
  },
  "EXECUTION_NOT_FOUND_OR_EXPIRED": {
    "code": "EXECUTION_NOT_FOUND_OR_EXPIRED",
    "http": 404,
    "message_key": "errors.api_lab.execution_not_found_or_expired",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Execution absent or outside retention"
  },
  "EXECUTION_PROJECTION_CONFLICT": {
    "code": "EXECUTION_PROJECTION_CONFLICT",
    "http": 409,
    "message_key": "errors.api_lab.execution_projection_conflict",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "requested projection/ETag conflicts with state"
  },
  "GLOBAL_LOGOUT_UNSUPPORTED": {
    "code": "GLOBAL_LOGOUT_UNSUPPORTED",
    "http": 422,
    "message_key": "errors.api_lab.global_logout_unsupported",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "all-session logout unsupported by IAM"
  },
  "HISTORY_QUERY_CONFLICT": {
    "code": "HISTORY_QUERY_CONFLICT",
    "http": 409,
    "message_key": "errors.api_lab.history_query_conflict",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "filters identify incompatible query scopes"
  },
  "HOST_CONTEXT_CONFLICT": {
    "code": "HOST_CONTEXT_CONFLICT",
    "http": 409,
    "message_key": "errors.api_lab.host_context_conflict",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "selected Host context changed"
  },
  "HOST_INACTIVE": {
    "code": "HOST_INACTIVE",
    "http": 409,
    "message_key": "errors.api_lab.host_inactive",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Host lifecycle blocks run"
  },
  "HOST_NOT_FOUND": {
    "code": "HOST_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.host_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "logical Host absent"
  },
  "HOST_OR_ENVIRONMENT_NOT_FOUND": {
    "code": "HOST_OR_ENVIRONMENT_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.host_or_environment_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Host or Environment binding absent"
  },
  "HOST_OR_RESOURCE_NOT_FOUND": {
    "code": "HOST_OR_RESOURCE_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.host_or_resource_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Host or selected resource absent in scope"
  },
  "HOST_OR_WORKSPACE_NOT_FOUND": {
    "code": "HOST_OR_WORKSPACE_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.host_or_workspace_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Host or Workspace absent"
  },
  "HOST_TRANSITION_FAILED": {
    "code": "HOST_TRANSITION_FAILED",
    "http": 500,
    "message_key": "errors.api_lab.host_transition_failed",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "system",
    "condition": "Host lifecycle/disable transaction failed"
  },
  "IDEMPOTENCY_KEY_REUSED": {
    "code": "IDEMPOTENCY_KEY_REUSED",
    "http": 409,
    "message_key": "errors.api_lab.idempotency_key_reused",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "same scoped key used with a different payload hash"
  },
  "IDEMPOTENCY_RESPONSE_TOO_LARGE": {
    "code": "IDEMPOTENCY_RESPONSE_TOO_LARGE",
    "http": 422,
    "message_key": "errors.api_lab.idempotency_response_too_large",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "projected successful response exceeds 65,536 bytes; coordinator rolls back before commit"
  },
  "IMPACT_SCAN_FAILED": {
    "code": "IMPACT_SCAN_FAILED",
    "http": 500,
    "message_key": "errors.api_lab.impact_scan_failed",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "system",
    "condition": "Host/API dependency scan failed"
  },
  "IMPACT_TOKEN_INVALID": {
    "code": "IMPACT_TOKEN_INVALID",
    "http": 409,
    "message_key": "errors.api_lab.impact_token_invalid",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "impact token absent, expired, mismatched or stale"
  },
  "IMPACT_TOKEN_REQUIRED": {
    "code": "IMPACT_TOKEN_REQUIRED",
    "http": 409,
    "message_key": "errors.api_lab.impact_token_required",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "contract-changing action lacks impact token"
  },
  "INTERNAL_ERROR": {
    "code": "INTERNAL_ERROR",
    "http": 500,
    "message_key": "errors.api_lab.internal_error",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "system",
    "condition": "redacted unexpected internal failure"
  },
  "INVALID_BODY": {
    "code": "INVALID_BODY",
    "http": 422,
    "message_key": "errors.api_lab.invalid_body",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "API request body invalid for selected type"
  },
  "INVALID_COMMAND": {
    "code": "INVALID_COMMAND",
    "http": 400,
    "message_key": "errors.api_lab.invalid_command",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "unsupported resource command or missing command discriminator"
  },
  "INVALID_DATE_RANGE": {
    "code": "INVALID_DATE_RANGE",
    "http": 422,
    "message_key": "errors.api_lab.invalid_date_range",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "history range invalid or exceeds 30 days"
  },
  "INVALID_FIELDS": {
    "code": "INVALID_FIELDS",
    "http": 422,
    "message_key": "errors.api_lab.invalid_fields",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "field-selection name not allowlisted"
  },
  "INVALID_FILTER": {
    "code": "INVALID_FILTER",
    "http": 422,
    "message_key": "errors.api_lab.invalid_filter",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "filter value/name invalid"
  },
  "INVALID_HOST_TRANSITION": {
    "code": "INVALID_HOST_TRANSITION",
    "http": 422,
    "message_key": "errors.api_lab.invalid_host_transition",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "proposed Host lifecycle transition invalid"
  },
  "INVALID_INCLUDE": {
    "code": "INVALID_INCLUDE",
    "http": 422,
    "message_key": "errors.api_lab.invalid_include",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "execution expansion not allowlisted"
  },
  "INVALID_LIFECYCLE_TRANSITION": {
    "code": "INVALID_LIFECYCLE_TRANSITION",
    "http": 422,
    "message_key": "errors.api_lab.invalid_lifecycle_transition",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "requested Workflow transition invalid"
  },
  "INVALID_MAPPING": {
    "code": "INVALID_MAPPING",
    "http": 422,
    "message_key": "errors.api_lab.invalid_mapping",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "mapping namespace/path/direction invalid"
  },
  "INVALID_METHOD": {
    "code": "INVALID_METHOD",
    "http": 422,
    "message_key": "errors.api_lab.invalid_method",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "HTTP method invalid or not allowlisted"
  },
  "INVALID_NAME": {
    "code": "INVALID_NAME",
    "http": 422,
    "message_key": "errors.api_lab.invalid_name",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "resource name invalid"
  },
  "INVALID_PAGE": {
    "code": "INVALID_PAGE",
    "http": 422,
    "message_key": "errors.api_lab.invalid_page",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "page/pageSize outside contract"
  },
  "INVALID_PATH": {
    "code": "INVALID_PATH",
    "http": 422,
    "message_key": "errors.api_lab.invalid_path",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "API path is not a valid relative path"
  },
  "INVALID_QUERY_COMBINATION": {
    "code": "INVALID_QUERY_COMBINATION",
    "http": 422,
    "message_key": "errors.api_lab.invalid_query_combination",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "query parameters are semantically incompatible"
  },
  "INVALID_REQUEST": {
    "code": "INVALID_REQUEST",
    "http": 400,
    "message_key": "errors.api_lab.invalid_request",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "malformed syntax, identifier or body envelope"
  },
  "INVALID_RETRY": {
    "code": "INVALID_RETRY",
    "http": 422,
    "message_key": "errors.api_lab.invalid_retry",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "retry count/base delay invalid"
  },
  "INVALID_RETURN_URL": {
    "code": "INVALID_RETURN_URL",
    "http": 400,
    "message_key": "errors.api_lab.invalid_return_url",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "login return URL is not same-origin/allowlisted"
  },
  "INVALID_SENSITIVE_PATH": {
    "code": "INVALID_SENSITIVE_PATH",
    "http": 422,
    "message_key": "errors.api_lab.invalid_sensitive_path",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "sensitive path syntax/uniqueness invalid"
  },
  "INVALID_SORT": {
    "code": "INVALID_SORT",
    "http": 422,
    "message_key": "errors.api_lab.invalid_sort",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "sort field/direction not allowlisted"
  },
  "INVALID_TARGET": {
    "code": "INVALID_TARGET",
    "http": 422,
    "message_key": "errors.api_lab.invalid_target",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "resource command target type/location invalid"
  },
  "INVALID_TARGET_CIDR_SET": {
    "code": "INVALID_TARGET_CIDR_SET",
    "http": 422,
    "message_key": "errors.api_lab.invalid_target_cidr_set",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "target CIDR set is absent, empty, malformed, duplicated, excludes current base-URL resolution, or its ref/Host/Environment/hash does not match the signed Approved Address Set manifest"
  },
  "INVALID_TIMEOUT": {
    "code": "INVALID_TIMEOUT",
    "http": 422,
    "message_key": "errors.api_lab.invalid_timeout",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "timeout outside 1–300 seconds"
  },
  "INVALID_URL": {
    "code": "INVALID_URL",
    "http": 422,
    "message_key": "errors.api_lab.invalid_url",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "Environment base URL violates HTTPS/format policy"
  },
  "INVALID_VARIABLE_SCHEMA": {
    "code": "INVALID_VARIABLE_SCHEMA",
    "http": 422,
    "message_key": "errors.api_lab.invalid_variable_schema",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "variable schema key/shape/uniqueness invalid"
  },
  "INVALID_WORKFLOW_NAME": {
    "code": "INVALID_WORKFLOW_NAME",
    "http": 422,
    "message_key": "errors.api_lab.invalid_workflow_name",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "Workflow name invalid"
  },
  "KEY_PROVIDER_UNAVAILABLE": {
    "code": "KEY_PROVIDER_UNAVAILABLE",
    "http": 503,
    "message_key": "errors.api_lab.key_provider_unavailable",
    "retryable": true,
    "retry_after_seconds": 5,
    "recovery_actions": [
      "RESTART_LOGIN"
    ],
    "category": "system",
    "condition": "secret-manager key operation unavailable/timed out; Retry-After required"
  },
  "LATEST_STATE_INVALID": {
    "code": "LATEST_STATE_INVALID",
    "http": 409,
    "message_key": "errors.api_lab.latest_state_invalid",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "latest definition/Environment is not rerunnable"
  },
  "LOGIN_ALREADY_ACTIVE": {
    "code": "LOGIN_ALREADY_ACTIVE",
    "http": 409,
    "message_key": "errors.api_lab.login_already_active",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "login initiation conflicts with active login state"
  },
  "LOGOUT_IN_PROGRESS": {
    "code": "LOGOUT_IN_PROGRESS",
    "http": 409,
    "message_key": "errors.api_lab.logout_in_progress",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "logout already executing for session"
  },
  "MISSING_REQUIRED_VALUE": {
    "code": "MISSING_REQUIRED_VALUE",
    "http": 422,
    "message_key": "errors.api_lab.missing_required_value",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "required Environment value missing"
  },
  "OIDC_CALLBACK_INVALID": {
    "code": "OIDC_CALLBACK_INVALID",
    "http": 400,
    "message_key": "errors.api_lab.oidc_callback_invalid",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "callback parameters/state are malformed"
  },
  "OIDC_CONFIG_INVALID": {
    "code": "OIDC_CONFIG_INVALID",
    "http": 422,
    "message_key": "errors.api_lab.oidc_config_invalid",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "IAM issuer/client/redirect configuration invalid"
  },
  "OIDC_TOKEN_REJECTED": {
    "code": "OIDC_TOKEN_REJECTED",
    "http": 401,
    "message_key": "errors.api_lab.oidc_token_rejected",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "auth",
    "condition": "IAM token exchange/validation rejected identity"
  },
  "POLL_RATE_LIMIT_EXCEEDED": {
    "code": "POLL_RATE_LIMIT_EXCEEDED",
    "http": 429,
    "message_key": "errors.api_lab.poll_rate_limit_exceeded",
    "retryable": true,
    "retry_after_seconds": 5,
    "category": "throttling",
    "condition": "execution polling rate exceeded; Retry-After required"
  },
  "RATE_LIMIT_EXCEEDED": {
    "code": "RATE_LIMIT_EXCEEDED",
    "http": 429,
    "message_key": "errors.api_lab.rate_limit_exceeded",
    "retryable": true,
    "retry_after_seconds": 5,
    "category": "throttling",
    "condition": "actor/route request rate exceeded; Retry-After required"
  },
  "RECOVERY_REVISION_CONFLICT": {
    "code": "RECOVERY_REVISION_CONFLICT",
    "http": 409,
    "message_key": "errors.api_lab.recovery_revision_conflict",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "recovery session revision is stale"
  },
  "REPORT_STALE": {
    "code": "REPORT_STALE",
    "http": 409,
    "message_key": "errors.api_lab.report_stale",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "report does not match current saved version"
  },
  "RESOURCE_NOT_EMPTY": {
    "code": "RESOURCE_NOT_EMPTY",
    "http": 409,
    "message_key": "errors.api_lab.resource_not_empty",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "non-empty resource cannot be removed by command"
  },
  "RESOURCE_OR_PARENT_NOT_FOUND": {
    "code": "RESOURCE_OR_PARENT_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.resource_or_parent_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "command target or parent absent"
  },
  "RESTORE_COLLISION": {
    "code": "RESTORE_COLLISION",
    "http": 422,
    "message_key": "errors.api_lab.restore_collision",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "original tree location/name cannot be restored safely"
  },
  "REVIEW_STALE": {
    "code": "REVIEW_STALE",
    "http": 409,
    "message_key": "errors.api_lab.review_stale",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "recovery review no longer matches current definition"
  },
  "REVISION_CONFLICT": {
    "code": "REVISION_CONFLICT",
    "http": 409,
    "message_key": "errors.api_lab.revision_conflict",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "optimistic revision is stale"
  },
  "SCHEMA_IN_USE": {
    "code": "SCHEMA_IN_USE",
    "http": 409,
    "message_key": "errors.api_lab.schema_in_use",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "schema key removal would orphan Environment values"
  },
  "SERVICE_UNAVAILABLE": {
    "code": "SERVICE_UNAVAILABLE",
    "http": 503,
    "message_key": "errors.api_lab.service_unavailable",
    "retryable": true,
    "retry_after_seconds": 5,
    "recovery_actions": [
      "RESTART_LOGIN"
    ],
    "category": "system",
    "condition": "required dependency, bulkhead or process capacity is transiently unavailable; Retry-After required"
  },
  "SESSION_CLAIMS_INVALID": {
    "code": "SESSION_CLAIMS_INVALID",
    "http": 422,
    "message_key": "errors.api_lab.session_claims_invalid",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "stored actor or MFA claims cannot produce the exact versioned session projection"
  },
  "SESSION_NOT_FOUND": {
    "code": "SESSION_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.session_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "authenticated session record absent"
  },
  "SESSION_STATE_CONFLICT": {
    "code": "SESSION_STATE_CONFLICT",
    "http": 409,
    "message_key": "errors.api_lab.session_state_conflict",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "session projection changed unexpectedly"
  },
  "SESSION_STATE_NOT_FOUND": {
    "code": "SESSION_STATE_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.session_state_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "OIDC callback session state absent/expired"
  },
  "SESSION_STORE_UNAVAILABLE": {
    "code": "SESSION_STORE_UNAVAILABLE",
    "http": 503,
    "message_key": "errors.api_lab.session_store_unavailable",
    "retryable": true,
    "retry_after_seconds": 5,
    "recovery_actions": [
      "RESTART_LOGIN"
    ],
    "category": "system",
    "condition": "server-side session store unavailable; Retry-After required"
  },
  "SNAPSHOT_INVALID": {
    "code": "SNAPSHOT_INVALID",
    "http": 422,
    "message_key": "errors.api_lab.snapshot_invalid",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "immutable run snapshot cannot be created"
  },
  "SOURCE_NOT_RERUNNABLE": {
    "code": "SOURCE_NOT_RERUNNABLE",
    "http": 422,
    "message_key": "errors.api_lab.source_not_rerunnable",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "source Execution type/state cannot rerun"
  },
  "SOURCE_OR_LATEST_DEFINITION_OR_BINDING_NOT_FOUND": {
    "code": "SOURCE_OR_LATEST_DEFINITION_OR_BINDING_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.source_or_latest_definition_or_binding_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "rerun source/latest definition/binding absent"
  },
  "STEP_LIMIT_EXCEEDED": {
    "code": "STEP_LIMIT_EXCEEDED",
    "http": 422,
    "message_key": "errors.api_lab.step_limit_exceeded",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "Workflow has more than 20 Steps"
  },
  "TREE_CYCLE": {
    "code": "TREE_CYCLE",
    "http": 409,
    "message_key": "errors.api_lab.tree_cycle",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "move would create an ancestry cycle"
  },
  "VALIDATION_ERRORS_EXIST": {
    "code": "VALIDATION_ERRORS_EXIST",
    "http": 409,
    "message_key": "errors.api_lab.validation_errors_exist",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "current report contains Error findings"
  },
  "VALIDATION_REPORT_FAILED": {
    "code": "VALIDATION_REPORT_FAILED",
    "http": 500,
    "message_key": "errors.api_lab.validation_report_failed",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "system",
    "condition": "validation report persistence failed"
  },
  "VERSION_NOT_CURRENT": {
    "code": "VERSION_NOT_CURRENT",
    "http": 409,
    "message_key": "errors.api_lab.version_not_current",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "validation target is not current saved version"
  },
  "VERSION_NOT_IN_WORKFLOW": {
    "code": "VERSION_NOT_IN_WORKFLOW",
    "http": 422,
    "message_key": "errors.api_lab.version_not_in_workflow",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "validation",
    "condition": "requested version belongs to another Workflow"
  },
  "VERSION_TRANSACTION_FAILED": {
    "code": "VERSION_TRANSACTION_FAILED",
    "http": 500,
    "message_key": "errors.api_lab.version_transaction_failed",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "system",
    "condition": "immutable version transaction failed"
  },
  "WARNING_ACK_REQUIRED": {
    "code": "WARNING_ACK_REQUIRED",
    "http": 409,
    "message_key": "errors.api_lab.warning_ack_required",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "current report has Warning findings without confirmation"
  },
  "WORKFLOW_CAPACITY_REACHED": {
    "code": "WORKFLOW_CAPACITY_REACHED",
    "http": 429,
    "message_key": "errors.api_lab.workflow_capacity_reached",
    "retryable": true,
    "retry_after_seconds": 5,
    "category": "throttling",
    "condition": "20 Workflow executions already active; Retry-After required"
  },
  "WORKFLOW_NOT_READY": {
    "code": "WORKFLOW_NOT_READY",
    "http": 409,
    "message_key": "errors.api_lab.workflow_not_ready",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Workflow lifecycle blocks run"
  },
  "WORKFLOW_OR_API_VERSION_NOT_FOUND": {
    "code": "WORKFLOW_OR_API_VERSION_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.workflow_or_api_version_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Workflow or referenced API version absent"
  },
  "WORKFLOW_OR_REPORT_NOT_FOUND": {
    "code": "WORKFLOW_OR_REPORT_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.workflow_or_report_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Workflow or validation report absent"
  },
  "WORKFLOW_OR_VERSION_NOT_FOUND": {
    "code": "WORKFLOW_OR_VERSION_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.workflow_or_version_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Workflow or requested version absent"
  },
  "WORKFLOW_REVISION_CONFLICT": {
    "code": "WORKFLOW_REVISION_CONFLICT",
    "http": 409,
    "message_key": "errors.api_lab.workflow_revision_conflict",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Workflow optimistic revision is stale"
  },
  "WORKFLOW_STATE_CONFLICT": {
    "code": "WORKFLOW_STATE_CONFLICT",
    "http": 409,
    "message_key": "errors.api_lab.workflow_state_conflict",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Workflow lifecycle state disallows read/action"
  },
  "WORKFLOW_VERSION_REPORT_OR_BINDING_NOT_FOUND": {
    "code": "WORKFLOW_VERSION_REPORT_OR_BINDING_NOT_FOUND",
    "http": 404,
    "message_key": "errors.api_lab.workflow_version_report_or_binding_not_found",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Workflow version, report or binding absent"
  },
  "WORKSPACE_STATE_CONFLICT": {
    "code": "WORKSPACE_STATE_CONFLICT",
    "http": 409,
    "message_key": "errors.api_lab.workspace_state_conflict",
    "retryable": false,
    "retry_after_seconds": null,
    "category": "business",
    "condition": "Workspace state changed during query/mutation"
  }
} as const

export type ErrorCode = keyof typeof ERROR_METADATA

export const ENDPOINT_ERROR_CODES = {
  "API-001": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED"
    ],
    "404": [
      "HOST_OR_RESOURCE_NOT_FOUND"
    ],
    "409": [
      "HOST_CONTEXT_CONFLICT"
    ],
    "422": [
      "INVALID_QUERY_COMBINATION"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "INTERNAL_ERROR"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-002": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "HOST_NOT_FOUND"
    ],
    "409": [
      "ENVIRONMENT_PRECONDITION_FAILED",
      "IDEMPOTENCY_KEY_REUSED",
      "REVISION_CONFLICT",
      "SCHEMA_IN_USE"
    ],
    "422": [
      "IDEMPOTENCY_RESPONSE_TOO_LARGE",
      "INVALID_TARGET_CIDR_SET",
      "INVALID_URL",
      "INVALID_VARIABLE_SCHEMA",
      "MISSING_REQUIRED_VALUE"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "INTERNAL_ERROR"
    ],
    "503": [
      "KEY_PROVIDER_UNAVAILABLE",
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-003": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED"
    ],
    "404": [
      "HOST_OR_WORKSPACE_NOT_FOUND"
    ],
    "409": [
      "WORKSPACE_STATE_CONFLICT"
    ],
    "422": [
      "INVALID_FIELDS",
      "INVALID_FILTER",
      "INVALID_SORT"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "INTERNAL_ERROR"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-004": {
    "400": [
      "INVALID_COMMAND"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "RESOURCE_OR_PARENT_NOT_FOUND"
    ],
    "409": [
      "DUPLICATE_SIBLING",
      "IDEMPOTENCY_KEY_REUSED",
      "RESOURCE_NOT_EMPTY",
      "REVISION_CONFLICT",
      "TREE_CYCLE"
    ],
    "422": [
      "IDEMPOTENCY_RESPONSE_TOO_LARGE",
      "INVALID_METHOD",
      "INVALID_NAME",
      "INVALID_TARGET"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "INTERNAL_ERROR"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-005": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "API_NOT_FOUND"
    ],
    "409": [
      "API_STATE_CONFLICT",
      "IDEMPOTENCY_KEY_REUSED",
      "IMPACT_TOKEN_INVALID",
      "REVISION_CONFLICT"
    ],
    "422": [
      "API_NOT_DELETABLE",
      "IDEMPOTENCY_RESPONSE_TOO_LARGE"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "DELETE_TRANSACTION_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-006": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "API_TOMBSTONE_NOT_FOUND"
    ],
    "409": [
      "API_STATE_CONFLICT",
      "API_UNDO_WINDOW_EXPIRED",
      "IDEMPOTENCY_KEY_REUSED",
      "REVISION_CONFLICT"
    ],
    "422": [
      "IDEMPOTENCY_RESPONSE_TOO_LARGE",
      "RESTORE_COLLISION"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "API_UNDO_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-007": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "API_OR_HOST_NOT_FOUND"
    ],
    "409": [
      "IDEMPOTENCY_KEY_REUSED",
      "IMPACT_TOKEN_INVALID",
      "IMPACT_TOKEN_REQUIRED",
      "REVISION_CONFLICT"
    ],
    "422": [
      "IDEMPOTENCY_RESPONSE_TOO_LARGE",
      "INVALID_BODY",
      "INVALID_METHOD",
      "INVALID_PATH",
      "INVALID_SENSITIVE_PATH",
      "INVALID_TIMEOUT"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "VERSION_TRANSACTION_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-008": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED"
    ],
    "404": [
      "WORKFLOW_OR_VERSION_NOT_FOUND"
    ],
    "409": [
      "WORKFLOW_STATE_CONFLICT"
    ],
    "422": [
      "VERSION_NOT_IN_WORKFLOW"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "INTERNAL_ERROR"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-009": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "WORKFLOW_OR_API_VERSION_NOT_FOUND"
    ],
    "409": [
      "IDEMPOTENCY_KEY_REUSED",
      "WORKFLOW_REVISION_CONFLICT"
    ],
    "422": [
      "DUPLICATE_STEP_KEY",
      "IDEMPOTENCY_RESPONSE_TOO_LARGE",
      "INVALID_MAPPING",
      "INVALID_RETRY",
      "INVALID_WORKFLOW_NAME",
      "STEP_LIMIT_EXCEEDED"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "VERSION_TRANSACTION_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-010": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "WORKFLOW_OR_VERSION_NOT_FOUND"
    ],
    "409": [
      "RECOVERY_REVISION_CONFLICT",
      "VERSION_NOT_CURRENT"
    ],
    "422": [
      "DEFINITION_SCHEMA_INVALID"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "VALIDATION_REPORT_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-011": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "WORKFLOW_OR_REPORT_NOT_FOUND"
    ],
    "409": [
      "IDEMPOTENCY_KEY_REUSED",
      "REPORT_STALE",
      "REVIEW_STALE",
      "VALIDATION_ERRORS_EXIST",
      "WARNING_ACK_REQUIRED"
    ],
    "422": [
      "IDEMPOTENCY_RESPONSE_TOO_LARGE",
      "INVALID_LIFECYCLE_TRANSITION"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "ENABLE_TRANSACTION_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-012": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "API_VERSION_OR_BINDING_NOT_FOUND"
    ],
    "409": [
      "API_NOT_ACTIVE",
      "ENVIRONMENT_INCOMPLETE",
      "ENVIRONMENT_REVISION_CONFLICT",
      "HOST_INACTIVE",
      "IDEMPOTENCY_KEY_REUSED"
    ],
    "422": [
      "API_DEFINITION_INVALID",
      "IDEMPOTENCY_RESPONSE_TOO_LARGE"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "ADMISSION_TRANSACTION_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-013": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "WORKFLOW_VERSION_REPORT_OR_BINDING_NOT_FOUND"
    ],
    "409": [
      "ENVIRONMENT_REVISION_CONFLICT",
      "HOST_INACTIVE",
      "IDEMPOTENCY_KEY_REUSED",
      "REPORT_STALE",
      "WARNING_ACK_REQUIRED",
      "WORKFLOW_NOT_READY"
    ],
    "422": [
      "IDEMPOTENCY_RESPONSE_TOO_LARGE",
      "SNAPSHOT_INVALID"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED",
      "WORKFLOW_CAPACITY_REACHED"
    ],
    "500": [
      "ADMISSION_TRANSACTION_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-014": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED"
    ],
    "404": [
      "EXECUTION_NOT_FOUND_OR_EXPIRED"
    ],
    "409": [
      "EXECUTION_PROJECTION_CONFLICT"
    ],
    "422": [
      "INVALID_INCLUDE"
    ],
    "429": [
      "POLL_RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "INTERNAL_ERROR"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-015": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED"
    ],
    "404": [
      "HOST_NOT_FOUND"
    ],
    "409": [
      "HISTORY_QUERY_CONFLICT"
    ],
    "422": [
      "INVALID_DATE_RANGE",
      "INVALID_FIELDS",
      "INVALID_FILTER",
      "INVALID_PAGE",
      "INVALID_SORT"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "INTERNAL_ERROR"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-016": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "SOURCE_OR_LATEST_DEFINITION_OR_BINDING_NOT_FOUND"
    ],
    "409": [
      "IDEMPOTENCY_KEY_REUSED",
      "LATEST_STATE_INVALID",
      "WARNING_ACK_REQUIRED"
    ],
    "422": [
      "IDEMPOTENCY_RESPONSE_TOO_LARGE",
      "SOURCE_NOT_RERUNNABLE"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED",
      "WORKFLOW_CAPACITY_REACHED"
    ],
    "500": [
      "ADMISSION_TRANSACTION_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-017": {
    "400": [
      "INVALID_RETURN_URL"
    ],
    "403": [
      "ACCESS_DENIED"
    ],
    "409": [
      "LOGIN_ALREADY_ACTIVE"
    ],
    "422": [
      "OIDC_CONFIG_INVALID"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "INTERNAL_ERROR"
    ],
    "503": [
      "KEY_PROVIDER_UNAVAILABLE",
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-018": {
    "400": [
      "OIDC_CALLBACK_INVALID"
    ],
    "401": [
      "OIDC_TOKEN_REJECTED"
    ],
    "403": [
      "ACCESS_DENIED"
    ],
    "404": [
      "SESSION_STATE_NOT_FOUND"
    ],
    "409": [
      "CALLBACK_REPLAYED"
    ],
    "422": [
      "CLAIM_MAPPING_INVALID"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "INTERNAL_ERROR"
    ],
    "503": [
      "KEY_PROVIDER_UNAVAILABLE",
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-019": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "CSRF_INVALID"
    ],
    "409": [],
    "422": [
      "GLOBAL_LOGOUT_UNSUPPORTED"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "INTERNAL_ERROR"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-020": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED"
    ],
    "409": [
      "SESSION_STATE_CONFLICT"
    ],
    "422": [
      "SESSION_CLAIMS_INVALID"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "INTERNAL_ERROR"
    ],
    "503": [
      "KEY_PROVIDER_UNAVAILABLE",
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-021": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "HOST_NOT_FOUND"
    ],
    "409": [
      "REVISION_CONFLICT"
    ],
    "422": [
      "INVALID_HOST_TRANSITION"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "IMPACT_SCAN_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-022": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "HOST_NOT_FOUND"
    ],
    "409": [
      "IDEMPOTENCY_KEY_REUSED",
      "IMPACT_TOKEN_INVALID",
      "IMPACT_TOKEN_REQUIRED",
      "REVISION_CONFLICT"
    ],
    "422": [
      "IDEMPOTENCY_RESPONSE_TOO_LARGE",
      "INVALID_HOST_TRANSITION"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "HOST_TRANSITION_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  },
  "API-023": {
    "400": [
      "INVALID_REQUEST"
    ],
    "401": [
      "AUTH_REQUIRED"
    ],
    "403": [
      "ACCESS_DENIED",
      "CSRF_INVALID"
    ],
    "404": [
      "HOST_OR_ENVIRONMENT_NOT_FOUND"
    ],
    "409": [
      "IDEMPOTENCY_KEY_REUSED",
      "REVISION_CONFLICT"
    ],
    "422": [
      "IDEMPOTENCY_RESPONSE_TOO_LARGE"
    ],
    "429": [
      "RATE_LIMIT_EXCEEDED"
    ],
    "500": [
      "ENVIRONMENT_DELETE_FAILED"
    ],
    "503": [
      "SERVICE_UNAVAILABLE",
      "SESSION_STORE_UNAVAILABLE"
    ]
  }
} as const
