import { copyFileSync, symlinkSync } from 'node:fs'

/**
 * Cross-platform "make <dest> reflect <target>" helpers.
 *
 * POSIX (macOS/Linux): symlinks — cheap, and edits to the source show through live.
 * Windows: per-file symlinks need elevated privilege (Developer Mode / admin) which we can't
 * assume, so we COPY files instead; directories use a JUNCTION (no privilege needed, same volume).
 *
 * Read the mode at call time (not import time) so tests can toggle `DOCS_VIEW_COPY`.
 */

/** True when files should be copied instead of symlinked (Windows, or forced via env for tests). */
export function copyMode() {
  return process.platform === 'win32' || process.env.DOCS_VIEW_COPY === '1'
}

/** Make `dest` a file reflecting `target`: symlink on POSIX, copy on Windows. */
export function linkFile(target, dest) {
  if (copyMode()) copyFileSync(target, dest)
  else symlinkSync(target, dest, 'file')
}

/**
 * Make `dest` point at directory `target`: symlink on POSIX; on Windows a junction (no privilege,
 * but both must be on the SAME volume), falling back to a real dir symlink (Developer Mode), then a
 * clear, actionable error. We never COPY a directory here — `node_modules` would be huge.
 */
export function linkDir(target, dest) {
  if (process.platform !== 'win32') {
    symlinkSync(target, dest, 'dir')
    return
  }
  try {
    symlinkSync(target, dest, 'junction')
  } catch (errJunction) {
    try {
      symlinkSync(target, dest, 'dir')
    } catch {
      const code = errJunction.code || errJunction.message
      throw new Error(
        `cannot link "${dest}" -> "${target}" on Windows (${code}). A junction needs both paths on ` +
          'the SAME drive. Set DOCS_VIEW_RUNTIME_DIR to a folder on the same drive as docs-viewer, ' +
          'or enable Windows Developer Mode (which permits symlinks).',
      )
    }
  }
}
