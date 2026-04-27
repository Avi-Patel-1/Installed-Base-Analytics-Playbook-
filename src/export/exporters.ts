import type { Playbook, ScoredAccount } from '../types'
import { accountColumns } from '../utils/csv'
import { formatCurrency } from '../utils/format'

export function rankingCsv(scoredAccounts: ScoredAccount[]) {
  const headers = [
    'rank',
    'accountId',
    'accountName',
    'segment',
    'priorityScore',
    'lifecycleRiskScore',
    'modernizationFitScore',
    'serviceUrgencyScore',
    'dataReadinessScore',
    'confidenceLevel',
    'recommendedOpportunityType',
    'estimatedOpportunitySize',
    'nextBestAction',
  ]

  const rows = scoredAccounts.map((scored, index) => [
    String(index + 1),
    scored.account.accountId,
    scored.account.accountName,
    scored.segment,
    String(scored.technicalConsultingPriority.score),
    String(scored.lifecycleRisk.score),
    String(scored.modernizationFit.score),
    String(scored.serviceUrgency.score),
    String(scored.dataReadiness.score),
    scored.confidenceLevel,
    scored.recommendedOpportunityType,
    String(scored.account.estimatedOpportunitySize),
    scored.nextBestAction,
  ])

  return toCsv([headers, ...rows])
}

export function filteredAccountCsv(scoredAccounts: ScoredAccount[]) {
  const rows = scoredAccounts.map((scored) =>
    accountColumns.map((column) => {
      const value = scored.account[column]
      return Array.isArray(value) ? value.join('; ') : String(value)
    }),
  )

  return toCsv([accountColumns.map(String), ...rows])
}

export function opportunitySummaryJson(scoredAccounts: ScoredAccount[]) {
  const bySegment = groupValue(scoredAccounts, (scored) => scored.segment, (scored) => scored.account.estimatedOpportunitySize)
  const byOpportunityType = groupValue(
    scoredAccounts,
    (scored) => scored.recommendedOpportunityType,
    (scored) => scored.account.estimatedOpportunitySize,
  )

  return JSON.stringify(
    {
      totalAccounts: scoredAccounts.length,
      totalEstimatedOpportunity: scoredAccounts.reduce((sum, scored) => sum + scored.account.estimatedOpportunitySize, 0),
      highPriorityAccounts: scoredAccounts.filter((scored) => scored.technicalConsultingPriority.score >= 72).length,
      bySegment,
      byOpportunityType,
      topAccounts: scoredAccounts.slice(0, 10).map((scored, index) => ({
        rank: index + 1,
        accountId: scored.account.accountId,
        accountName: scored.account.accountName,
        priorityScore: scored.technicalConsultingPriority.score,
        segment: scored.segment,
        opportunity: formatCurrency(scored.account.estimatedOpportunitySize),
      })),
    },
    null,
    2,
  )
}

export function scoringExplanationJson(scoredAccounts: ScoredAccount[]) {
  return JSON.stringify(
    scoredAccounts.map((scored) => ({
      accountId: scored.account.accountId,
      accountName: scored.account.accountName,
      scores: {
        lifecycleRisk: scored.lifecycleRisk,
        installedBaseComplexity: scored.installedBaseComplexity,
        modernizationFit: scored.modernizationFit,
        serviceUrgency: scored.serviceUrgency,
        dataReadiness: scored.dataReadiness,
        salesReadiness: scored.salesReadiness,
        technicalConsultingPriority: scored.technicalConsultingPriority,
      },
      segment: scored.segment,
      segmentReason: scored.segmentReason,
      recommendedOpportunityType: scored.recommendedOpportunityType,
      nextBestAction: scored.nextBestAction,
    })),
    null,
    2,
  )
}

export function playbookToMarkdown(playbook: Playbook) {
  return [
    `# ${playbook.accountName} Technical Consulting Playbook`,
    '',
    `Generated: ${playbook.generatedOn}`,
    '',
    ...playbook.sections.flatMap((section) => [`## ${section.title}`, '', section.body, '']),
  ].join('\n')
}

export function playbookToHtml(playbook: Playbook) {
  const sections = playbook.sections
    .map(
      (section) => `<section>
  <h2>${escapeHtml(section.title)}</h2>
  ${markdownBodyToHtml(section.body)}
</section>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(playbook.accountName)} Technical Consulting Playbook</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #172026; margin: 32px; line-height: 1.55; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 28px; border-bottom: 1px solid #d7dde2; padding-bottom: 6px; }
    li { margin: 4px 0; }
    .date { color: #60717d; }
  </style>
</head>
<body>
  <h1>${escapeHtml(playbook.accountName)} Technical Consulting Playbook</h1>
  <p class="date">Generated: ${escapeHtml(playbook.generatedOn)}</p>
  ${sections}
</body>
</html>`
}

function markdownBodyToHtml(body: string) {
  const lines = body.split('\n')
  const html: string[] = []
  let listOpen = false

  lines.forEach((line) => {
    if (/^[-\d]+\./.test(line) || line.startsWith('- ')) {
      if (!listOpen) {
        html.push('<ul>')
        listOpen = true
      }
      html.push(`<li>${escapeHtml(line.replace(/^-\s|\d+\.\s/, ''))}</li>`)
    } else {
      if (listOpen) {
        html.push('</ul>')
        listOpen = false
      }
      if (line.trim()) {
        html.push(`<p>${escapeHtml(line)}</p>`)
      }
    }
  })

  if (listOpen) {
    html.push('</ul>')
  }

  return html.join('\n')
}

function groupValue(scoredAccounts: ScoredAccount[], keyFn: (scored: ScoredAccount) => string, valueFn: (scored: ScoredAccount) => number) {
  return scoredAccounts.reduce<Record<string, { count: number; estimatedOpportunity: number }>>((groups, scored) => {
    const key = keyFn(scored)
    groups[key] ??= { count: 0, estimatedOpportunity: 0 }
    groups[key].count += 1
    groups[key].estimatedOpportunity += valueFn(scored)
    return groups
  }, {})
}

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n')
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
