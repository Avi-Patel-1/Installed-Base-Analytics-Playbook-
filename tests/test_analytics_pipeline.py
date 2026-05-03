from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from analytics.pipeline import DEFAULT_INPUT, load_accounts, run_pipeline


class AnalyticsPipelineTest(unittest.TestCase):
    def test_load_accounts_reads_sample_data(self) -> None:
        accounts = load_accounts(DEFAULT_INPUT)

        self.assertGreaterEqual(len(accounts), 10)
        self.assertIn("accountId", accounts[0])
        self.assertIn("estimatedOpportunitySize", accounts[0])

    def test_pipeline_generates_static_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            result = run_pipeline(DEFAULT_INPUT, root / "analytics.sqlite", root / "public")

            self.assertEqual(result["account_count"], len(json.loads((root / "public" / "account_scores.json").read_text())))
            self.assertGreater(result["segment_count"], 0)
            self.assertTrue((root / "public" / "account_scores.csv").exists())
            self.assertTrue((root / "public" / "opportunity_summary.json").exists())
            self.assertTrue((root / "public" / "installed_base_analytics_workbook.xml").exists())


if __name__ == "__main__":
    unittest.main()
