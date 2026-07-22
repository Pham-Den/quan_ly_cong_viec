import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Sprint: v1 | Feature: NFR-008/PR-008 | Task Group: 03B Runtime composition
// Contract: PR-008, NFR-008 | Pack: v1.7.21-oidc-session-error-contracts

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Test harnesses may point Vite at an explicit empty directory so protected local env files are never loaded.
  envDir: process.env.VITE_ENV_DIR || undefined,
  // Sprint v1 internal-only baseline: the existing Ant Design/Vue Flow shell is accepted up to 1.75 MiB.
  // TG-29 owns route-level splitting before external/public/commercial deployment.
  build: { chunkSizeWarningLimit: 1_750 },
})
