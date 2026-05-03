from __future__ import annotations

import argparse
import csv
import html
import json
import sqlite3
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "src" / "data" / "accounts.json"
DEFAULT_DB = ROOT / "analytics" / "output" / "installed_base.sqlite"
DEFAULT_PUBLIC_DIR = ROOT / "public" / "analytics"

ACCOUNT_COLUMNS = [
    "accountId",
    "accountName",
    "industrySegment",
    "region",
    "plantType",
    "productionLines",
    "installedPlcFamily",
    "installedHmiScadaSystem",
    "driveMotorCount",
    "sensorCount",
    "safetySystemAge",
    "assetLifecycleStage",
    "supportRisk",
    "modernizationInterest",
    "estimatedAnnualDowntimeCost",
    "serviceHistory",
    "decisionMakerPersona",
    "strategicFit",
    "estimatedOpportunitySize",
    "likelyBuyingTrigger",
    "recommendedNextAction",
    "lastEngagementDate",
    "installedBaseConfidence",
    "competitorPresence",
    "dataAvailability",
    "urgencyNotes",
]

ACCOUNT_INSERT_SQL = """
INSERT INTO accounts (
  account_id,
  account_name,
  industry_segment,
  region,
  plant_type,
  production_lines,
  installed_plc_family,
  installed_hmi_scada_system,
  drive_motor_count,
  sensor_count,
  safety_system_age,
  asset_lifecycle_stage,
  support_risk,
  modernization_interest,
  estimated_annual_downtime_cost,
  service_history,
  decision_maker_persona,
  strategic_fit,
  estimated_opportunity_size,
  likely_buying_trigger,
  recommended_next_action,
  last_engagement_date,
  installed_base_confidence,
  competitor_presence,
  data_availability,
  urgency_notes
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""

SCORED_COLUMNS = [
    "rank",
    "account_id",
    "account_name",
    "industry_segment",
    "region",
    "plant_type",
    "estimated_opportunity_size",
    "estimated_annual_downtime_cost",
    "priority_score",
    "priority_label",
    "lifecycle_risk_score",
    "lifecycle_risk_label",
    "installed_base_complexity_score",
    "installed_base_complexity_label",
    "modernization_fit_score",
    "modernization_fit_label",
    "service_urgency_score",
    "service_urgency_label",
    "data_readiness_score",
    "data_readiness_label",
    "sales_readiness_score",
    "sales_readiness_label",
    "confidence_level",
    "priority_segment",
    "segment_reason",
    "opportunity_type",
    "next_best_action",
]


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Build SQLite analytics outputs for the static dashboard.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--public-dir", type=Path, default=DEFAULT_PUBLIC_DIR)
    args = parser.parse_args(argv)

    result = run_pipeline(args.input, args.db, args.public_dir)
    print(
        "Generated {account_count} scored accounts, {segment_count} segment summaries, and {region_count} region summaries in {output_dir}".format(
            **result
        )
    )


def run_pipeline(input_path: Path = DEFAULT_INPUT, db_path: Path = DEFAULT_DB, public_dir: Path = DEFAULT_PUBLIC_DIR) -> dict[str, Any]:
    accounts = load_accounts(input_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    public_dir.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(db_path) as connection:
        connection.row_factory = sqlite3.Row
        apply_schema(connection)
        insert_accounts(connection, accounts)
        scored_accounts = score_accounts(connection)
        replace_scored_accounts(connection, scored_accounts)
        segment_summary = read_query(connection, "summary_by_segment.sql")
        region_summary = read_query(connection, "summary_by_region.sql")
        opportunity_summary = read_query(connection, "summary_by_opportunity.sql")

    write_json(public_dir / "account_scores.json", scored_accounts)
    write_csv(public_dir / "account_scores.csv", scored_accounts)
    write_csv(public_dir / "segment_summary.csv", segment_summary)
    write_csv(public_dir / "region_summary.csv", region_summary)
    write_json(
        public_dir / "opportunity_summary.json",
        {
            "totalAccounts": len(scored_accounts),
            "totalEstimatedOpportunity": sum(row["estimated_opportunity_size"] for row in scored_accounts),
            "totalEstimatedDowntimeCost": sum(row["estimated_annual_downtime_cost"] for row in scored_accounts),
            "segmentSummary": segment_summary,
            "regionSummary": region_summary,
            "opportunityTypeSummary": opportunity_summary,
            "topAccounts": scored_accounts[:10],
        },
    )
    write_excel_xml(
        public_dir / "installed_base_analytics_workbook.xml",
        {
            "Account Scores": scored_accounts,
            "Segment Summary": segment_summary,
            "Region Summary": region_summary,
            "Opportunity Summary": opportunity_summary,
        },
    )

    return {
        "account_count": len(scored_accounts),
        "segment_count": len(segment_summary),
        "region_count": len(region_summary),
        "output_dir": public_dir,
    }


def load_accounts(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as file:
        accounts = json.load(file)

    if not isinstance(accounts, list):
        raise ValueError("Expected account input to be a JSON list.")

    missing: list[str] = []
    for index, account in enumerate(accounts, start=1):
        for column in ACCOUNT_COLUMNS:
            if column not in account:
                missing.append(f"row {index}: {column}")
    if missing:
        raise ValueError("Missing required account fields: " + ", ".join(missing))

    return accounts


def apply_schema(connection: sqlite3.Connection) -> None:
    connection.executescript((ROOT / "analytics" / "schema.sql").read_text(encoding="utf-8"))


def insert_accounts(connection: sqlite3.Connection, accounts: Iterable[dict[str, Any]]) -> None:
    for account in accounts:
        connection.execute(
            ACCOUNT_INSERT_SQL,
            (
                account["accountId"],
                account["accountName"],
                account["industrySegment"],
                account["region"],
                account["plantType"],
                account["productionLines"],
                account["installedPlcFamily"],
                account["installedHmiScadaSystem"],
                account["driveMotorCount"],
                account["sensorCount"],
                account["safetySystemAge"],
                account["assetLifecycleStage"],
                account["supportRisk"],
                account["modernizationInterest"],
                account["estimatedAnnualDowntimeCost"],
                account["serviceHistory"],
                account["decisionMakerPersona"],
                account["strategicFit"],
                account["estimatedOpportunitySize"],
                account["likelyBuyingTrigger"],
                account["recommendedNextAction"],
                account["lastEngagementDate"],
                account["installedBaseConfidence"],
                account["competitorPresence"],
                account["dataAvailability"],
                account["urgencyNotes"],
            ),
        )
        for pain_point in account["downtimePainPoints"]:
            connection.execute(
                "INSERT INTO downtime_pain_points (account_id, pain_point) VALUES (?, ?)",
                (account["accountId"], pain_point),
            )


def score_accounts(connection: sqlite3.Connection) -> list[dict[str, Any]]:
    return read_query(connection, "account_scores.sql")


def replace_scored_accounts(connection: sqlite3.Connection, rows: list[dict[str, Any]]) -> None:
    placeholders = ", ".join("?" for _ in SCORED_COLUMNS)
    sql = f"INSERT INTO scored_accounts ({', '.join(SCORED_COLUMNS)}) VALUES ({placeholders})"
    connection.executemany(sql, ([row[column] for column in SCORED_COLUMNS] for row in rows))


def read_query(connection: sqlite3.Connection, name: str) -> list[dict[str, Any]]:
    query = (ROOT / "analytics" / "queries" / name).read_text(encoding="utf-8")
    cursor = connection.execute(query)
    return [dict(row) for row in cursor.fetchall()]


def write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8")
        return

    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def write_excel_xml(path: Path, sheets: dict[str, list[dict[str, Any]]]) -> None:
    workbook = [
        '<?xml version="1.0"?>',
        '<?mso-application progid="Excel.Sheet"?>',
        '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
        ' xmlns:o="urn:schemas-microsoft-com:office:office"',
        ' xmlns:x="urn:schemas-microsoft-com:office:excel"',
        ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"',
        ' xmlns:html="http://www.w3.org/TR/REC-html40">',
    ]

    for sheet_name, rows in sheets.items():
        workbook.append(f'  <Worksheet ss:Name="{xml_escape(sheet_name[:31])}">')
        workbook.append("    <Table>")
        if rows:
            columns = list(rows[0].keys())
            workbook.append("      <Row>")
            for column in columns:
                workbook.append(f'        <Cell><Data ss:Type="String">{xml_escape(column)}</Data></Cell>')
            workbook.append("      </Row>")
            for row in rows:
                workbook.append("      <Row>")
                for column in columns:
                    value = row[column]
                    cell_type = "Number" if isinstance(value, int | float) and not isinstance(value, bool) else "String"
                    workbook.append(f'        <Cell><Data ss:Type="{cell_type}">{xml_escape(str(value))}</Data></Cell>')
                workbook.append("      </Row>")
        workbook.append("    </Table>")
        workbook.append("  </Worksheet>")

    workbook.append("</Workbook>")
    path.write_text("\n".join(workbook) + "\n", encoding="utf-8")


def xml_escape(value: str) -> str:
    return html.escape(value, quote=True)


if __name__ == "__main__":
    main()
