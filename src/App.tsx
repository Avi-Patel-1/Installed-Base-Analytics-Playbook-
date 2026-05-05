import { useMemo, useState } from 'react'
import { MatrixChart, BarList, DistributionChart } from './charts/SimpleCharts'
import { sampleAccounts } from './data/accounts'
import { segmentDefinitions } from './data/segments'
import {
  filteredAccountCsv,
  opportunitySummaryJson,
  playbookToHtml,
  playbookToMarkdown,
  rankingCsv,
  scoringExplanationJson,
} from './export/exporters'
import { generatePlaybook } from './playbook/generator'
import { recommendationRules } from './recommendations/rules'
import { scoreAccounts } from './scoring/scoring'
import type { Account, Playbook, ScoredAccount, ScoreDetail } from './types'
import { accountsToCsv, parseAccountsCsv, sampleCsv } from './utils/csv'
import { formatCompactCurrency, formatCurrency, formatPercent } from './utils/format'

type Screen = 'dashboard' | 'detail' | 'playbook' | 'import' | 'flow' | 'methodology' | 'reports'
type SortKey = 'priority' | 'opportunity' | 'risk' | 'readiness' | 'name'

interface Filters {
  search: string
  industry: string
  region: string
  segment: string
  risk: string
  opportunityType: string
  confidence: string
  sortKey: SortKey
}

const emptyFilters: Filters = {
  search: '',
  industry: 'All',
  region: 'All',
  segment: 'All',
  risk: 'All',
  opportunityType: 'All',
  confidence: 'All',
  sortKey: 'priority',
}

const riskColors = [
  { label: 'Critical', color: '#bd3f32' },
  { label: 'High', color: '#d9802f' },
  { label: 'Moderate', color: '#d2a329' },
  { label: 'Low', color: '#247c8f' },
]

function App() {
  const [accounts, setAccounts] = useState<Account[]>(sampleAccounts)
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [selectedAccountId, setSelectedAccountId] = useState(sampleAccounts[0].accountId)
  const [importMessage, setImportMessage] = useState('Built-in sample data is loaded.')
  const [csvText, setCsvText] = useState('')
  const [editedPlaybooks, setEditedPlaybooks] = useState<Record<string, Record<string, string>>>({})

  const scoredAccounts = useMemo(() => scoreAccounts(accounts), [accounts])
  const filteredAccounts = useMemo(() => applyFilters(scoredAccounts, filters), [scoredAccounts, filters])
  const selectedScored = useMemo(
    () => scoredAccounts.find((scored) => scored.account.accountId === selectedAccountId) ?? scoredAccounts[0],
    [scoredAccounts, selectedAccountId],
  )
  const playbook = useMemo(() => generatePlaybook(selectedScored), [selectedScored])
  const editedPlaybook = useMemo(
    () => mergeEditedPlaybook(playbook, editedPlaybooks[selectedScored.account.accountId]),
    [editedPlaybooks, playbook, selectedScored.account.accountId],
  )
  const kpis = useMemo(() => buildKpis(scoredAccounts), [scoredAccounts])

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function openAccount(accountId: string) {
    setSelectedAccountId(accountId)
    setScreen('detail')
  }

  function updateEditedSection(title: string, body: string) {
    setEditedPlaybooks((current) => ({
      ...current,
      [selectedScored.account.accountId]: {
        ...current[selectedScored.account.accountId],
        [title]: body,
      },
    }))
  }

  function handleCsvTextImport() {
    const result = parseAccountsCsv(csvText)
    if (result.errors.length > 0) {
      setImportMessage(result.errors.join(' '))
      return
    }

    setAccounts(result.accounts)
    setSelectedAccountId(result.accounts[0]?.accountId ?? sampleAccounts[0].accountId)
    setImportMessage(`Imported ${result.accounts.length} accounts. ${result.warnings.join(' ')}`)
  }

  function handleFileUpload(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setCsvText(text)
      const result = parseAccountsCsv(text)
      if (result.errors.length > 0) {
        setImportMessage(result.errors.join(' '))
      } else {
        setAccounts(result.accounts)
        setSelectedAccountId(result.accounts[0]?.accountId ?? sampleAccounts[0].accountId)
        setImportMessage(`Imported ${result.accounts.length} accounts from ${file.name}. ${result.warnings.join(' ')}`)
      }
    }
    reader.readAsText(file)
  }

  function resetSampleData() {
    setAccounts(sampleAccounts)
    setSelectedAccountId(sampleAccounts[0].accountId)
    setImportMessage('Built-in sample data is loaded.')
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Installed-Base Analytics</p>
          <h1>Technical Consulting Playbook</h1>
        </div>
        <nav className="screen-tabs" aria-label="Primary sections">
          {(['dashboard', 'detail', 'playbook', 'import', 'flow', 'methodology', 'reports'] as Screen[]).map((item) => (
            <button key={item} className={screen === item ? 'active' : ''} onClick={() => setScreen(item)}>
              {screenLabel(item)}
            </button>
          ))}
        </nav>
      </header>

      {screen === 'dashboard' && (
        <Dashboard
          filters={filters}
          filteredAccounts={filteredAccounts}
          kpis={kpis}
          scoredAccounts={scoredAccounts}
          updateFilter={updateFilter}
          onOpenAccount={openAccount}
        />
      )}

      {screen === 'detail' && (
        <AccountDetail
          scored={selectedScored}
          scoredAccounts={scoredAccounts}
          onSelect={(accountId) => setSelectedAccountId(accountId)}
          onOpenPlaybook={() => setScreen('playbook')}
        />
      )}

      {screen === 'playbook' && (
        <PlaybookGenerator
          scored={selectedScored}
          scoredAccounts={scoredAccounts}
          playbook={editedPlaybook}
          sourcePlaybook={playbook}
          onSelect={(accountId) => setSelectedAccountId(accountId)}
          onEdit={updateEditedSection}
        />
      )}

      {screen === 'import' && (
        <DataImport
          accounts={accounts}
          csvText={csvText}
          importMessage={importMessage}
          onCsvTextChange={setCsvText}
          onFileUpload={handleFileUpload}
          onImportText={handleCsvTextImport}
          onResetSample={resetSampleData}
        />
      )}

      {screen === 'flow' && <FlowDiagram />}

      {screen === 'methodology' && <Methodology />}

      {screen === 'reports' && <Reports scoredAccounts={filteredAccounts} allAccounts={scoredAccounts} playbook={editedPlaybook} />}
    </main>
  )
}

function Dashboard({
  filters,
  filteredAccounts,
  kpis,
  scoredAccounts,
  updateFilter,
  onOpenAccount,
}: {
  filters: Filters
  filteredAccounts: ScoredAccount[]
  kpis: ReturnType<typeof buildKpis>
  scoredAccounts: ScoredAccount[]
  updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  onOpenAccount: (accountId: string) => void
}) {
  const industryOptions = optionValues(scoredAccounts.map((scored) => scored.account.industrySegment))
  const regionOptions = optionValues(scoredAccounts.map((scored) => scored.account.region))
  const segmentOptions = optionValues(scoredAccounts.map((scored) => scored.segment))
  const opportunityOptions = optionValues(scoredAccounts.map((scored) => scored.recommendedOpportunityType))
  const confidenceOptions = optionValues(scoredAccounts.map((scored) => scored.confidenceLevel))
  const segmentOpportunity = groupSum(filteredAccounts, (scored) => scored.segment, (scored) => scored.account.estimatedOpportunitySize)
  const lifecycleDistribution = riskColors.map((risk) => ({
    ...risk,
    value: filteredAccounts.filter((scored) => scored.lifecycleRisk.label === risk.label).length,
  }))
  const opportunityTypes = groupCount(filteredAccounts, (scored) => scored.recommendedOpportunityType)
  const painPoints = topPainPoints(filteredAccounts)
  const ageBands = groupCount(filteredAccounts, (scored) => safetyAgeBand(scored.account.safetySystemAge))

  return (
    <section className="stack">
      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <article className="kpi-card" key={kpi.label}>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small>{kpi.caption}</small>
          </article>
        ))}
      </div>

      <div className="panel filter-panel">
        <label>
          Search
          <input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Account, segment, region, pain point"
          />
        </label>
        <FilterSelect label="Industry" value={filters.industry} options={industryOptions} onChange={(value) => updateFilter('industry', value)} />
        <FilterSelect label="Region" value={filters.region} options={regionOptions} onChange={(value) => updateFilter('region', value)} />
        <FilterSelect label="Segment" value={filters.segment} options={segmentOptions} onChange={(value) => updateFilter('segment', value)} />
        <FilterSelect label="Risk" value={filters.risk} options={['All', 'Critical', 'High', 'Moderate', 'Low']} onChange={(value) => updateFilter('risk', value)} />
        <FilterSelect
          label="Opportunity"
          value={filters.opportunityType}
          options={opportunityOptions}
          onChange={(value) => updateFilter('opportunityType', value)}
        />
        <FilterSelect
          label="Confidence"
          value={filters.confidence}
          options={confidenceOptions}
          onChange={(value) => updateFilter('confidence', value)}
        />
        <FilterSelect
          label="Sort"
          value={filters.sortKey}
          options={['priority', 'opportunity', 'risk', 'readiness', 'name']}
          onChange={(value) => updateFilter('sortKey', value as SortKey)}
        />
      </div>

      <div className="dashboard-grid">
        <BarList
          title="Opportunity by Segment"
          data={segmentOpportunity.map((item) => ({ label: item.label, value: item.value }))}
          valueLabel={formatCompactCurrency}
        />
        <DistributionChart title="Lifecycle Risk Distribution" data={lifecycleDistribution} />
        <BarList title="Opportunity Type Distribution" data={opportunityTypes} />
        <MatrixChart
          title="Priority vs Opportunity Matrix"
          accounts={filteredAccounts}
          xLabel="Priority score"
          yLabel="Opportunity value"
          xValue={(scored) => scored.technicalConsultingPriority.score}
          yValue={(scored) => normalizeForMatrix(scored.account.estimatedOpportunitySize, 180000, 1500000)}
        />
        <MatrixChart
          title="Confidence vs Value Matrix"
          accounts={filteredAccounts}
          xLabel="Confidence"
          yLabel="Opportunity value"
          xValue={(scored) => confidenceToNumber(scored.confidenceLevel)}
          yValue={(scored) => normalizeForMatrix(scored.account.estimatedOpportunitySize, 180000, 1500000)}
        />
        <BarList title="Top Pain Points" data={painPoints} />
        <BarList title="Safety System Age Bands" data={ageBands} />
      </div>

      <RankedTable scoredAccounts={filteredAccounts} onOpenAccount={onOpenAccount} />
    </section>
  )
}

function RankedTable({ scoredAccounts, onOpenAccount }: { scoredAccounts: ScoredAccount[]; onOpenAccount: (accountId: string) => void }) {
  return (
    <div className="panel table-panel">
      <div className="panel-heading">
        <div>
          <h2>Ranked Account Table</h2>
          <p>{scoredAccounts.length} accounts in the current view</p>
        </div>
        <button onClick={() => downloadFile('filtered-account-ranking.csv', rankingCsv(scoredAccounts), 'text/csv')}>Export ranking CSV</button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Account</th>
              <th>Segment</th>
              <th>Priority</th>
              <th>Risk</th>
              <th>Opportunity</th>
              <th>Fit</th>
              <th>Confidence</th>
              <th>Next Action</th>
            </tr>
          </thead>
          <tbody>
            {scoredAccounts.map((scored, index) => (
              <tr key={scored.account.accountId}>
                <td>{index + 1}</td>
                <td>
                  <button className="link-button" onClick={() => onOpenAccount(scored.account.accountId)}>
                    {scored.account.accountName}
                  </button>
                  <small>
                    {scored.account.industrySegment} · {scored.account.region}
                  </small>
                </td>
                <td>{scored.segment}</td>
                <td>
                  <ScorePill score={scored.technicalConsultingPriority.score} label={scored.technicalConsultingPriority.label} />
                </td>
                <td>{scored.lifecycleRisk.label}</td>
                <td>{formatCompactCurrency(scored.account.estimatedOpportunitySize)}</td>
                <td>{scored.recommendedOpportunityType}</td>
                <td>{scored.confidenceLevel}</td>
                <td>{scored.nextBestAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AccountDetail({
  scored,
  scoredAccounts,
  onSelect,
  onOpenPlaybook,
}: {
  scored: ScoredAccount
  scoredAccounts: ScoredAccount[]
  onSelect: (accountId: string) => void
  onOpenPlaybook: () => void
}) {
  const playbook = generatePlaybook(scored)

  return (
    <section className="stack">
      <div className="panel detail-hero">
        <div>
          <label>
            Selected account
            <select value={scored.account.accountId} onChange={(event) => onSelect(event.target.value)}>
              {scoredAccounts.map((item) => (
                <option value={item.account.accountId} key={item.account.accountId}>
                  {item.account.accountName}
                </option>
              ))}
            </select>
          </label>
          <h2>{scored.account.accountName}</h2>
          <p>
            {scored.account.plantType} · {scored.account.industrySegment} · {scored.account.region}
          </p>
        </div>
        <div className="hero-actions">
          <ScorePill score={scored.technicalConsultingPriority.score} label={scored.technicalConsultingPriority.label} />
          <button onClick={onOpenPlaybook}>Open playbook</button>
        </div>
      </div>

      <div className="detail-grid">
        <InfoPanel
          title="Plant Overview"
          items={[
            ['Production lines', String(scored.account.productionLines)],
            ['Annual downtime exposure', formatCurrency(scored.account.estimatedAnnualDowntimeCost)],
            ['Estimated opportunity', formatCurrency(scored.account.estimatedOpportunitySize)],
            ['Decision-maker persona', scored.account.decisionMakerPersona],
            ['Likely buying trigger', scored.account.likelyBuyingTrigger],
          ]}
        />
        <InfoPanel
          title="Installed Equipment Summary"
          items={[
            ['PLC family', scored.account.installedPlcFamily],
            ['HMI/SCADA', scored.account.installedHmiScadaSystem],
            ['Drives and motors', String(scored.account.driveMotorCount)],
            ['Sensors', String(scored.account.sensorCount)],
            ['Safety system age', `${scored.account.safetySystemAge} years`],
          ]}
        />
        <InfoPanel
          title="Risk Indicators"
          items={[
            ['Lifecycle stage', scored.account.assetLifecycleStage],
            ['Support risk', scored.account.supportRisk],
            ['Data availability', scored.account.dataAvailability],
            ['Installed-base confidence', scored.account.installedBaseConfidence],
            ['Competitor presence', scored.account.competitorPresence],
          ]}
        />
      </div>

      <div className="score-grid">
        {[
          scored.lifecycleRisk,
          scored.installedBaseComplexity,
          scored.modernizationFit,
          scored.serviceUrgency,
          scored.dataReadiness,
          scored.salesReadiness,
        ].map((score) => (
          <ScoreCard key={score.name} score={score} />
        ))}
      </div>

      <div className="two-column">
        <div className="panel">
          <h3>Opportunity Rationale</h3>
          <p>{scored.segmentReason}</p>
          <p>{segmentDefinitions[scored.segment].definition}</p>
          <h4>Recommended solution categories</h4>
          <ul>
            {scored.recommendations.map((recommendation) => (
              <li key={recommendation.id}>
                <strong>{recommendation.opportunityType}</strong>: {recommendation.rationale}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Engagement Questions</h3>
          <ul>
            {playbook.questions.slice(0, 7).map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
          <h4>Technical discovery checklist</h4>
          <ul>
            {segmentDefinitions[scored.segment].evidenceToCollect.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="two-column">
        <div className="panel">
          <h3>Objections and Risks</h3>
          <ul>
            <li>Existing supplier context: {scored.account.competitorPresence}.</li>
            <li>Outage windows and validation expectations may constrain the scope.</li>
            <li>Data evidence may not yet support the full opportunity estimate.</li>
          </ul>
        </div>
        <div className="panel emphasis">
          <h3>Next Step</h3>
          <p>{scored.nextBestAction}</p>
          <small>{scored.account.urgencyNotes}</small>
        </div>
      </div>
    </section>
  )
}

function PlaybookGenerator({
  scored,
  scoredAccounts,
  playbook,
  sourcePlaybook,
  onSelect,
  onEdit,
}: {
  scored: ScoredAccount
  scoredAccounts: ScoredAccount[]
  playbook: Playbook
  sourcePlaybook: Playbook
  onSelect: (accountId: string) => void
  onEdit: (title: string, body: string) => void
}) {
  return (
    <section className="stack">
      <div className="panel playbook-toolbar">
        <label>
          Account
          <select value={scored.account.accountId} onChange={(event) => onSelect(event.target.value)}>
            {scoredAccounts.map((item) => (
              <option value={item.account.accountId} key={item.account.accountId}>
                {item.account.accountName}
              </option>
            ))}
          </select>
        </label>
        <div className="button-row">
          <button onClick={() => copyToClipboard(playbook.questions.join('\n'))}>Copy questions</button>
          <button onClick={() => downloadFile(`${scored.account.accountId}-playbook.md`, playbookToMarkdown(playbook), 'text/markdown')}>
            Export Markdown
          </button>
          <button onClick={() => downloadFile(`${scored.account.accountId}-playbook.html`, playbookToHtml(playbook), 'text/html')}>
            Export HTML
          </button>
          <button onClick={() => window.print()}>Print</button>
        </div>
      </div>

      <article className="panel playbook">
        <div className="print-heading">
          <p className="eyebrow">Customer Engagement Playbook</p>
          <h2>{playbook.accountName}</h2>
          <p>Generated {playbook.generatedOn}</p>
        </div>
        {sourcePlaybook.sections.map((section) => (
          <section key={section.title} className="playbook-section">
            <h3>{section.title}</h3>
            <textarea
              value={playbook.sections.find((item) => item.title === section.title)?.body ?? section.body}
              onChange={(event) => onEdit(section.title, event.target.value)}
              rows={Math.max(4, section.body.split('\n').length + 2)}
            />
          </section>
        ))}
      </article>
    </section>
  )
}

function DataImport({
  accounts,
  csvText,
  importMessage,
  onCsvTextChange,
  onFileUpload,
  onImportText,
  onResetSample,
}: {
  accounts: Account[]
  csvText: string
  importMessage: string
  onCsvTextChange: (value: string) => void
  onFileUpload: (file: File | undefined) => void
  onImportText: () => void
  onResetSample: () => void
}) {
  const previewRows = useMemo(() => accounts.slice(0, 8), [accounts])

  return (
    <section className="stack">
      <div className="panel import-panel">
        <div>
          <h2>Data Import</h2>
          <p>Upload or paste a CSV using the documented column names. If no file is imported, the built-in sample dataset remains active.</p>
        </div>
        <div className="button-row">
          <label className="file-button">
            Upload CSV
            <input type="file" accept=".csv,text/csv" onChange={(event) => onFileUpload(event.target.files?.[0])} />
          </label>
          <button onClick={() => downloadFile('installed-base-sample.csv', sampleCsv, 'text/csv')}>Download sample CSV</button>
          <button onClick={() => downloadFile('current-accounts.csv', accountsToCsv(accounts), 'text/csv')}>Download current CSV</button>
          <button onClick={onResetSample}>Restore sample data</button>
        </div>
      </div>

      <div className="panel">
        <h3>Paste CSV</h3>
        <textarea
          className="csv-textarea"
          value={csvText}
          onChange={(event) => onCsvTextChange(event.target.value)}
          placeholder="Paste CSV content here"
        />
        <div className="button-row">
          <button onClick={onImportText}>Validate and import pasted CSV</button>
        </div>
        <p className="status-message">{importMessage}</p>
      </div>

      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>Parsed Data Preview</h3>
            <p>Showing {previewRows.length} of {accounts.length} active records</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Industry</th>
                <th>Region</th>
                <th>PLC</th>
                <th>Lifecycle</th>
                <th>Opportunity</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((account) => (
                <tr key={account.accountId}>
                  <td>{account.accountName}</td>
                  <td>{account.industrySegment}</td>
                  <td>{account.region}</td>
                  <td>{account.installedPlcFamily}</td>
                  <td>{account.assetLifecycleStage}</td>
                  <td>{formatCompactCurrency(account.estimatedOpportunitySize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function FlowDiagram() {
  const analysisFlow = [
    ['1', 'Account data', 'Installed equipment, downtime, lifecycle, service, trigger, and readiness inputs.'],
    ['2', 'Import + staging', 'Sample JSON or uploaded CSV becomes the active account dataset.'],
    ['3', 'SQL scoring', 'Python and SQLite apply schema and queries for reproducible exports.'],
    ['4', 'Browser model', 'React scoring supports filters, account detail, and imported data.'],
    ['5', 'Prioritization', 'Component scores produce segment, opportunity type, and next-best action.'],
    ['6', 'Playbook + exports', 'Recommendations, discovery questions, CSV, JSON, and workbook outputs.'],
  ]
  const supportPaths = [
    ['Ranking logic', 'Priority balances modernization fit, lifecycle risk, service urgency, complexity, readiness, and value.'],
    ['Recommendation logic', 'Rules turn account evidence into practical next moves such as modernization, drive health, safety review, or assessment.'],
    ['Static hosting', 'Generated analytics files live under public/analytics and are served with the dashboard build.'],
  ]

  return (
    <section className="stack">
      <div className="panel">
        <h2>Analysis Flow Diagram</h2>
        <p>High-level path from installed-base records to ranked opportunities and playbook outputs.</p>
        <div className="block-flow">
          {analysisFlow.map(([index, title, body]) => (
            <article className="flow-card" key={title}>
              <span className="flow-step-index">{index}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="flow-summary-grid">
        {supportPaths.map(([title, body]) => (
          <article className="panel" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Methodology() {
  const pipelineSteps = [
    ['1. Account inputs', 'Account records in src/data/accounts.json describe sites, installed equipment, lifecycle status, downtime exposure, readiness, and context signals.'],
    ['2. SQLite staging', 'analytics/pipeline.py loads the JSON into analytics/schema.sql tables so the scoring logic can be inspected and rerun outside the browser.'],
    ['3. SQL scoring', 'analytics/queries/account_scores.sql calculates component scores, priority_score, segment, opportunity_type, and next_best_action.'],
    ['4. Ranked dashboard', 'src/scoring/scoring.ts mirrors the model for live imported data, then src/App.tsx filters, sorts, and renders the dashboard.'],
    ['5. Playbook outputs', 'src/recommendations/rules.ts and src/playbook/generator.ts turn the scored account into recommendations, evidence requests, and exportable playbooks.'],
  ]
  const scoreComponents = [
    ['Lifecycle risk', 'Lifecycle stage, support risk, safety age, and downtime exposure.'],
    ['Installed-base complexity', 'Production lines, drives, sensors, and platform variation.'],
    ['Modernization fit', 'Modernization interest, lifecycle pressure, strategic fit, and downtime cost.'],
    ['Service urgency', 'Support exposure, active trigger, service context, and downtime severity.'],
    ['Data readiness', 'Data availability, installed-base confidence, sensors, and HMI/SCADA context.'],
    ['Sales readiness', 'Modernization interest, strategic fit, service relationship, trigger strength, and competitive context.'],
  ]

  return (
    <section className="stack">
      <div className="panel">
        <h2>Methodology and Implementation Notes</h2>
        <p>
          This project ranks industrial accounts by evidence that a practical installed-base opportunity exists, not by account size
          alone. The model stays inside account-level planning: it prioritizes discovery, modernization, service, monitoring, and
          assessment paths, but it does not replace engineering design, safety validation, commercial quoting, or site acceptance work.
        </p>
      </div>

      <div className="two-column">
        <article className="panel">
          <h3>Purpose and Boundaries</h3>
          <ul>
            <li>Purpose: convert inconsistent account notes into a ranked, explainable prioritization view.</li>
            <li>Installed base means the known controls, HMI/SCADA, drives, motors, sensors, safety systems, production lines, and support context already present at a site.</li>
            <li>The result is a decision-support model for where to investigate next; low-confidence data should trigger assessment, not automatic proposal scope.</li>
          </ul>
        </article>
        <article className="panel">
          <h3>Why Ranking Is Not Just Opportunity Size</h3>
          <p>
            Estimated opportunity value is included, but it carries limited weight because a large account may still lack timing,
            evidence, access, data quality, or support urgency. Priority is stronger when value is paired with lifecycle pressure,
            readiness, service context, and a credible next action.
          </p>
          <p className="method-note">SQL ordering uses priority first, then opportunity size as a tie-breaker.</p>
        </article>
      </div>

      <div className="panel">
        <h3>Data Flow</h3>
        <div className="flow-grid">
          {pipelineSteps.map(([title, body]) => (
            <article key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="method-grid">
        {scoreComponents.map(([title, body]) => (
          <article className="panel" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>

      <div className="two-column">
        <article className="panel">
          <h3>Component Scores and Priority Score</h3>
          <p>
            Each component normalizes different evidence onto a 0-100 scale with labels and rationale. The priority score blends the
            components with weights that favor modernization fit, lifecycle risk, and service urgency, while keeping opportunity value as
            one input rather than the whole answer.
          </p>
          <ul>
            <li><code>src/scoring/scoring.ts</code> supports live browser scoring after CSV import.</li>
            <li><code>analytics/queries/account_scores.sql</code> supports reproducible batch scoring and static exports.</li>
          </ul>
        </article>
        <article className="panel">
          <h3>Recommendations and Playbooks</h3>
          <p>
            Recommendations are selected by rules that match concrete account evidence: aging controllers, high downtime, safety age,
            visibility gaps, process variability, data readiness, service history, and competitive context. The generated playbook keeps
            the primary opportunity, evidence to collect, workshop agenda, value hypothesis, risks, and follow-up actions together.
          </p>
          <p className="method-note">Primary files: <code>src/recommendations/rules.ts</code> and <code>src/playbook/generator.ts</code>.</p>
        </article>
      </div>

      <div className="panel">
        <h3>Segment Definitions</h3>
        <div className="segment-list">
          {Object.values(segmentDefinitions).map((segment) => (
            <article key={segment.name}>
              <h4>{segment.name}</h4>
              <p>{segment.definition}</p>
              <strong>Next move:</strong> {segment.recommendedNextMove}
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Recommendation Rules</h3>
        <div className="rules-list">
          {recommendationRules.map((rule) => (
            <article key={rule.id}>
              <strong>{rule.title}</strong>
              <p>{rule.opportunityType}</p>
              <small>{rule.nextMove}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="two-column">
        <article className="panel">
          <h3>Static Export Architecture</h3>
          <p>
            The analytics pipeline runs before deployment: Python reads the account dataset, SQLite applies schema and SQL queries, and
            CSV, JSON, and Excel-compatible XML files are written to <code>public/analytics/</code>. The React app can be hosted as static
            assets because the browser only needs prebuilt files and client-side filtering/export logic.
          </p>
          <ul>
            <li><code>analytics/pipeline.py</code> builds the database and public exports.</li>
            <li><code>vite.config.ts</code> uses a relative base path so GitHub Pages can serve the built files from a project subpath.</li>
          </ul>
        </article>
        <article className="panel">
          <h3>Validation and Production Extension</h3>
          <p>
            The current tests cover Python analytics output, scoring behavior, recommendation rules, playbook generation, and export
            formatting. A production path would add authenticated data ingestion, scheduled pipeline runs, data quality checks, field-level
            lineage, user-specific permissions, and review workflows before recommendations are released.
          </p>
          <ul>
            <li><code>npm run analytics:test</code> validates the SQLite export path.</li>
            <li><code>npm run test</code>, <code>npm run lint</code>, and <code>npm run build</code> validate the app surface.</li>
          </ul>
        </article>
      </div>
    </section>
  )
}

function Reports({
  scoredAccounts,
  allAccounts,
  playbook,
}: {
  scoredAccounts: ScoredAccount[]
  allAccounts: ScoredAccount[]
  playbook: Playbook
}) {
  const summary = opportunitySummaryJson(scoredAccounts)
  const staticAnalytics = [
    ['Excel-compatible workbook', 'installed_base_analytics_workbook.xml'],
    ['SQL-scored accounts CSV', 'account_scores.csv'],
    ['SQL-scored accounts JSON', 'account_scores.json'],
    ['Opportunity summary JSON', 'opportunity_summary.json'],
    ['Segment summary CSV', 'segment_summary.csv'],
    ['Region summary CSV', 'region_summary.csv'],
  ]

  return (
    <section className="stack">
      <div className="panel">
        <h2>Reports and Exports</h2>
        <p>Exports reflect the current filtered view where applicable. Use the dashboard filters first, then return here to download outputs.</p>
        <div className="export-grid">
          <button onClick={() => downloadFile('account-ranking.csv', rankingCsv(scoredAccounts), 'text/csv')}>Export account ranking CSV</button>
          <button onClick={() => downloadFile('filtered-account-table.csv', filteredAccountCsv(scoredAccounts), 'text/csv')}>
            Export filtered table CSV
          </button>
          <button onClick={() => downloadFile('opportunity-summary.json', summary, 'application/json')}>Export opportunity summary JSON</button>
          <button onClick={() => downloadFile('scoring-explanation.json', scoringExplanationJson(allAccounts), 'application/json')}>
            Export scoring explanation JSON
          </button>
          <button onClick={() => downloadFile(`${playbook.accountId}-playbook.md`, playbookToMarkdown(playbook), 'text/markdown')}>
            Export selected playbook Markdown
          </button>
          <button onClick={() => downloadFile(`${playbook.accountId}-playbook.html`, playbookToHtml(playbook), 'text/html')}>
            Export selected playbook HTML
          </button>
        </div>
      </div>
      <div className="panel">
        <h3>Generated Analytics Files</h3>
        <p>These static files are produced by the Python and SQLite export pipeline before the site build.</p>
        <div className="export-grid">
          {staticAnalytics.map(([label, fileName]) => (
            <a key={fileName} href={`${import.meta.env.BASE_URL}analytics/${fileName}`} download>
              {label}
            </a>
          ))}
        </div>
      </div>
      <div className="panel">
        <h3>Opportunity Summary Preview</h3>
        <pre>{summary}</pre>
      </div>
    </section>
  )
}

function InfoPanel({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <article className="panel info-panel">
      <h3>{title}</h3>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

function ScoreCard({ score }: { score: ScoreDetail }) {
  return (
    <article className="panel score-card">
      <div className="score-card-heading">
        <h3>{score.name}</h3>
        <ScorePill score={score.score} label={score.label} />
      </div>
      <p>{score.rationale}</p>
      <details>
        <summary>Triggered rules and levers</summary>
        <strong>Rules</strong>
        <ul>
          {score.triggeredRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <strong>Levers</strong>
        <ul>
          {score.improvementLevers.map((lever) => (
            <li key={lever}>{lever}</li>
          ))}
        </ul>
      </details>
    </article>
  )
}

function ScorePill({ score, label }: { score: number; label: string }) {
  return (
    <span className={`score-pill ${score >= 78 ? 'hot' : score >= 62 ? 'warm' : score >= 44 ? 'steady' : 'cool'}`}>
      {score} · {label}
    </span>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function applyFilters(scoredAccounts: ScoredAccount[], filters: Filters) {
  const search = filters.search.trim().toLowerCase()
  const filtered = scoredAccounts.filter((scored) => {
    const haystack = [
      scored.account.accountName,
      scored.account.industrySegment,
      scored.account.region,
      scored.account.plantType,
      scored.account.installedPlcFamily,
      scored.account.installedHmiScadaSystem,
      scored.account.downtimePainPoints.join(' '),
      scored.recommendedOpportunityType,
      scored.segment,
    ]
      .join(' ')
      .toLowerCase()

    return (
      (!search || haystack.includes(search)) &&
      (filters.industry === 'All' || scored.account.industrySegment === filters.industry) &&
      (filters.region === 'All' || scored.account.region === filters.region) &&
      (filters.segment === 'All' || scored.segment === filters.segment) &&
      (filters.risk === 'All' || scored.lifecycleRisk.label === filters.risk) &&
      (filters.opportunityType === 'All' || scored.recommendedOpportunityType === filters.opportunityType) &&
      (filters.confidence === 'All' || scored.confidenceLevel === filters.confidence)
    )
  })

  return filtered.sort((a, b) => {
    if (filters.sortKey === 'opportunity') return b.account.estimatedOpportunitySize - a.account.estimatedOpportunitySize
    if (filters.sortKey === 'risk') return b.lifecycleRisk.score - a.lifecycleRisk.score
    if (filters.sortKey === 'readiness') return b.dataReadiness.score - a.dataReadiness.score
    if (filters.sortKey === 'name') return a.account.accountName.localeCompare(b.account.accountName)
    return b.technicalConsultingPriority.score - a.technicalConsultingPriority.score
  })
}

function buildKpis(scoredAccounts: ScoredAccount[]) {
  const totalOpportunity = scoredAccounts.reduce((sum, scored) => sum + scored.account.estimatedOpportunitySize, 0)
  const highPriority = scoredAccounts.filter((scored) => scored.technicalConsultingPriority.score >= 72).length
  const averageLifecycleRisk = scoredAccounts.reduce((sum, scored) => sum + scored.lifecycleRisk.score, 0) / scoredAccounts.length
  const topIndustry = groupCount(scoredAccounts, (scored) => scored.account.industrySegment)[0]?.label ?? 'n/a'
  const quickWins = scoredAccounts.filter((scored) => scored.segment === 'Quick win').length
  const safetyRisk = scoredAccounts.filter((scored) => scored.account.safetySystemAge >= 12).length
  const shortCycle = scoredAccounts.filter((scored) =>
    scored.recommendations.some((recommendation) => recommendation.opportunityType === 'Short-cycle service opportunity'),
  ).length

  return [
    { label: 'Total accounts', value: String(scoredAccounts.length), caption: 'Active installed-base records' },
    { label: 'High-priority accounts', value: String(highPriority), caption: 'Priority score of 72 or higher' },
    { label: 'Total estimated opportunity', value: formatCompactCurrency(totalOpportunity), caption: 'Modeled revenue potential' },
    { label: 'Average lifecycle risk', value: formatPercent(averageLifecycleRisk), caption: 'Mean lifecycle score' },
    { label: 'Top industry segment', value: topIndustry, caption: 'Largest account count' },
    { label: 'Quick-win count', value: String(quickWins), caption: 'Ready for short-cycle pursuit' },
    { label: 'Safety lifecycle risk', value: String(safetyRisk), caption: 'Safety system age 12+ years' },
    { label: 'Short-cycle engagement', value: String(shortCycle), caption: 'Existing service activity present' },
  ]
}

function screenLabel(screen: Screen) {
  const labels: Record<Screen, string> = {
    dashboard: 'Dashboard',
    detail: 'Account Detail',
    playbook: 'Playbook',
    import: 'Data Import',
    flow: 'Flow',
    methodology: 'Methodology',
    reports: 'Reports',
  }
  return labels[screen]
}

function optionValues(values: string[]) {
  return ['All', ...Array.from(new Set(values)).sort()]
}

function groupCount<T>(items: T[], keyFn: (item: T) => string) {
  const counts = items.reduce<Record<string, number>>((groups, item) => {
    const key = keyFn(item)
    groups[key] = (groups[key] ?? 0) + 1
    return groups
  }, {})

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

function groupSum<T>(items: T[], keyFn: (item: T) => string, valueFn: (item: T) => number) {
  const counts = items.reduce<Record<string, number>>((groups, item) => {
    const key = keyFn(item)
    groups[key] = (groups[key] ?? 0) + valueFn(item)
    return groups
  }, {})

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

function topPainPoints(scoredAccounts: ScoredAccount[]) {
  const counts = scoredAccounts.flatMap((scored) => scored.account.downtimePainPoints).reduce<Record<string, number>>((groups, point) => {
    const key = point.replace(/ faults| delays| gaps| issues| stops| trips/gi, '').trim()
    groups[key] = (groups[key] ?? 0) + 1
    return groups
  }, {})

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

function safetyAgeBand(age: number) {
  if (age >= 18) return '18+ years'
  if (age >= 12) return '12-17 years'
  if (age >= 7) return '7-11 years'
  return '0-6 years'
}

function confidenceToNumber(confidence: string) {
  if (confidence === 'High') return 88
  if (confidence === 'Medium') return 62
  return 32
}

function normalizeForMatrix(value: number, min: number, max: number) {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

function mergeEditedPlaybook(playbook: Playbook, edits: Record<string, string> | undefined): Playbook {
  if (!edits) return playbook

  return {
    ...playbook,
    sections: playbook.sections.map((section) => ({
      ...section,
      body: edits[section.title] ?? section.body,
    })),
  }
}

function downloadFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
}

export default App
