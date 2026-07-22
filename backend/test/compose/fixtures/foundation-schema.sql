-- Sprint: v1 | Feature: NFR-004/NFR-010 | Task Group: 03C CODE-10 harness
-- Contract: ENT-022/023, CODE-10 | Pack: v1.7.21-oidc-session-error-contracts
-- Minimal, synthetic TG-02/TG-03C runtime schema. The full application schema is
-- intentionally outside this focused foundation self-test.
USE `quan_ly_cong_viec_foundation`;

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
  UNIQUE INDEX `uq_ols_state_hash` (`state_sha256`),
  INDEX `ix_ols_expiry` (`expires_at`, `consumed_at`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  UNIQUE INDEX `uq_as_token` (`session_token_sha256`),
  INDEX `ix_as_subject_active` (`subject_id`, `invalidated_at`, `absolute_expires_at`),
  INDEX `ix_as_expiry` (`absolute_expires_at`, `invalidated_at`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Project` (
  `id` VARCHAR(191) NOT NULL,
  `ownerId` VARCHAR(191) NULL,
  `defaultRepoId` VARCHAR(191) NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `nextTaskNumber` INTEGER NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Project_code_key` (`code`),
  INDEX `Project_ownerId_idx` (`ownerId`),
  INDEX `Project_defaultRepoId_idx` (`defaultRepoId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Project` (`id`, `ownerId`, `code`, `name`)
VALUES ('project-foundation', 'actor-foundation', 'FOUNDATION', 'Foundation self-test');
