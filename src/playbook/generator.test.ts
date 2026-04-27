import { describe, expect, it } from 'vitest'
import { sampleAccounts } from '../data/accounts'
import { scoreAccount } from '../scoring/scoring'
import { generatePlaybook } from './generator'

describe('playbook generation', () => {
  it('creates a polished structured playbook for a selected account', () => {
    const scored = scoreAccount(sampleAccounts[0])
    const playbook = generatePlaybook(scored)

    expect(playbook.sections.length).toBeGreaterThanOrEqual(10)
    expect(playbook.questions.length).toBeGreaterThanOrEqual(6)
    expect(playbook.sections[0].body).toContain(scored.account.accountName)
    expect(playbook.sections.map((section) => section.title)).toContain('Proposal Outline')
  })

  it('keeps discovery questions distinct', () => {
    const scored = scoreAccount(sampleAccounts[3])
    const playbook = generatePlaybook(scored)

    expect(new Set(playbook.questions).size).toBe(playbook.questions.length)
  })
})
