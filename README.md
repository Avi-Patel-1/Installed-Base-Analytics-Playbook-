# Installed-Base Analytics & Technical Consulting Playbook

An interactive static web project for ranking manufacturing accounts by installed equipment, lifecycle risk, service opportunity, automation upgrade fit, data readiness, and customer-facing next steps.

The first screen is the working prioritization dashboard. From there, users can inspect account detail, import CSV data, generate account playbooks, and export reports.

## Live Demo

https://avi-patel-1.github.io/Installed-Base-Analytics-Playbook-/

## Quickstart

```bash
npm install
npm run dev
npm run test
npm run build
npm run preview
```

## Workflow

1. Review the dashboard KPIs, segment charts, priority matrix, and ranked account table.
2. Filter by industry, region, risk, confidence, segment, opportunity type, or search text.
3. Open an account detail view to inspect installed PLC, HMI/SCADA, drives, safety, sensors, risk indicators, triggered scoring rules, and recommended actions.
4. Generate a customer engagement playbook for the selected account.
5. Edit the playbook sections, print the view, copy discovery questions, or export Markdown/HTML.
6. Import a CSV to replace the built-in sample dataset or restore the sample data.
7. Export ranking CSV, filtered CSV, opportunity summary JSON, scoring explanation JSON, and playbook files.

## Scoring And Recommendations

The scoring engine produces:

- Lifecycle risk score
- Installed-base complexity score
- Modernization fit score
- Service urgency score
- Data readiness score
- Sales readiness score
- Technical consulting priority score
- Confidence level
- Recommended opportunity type
- Next-best action

Each score includes a numeric value, label, short rationale, triggered rules, and improvement levers. Recommendation rules map account facts to practical consulting moves such as controls modernization discovery, drive health review, HMI/SCADA standardization, safety lifecycle review, simulation workshop, short-cycle service scope, analytics and edge monitoring, or assessment workshop.

## CSV Upload Format

Use the built-in sample CSV as the template. Required columns are listed in `docs/data_dictionary.md`. Multi-value downtime pain points should be separated with semicolons in one cell.

The importer validates required columns, numeric fields, allowed category values, and date formatting. Import errors are displayed in the Data Import screen before replacing the active dataset.

## Outputs

The app exports:

- Account ranking CSV
- Filtered account table CSV
- Selected account playbook as Markdown
- Selected account playbook as HTML
- Opportunity summary JSON
- Scoring explanation JSON
- Customer discovery questions copied to clipboard

Example exports are included in `examples/`.

## Static Deployment

This project is designed for static hosting. GitHub Pages deployment is configured in `.github/workflows/deploy.yml`.

For repository Pages, the Vite base path defaults to a relative base. If your hosting target needs a fixed base path, set `VITE_BASE_PATH` before build:

```bash
VITE_BASE_PATH="/repository-name/" npm run build
```

See `docs/deployment.md` for full deployment notes.

## Documentation

- `docs/methodology.md`
- `docs/scoring_model.md`
- `docs/data_dictionary.md`
- `docs/recommendation_rules.md`
- `docs/playbook_format.md`
- `docs/deployment.md`
- `docs/example_playbook.md`
