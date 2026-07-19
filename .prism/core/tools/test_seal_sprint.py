"""Focused regressions for seal_sprint diagnostics."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SEAL_SPRINT = Path(__file__).with_name("seal_sprint.py")


class PackScopedOverlapCheckTest(unittest.TestCase):
    @staticmethod
    def _add_plan_pack(root: Path, pack_id: str) -> Path:
        pack_dir = root / "docs" / "sprint-v1" / "changes" / pack_id
        pack_dir.mkdir(parents=True)
        (pack_dir / "change-request.md").write_text(
            "---\nstatus: DRAFT\n---\n# Change request\n",
            encoding="utf-8",
        )
        (pack_dir / f"plan-delta-{pack_id}.md").write_text(
            "# Plan-only delta\n",
            encoding="utf-8",
        )
        return pack_dir

    @staticmethod
    def _add_updated_delta(pack_dir: Path, anchor_id: str) -> None:
        pack_id = pack_dir.name
        (pack_dir / f"product-delta-{pack_id}.md").write_text(
            "---\nstatus: DRAFT\nphase: product\n---\n"
            "# Product delta\n\n## New\n\n## Updated\n\n"
            f"<!-- ID: {anchor_id} -->\n### {anchor_id}: Updated\n\n"
            "Final state.\n\n## Removed\n",
            encoding="utf-8",
        )

    @staticmethod
    def _run(root: Path, selector: str | None) -> subprocess.CompletedProcess[str]:
        command = [
            sys.executable,
            str(SEAL_SPRINT),
            "--sprint",
            "v1",
            "--project-root",
            str(root),
            "--check-overlaps-only",
        ]
        if selector is not None:
            command.extend(["--pack", selector])
        return subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
        )

    def test_plan_only_pack_is_resolved_by_full_id_version_and_slug(self) -> None:
        """VERIFIES: BUG-001 — identity must not depend on mergeable deltas."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pack_id = "v1.7.20-canonical-task-group-headings"
            self._add_plan_pack(root, pack_id)

            for selector in (pack_id, "v1.7.20", "canonical-task-group-headings"):
                with self.subTest(selector=selector):
                    result = self._run(root, selector)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertIn("No same-sprint cross-source change collisions", result.stdout)
                    self.assertIn(selector, result.stdout)

    def test_plan_only_pack_ignores_an_unrelated_collision(self) -> None:
        """VERIFIES: BUG-001 — scoped filtering uses the resolved full pack id."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            target = "v1.7.20-plan-only"
            self._add_plan_pack(root, target)
            left = self._add_plan_pack(root, "v1.7.18-left")
            right = self._add_plan_pack(root, "v1.7.19-right")
            self._add_updated_delta(left, "BR-100")
            self._add_updated_delta(right, "BR-100")

            scoped = self._run(root, target)
            unscoped = self._run(root, None)

        self.assertEqual(scoped.returncode, 0, scoped.stderr)
        self.assertEqual(unscoped.returncode, 1, unscoped.stdout)
        self.assertIn("BR-100", unscoped.stderr)

    def test_pack_participating_in_collision_is_still_reported(self) -> None:
        """VERIFIES: BUG-001 — directory resolution must not weaken collision gates."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            left = self._add_plan_pack(root, "v1.7.18-left")
            right = self._add_plan_pack(root, "v1.7.19-right")
            self._add_updated_delta(left, "BR-100")
            self._add_updated_delta(right, "BR-100")

            result = self._run(root, right.name)

        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("BR-100", result.stderr)

    def test_ambiguous_slug_and_version_are_rejected(self) -> None:
        """VERIFIES: BUG-001 — existing ambiguity protection remains intact."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for pack_id in (
                "v1.7.21-shared",
                "v1.7.22-shared",
                "v1.8.0-alpha",
                "v1.8.0-beta",
            ):
                self._add_plan_pack(root, pack_id)

            slug_result = self._run(root, "shared")
            version_result = self._run(root, "v1.8.0")

        self.assertEqual(slug_result.returncode, 2)
        self.assertIn("ambiguous", slug_result.stderr)
        self.assertEqual(version_result.returncode, 2)
        self.assertIn("ambiguous", version_result.stderr)

    def test_missing_pack_is_rejected(self) -> None:
        """VERIFIES: BUG-001 — typo protection remains intact."""
        with tempfile.TemporaryDirectory() as tmp:
            result = self._run(Path(tmp), "v1.9.9-missing")

        self.assertEqual(result.returncode, 2)
        self.assertIn("matched no change pack", result.stderr)


if __name__ == "__main__":
    unittest.main()
