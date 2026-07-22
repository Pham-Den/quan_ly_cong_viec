-- Sprint: v1 | Feature: NFR-004/NFR-010 | Task Group: 02 Identity persistence
-- Contract: ENT-022/023, PR-001 | Pack: v1.7.21-oidc-session-error-contracts
-- MySQL enforces storage shape; repository transactions enforce lifecycle transitions.
CREATE TABLE `oidc_login_states` (
  `id` CHAR(36) NOT NULL,
  `state_sha256` BINARY(32) NOT NULL,
  `nonce_sha256` BINARY(32) NOT NULL,
  `pkce_verifier_ciphertext` VARBINARY(1024) NOT NULL,
  `pkce_verifier_nonce` BINARY(12) NOT NULL,
  `pkce_verifier_tag` BINARY(16) NOT NULL,
  `pkce_verifier_key_id` VARCHAR(128) NOT NULL,
  `return_to` VARCHAR(2048) NOT NULL,
  `created_at` DATETIME(3) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `consumed_at` DATETIME(3) NULL,
  CONSTRAINT `ck_ols_expiry` CHECK (`expires_at` > `created_at`),
  UNIQUE INDEX `uq_ols_state_hash` (`state_sha256`),
  INDEX `ix_ols_expiry` (`expires_at`, `consumed_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

CREATE TABLE `auth_sessions` (
  `id` CHAR(36) NOT NULL,
  `session_token_sha256` BINARY(32) NOT NULL,
  `subject_id` VARCHAR(191) NOT NULL,
  `actor_projection_json` JSON NOT NULL,
  `mfa_assurance_json` JSON NOT NULL,
  `csrf_token_sha256` BINARY(32) NOT NULL,
  `csrf_token_ciphertext` VARBINARY(1024) NOT NULL,
  `csrf_token_nonce` BINARY(12) NOT NULL,
  `csrf_token_tag` BINARY(16) NOT NULL,
  `csrf_token_key_id` VARCHAR(128) NOT NULL,
  `absolute_expires_at` DATETIME(3) NOT NULL,
  `last_activity_at` DATETIME(3) NOT NULL,
  `invalidated_at` DATETIME(3) NULL,
  `invalidation_reason` VARCHAR(32) NULL,
  `revision` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL,
  CONSTRAINT `ck_as_expiry` CHECK (`absolute_expires_at` > `created_at`),
  CONSTRAINT `ck_as_actor_json` CHECK (JSON_TYPE(`actor_projection_json`) = 'OBJECT'),
  CONSTRAINT `ck_as_mfa_json` CHECK (JSON_TYPE(`mfa_assurance_json`) = 'OBJECT'),
  CONSTRAINT `ck_as_invalidation` CHECK (
    (`invalidated_at` IS NULL AND `invalidation_reason` IS NULL) OR
    (`invalidated_at` IS NOT NULL AND `invalidation_reason` IN ('LOGOUT','IDLE_TIMEOUT','ABSOLUTE_EXPIRY','IAM_REVOKED'))
  ),
  UNIQUE INDEX `uq_as_token` (`session_token_sha256`),
  INDEX `ix_as_subject_active` (`subject_id`, `invalidated_at`, `absolute_expires_at`),
  INDEX `ix_as_expiry` (`absolute_expires_at`, `invalidated_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;
