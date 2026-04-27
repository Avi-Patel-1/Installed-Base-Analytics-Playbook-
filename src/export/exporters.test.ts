import { describe, expect, it } from 'vitest'
import { sampleAccounts } from '../data/accounts'
import { generatePlaybook } from '../playbook/generator'
import { scoreAccounts } from '../scoring/scoring'
import { opportunitySummaryJson, playbookToHtml, playbookToMarkdown, rankingCsv, scoringExplanationJson } from './exporters'

describe('export formatting', () => {
  const scored = scoreAccounts(sampleAccounts)
  const playbook = generatePlaybook(scored[0])

  it('exports ranking CSV with score fields', () => {
    const csv = rankingCsv(scored.slice(0, 3))

    expect(csv.split('\n')).toHaveLength(4)
    expect(csv).toContain('priorityScore')
    expect(csv).toContain(scored[0].account.accountName)
  })

  it('exports playbooks as Markdown and HTML', () => {
    const markdown = playbookToMarkdown(playbook)
    const html = playbookToHtml(playbook)

    expect(markdown).toContain('# ')
    expect(markdown).toContain('## Executive Summary')
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('<section>')
  })

  it('exports opportunity and scoring JSON', () => {
    const summary = JSON.parse(opportunitySummaryJson(scored))
    const explanation = JSON.parse(scoringExplanationJson(scored.slice(0, 2)))

    expect(summary.totalAccounts).toBe(scored.length)
    expect(summary.totalEstimatedOpportunity).toBeGreaterThan(0)
    expect(explanation[0].scores.technicalConsultingPriority.score).toBeGreaterThan(0)
  })
})
