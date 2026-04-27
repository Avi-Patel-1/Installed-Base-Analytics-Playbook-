import { describe, expect, it } from 'vitest'
import { sampleAccounts } from '../data/accounts'
import { getRecommendations } from './rules'

describe('recommendation rules', () => {
  it('maps old controls and high downtime to modernization discovery', () => {
    const account = sampleAccounts.find((item) => item.accountId === 'IBA-002')!
    const recommendations = getRecommendations(account)

    expect(recommendations.map((item) => item.opportunityType)).toContain('Controls modernization discovery')
  })

  it('maps high motor count and downtime to drive health work', () => {
    const account = sampleAccounts.find((item) => item.accountId === 'IBA-025')!
    const recommendations = getRecommendations(account)

    expect(recommendations.map((item) => item.opportunityType)).toContain('Drive health and predictive maintenance')
  })

  it('uses discovery-first positioning when a competitor is present', () => {
    const account = sampleAccounts.find((item) => item.accountId === 'IBA-014')!
    const recommendations = getRecommendations(account)

    expect(recommendations.map((item) => item.opportunityType)).toContain('Discovery-first positioning')
  })

  it('requires assessment when data readiness is sparse', () => {
    const account = sampleAccounts.find((item) => item.accountId === 'IBA-016')!
    const recommendations = getRecommendations(account)

    expect(recommendations.map((item) => item.opportunityType)).toContain('Assessment workshop')
  })
})
