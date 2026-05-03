# Analytics Pipeline

This project includes a conservative Python, SQLite, CSV, JSON, and Excel-compatible export path next to the React/Vite dashboard.

## What It Does

1. Reads `src/data/accounts.json`.
2. Rebuilds a local SQLite database with `analytics/schema.sql`.
3. Stores accounts and downtime pain points in normalized tables.
4. Runs SQL scoring in `analytics/queries/account_scores.sql`.
5. Stores scored account rows in SQLite for summary queries.
6. Writes dashboard-ready CSV and JSON files to `public/analytics/`.
7. Writes an Excel-compatible SpreadsheetML workbook to `public/analytics/installed_base_analytics_workbook.xml`.

## Commands

```bash
npm run analytics:export
npm run analytics:test
```

The implementation uses only the Python standard library. No `xlsx` package is required because the workbook is XML that Excel can open directly.

## SQL Files

- `analytics/schema.sql` defines the account, pain point, and scored output tables.
- `analytics/queries/account_scores.sql` computes account priority, component scores, segment, opportunity type, and next action.
- `analytics/queries/summary_by_segment.sql` aggregates opportunity and risk by segment.
- `analytics/queries/summary_by_region.sql` aggregates opportunity and priority by region.
- `analytics/queries/summary_by_opportunity.sql` groups accounts by opportunity type.

## Static Hosting

Outputs in `public/analytics/` are regular static assets. Vite copies them into `dist/analytics/` during build, and the GitHub Pages workflow runs `npm run analytics:export` before `npm run build`.
