"""Focused regressions for candidate-pack source filtering."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from validate_living_truth import candidate_pack_mergeable_deltas


class CandidatePackDeltaFilterTest(unittest.TestCase):
    def test_mixed_pack_excludes_plan_absorption(self) -> None:
        """VERIFIES: BUG-002 — Plan deltas never enter proposal validation."""
        with tempfile.TemporaryDirectory() as tmp:
            pack_dir = Path(tmp)
            for name in (
                "architecture-delta-v1.7.21-example.md",
                "testing-delta-v1.7.21-example.md",
                "plan-delta-v1.7.21-example.md",
                "plan-delta-v1.7.21-example.txt",
                "notes-delta-v1.7.21-example.md",
            ):
                (pack_dir / name).write_text(name, encoding="utf-8")

            selected = [path.name for path in candidate_pack_mergeable_deltas(pack_dir)]

        self.assertEqual(
            selected,
            [
                "architecture-delta-v1.7.21-example.md",
                "testing-delta-v1.7.21-example.md",
            ],
        )

    def test_all_mergeable_phase_prefixes_are_retained(self) -> None:
        """VERIFIES: BUG-002 — filtering cannot drop a valid candidate phase."""
        with tempfile.TemporaryDirectory() as tmp:
            pack_dir = Path(tmp)
            expected = [
                "architecture-delta-v1.7.21-example.md",
                "design-delta-v1.7.21-example.md",
                "product-delta-v1.7.21-example.md",
                "testing-delta-v1.7.21-example.md",
            ]
            for name in reversed(expected):
                (pack_dir / name).write_text(name, encoding="utf-8")

            selected = [path.name for path in candidate_pack_mergeable_deltas(pack_dir)]

        self.assertEqual(selected, expected)


if __name__ == "__main__":
    unittest.main()
