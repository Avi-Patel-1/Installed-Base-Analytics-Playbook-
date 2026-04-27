import { describe, expect, it } from 'vitest'
import { sampleAccounts } from '../data/accounts'
import { classifySegment, scoreAccount, scoreAccounts } from './scoring'

describe('scoring engine', () => {
  it('loads at least forty installed-base records', () => {
    expect(sampleAccounts.length).toBeGreaterThanOrEqual(40)
  })

  it('ranks obsolete high-risk accounts above current low-risk accounts', () => {
    const obsolete = sampleAccounts.find((account) => account.accountId === 'IBA-005')
    const current = sampleAccounts.find((account) => account.accountId === 'IBA-008')

    expect(obsolete).toBeDefined()
    expect(current).toBeDefined()

    const obsoleteScore = scoreAccount(obsolete!)
    const currentScore = scoreAccount(current!)

    expect(obsoleteScore.lifecycleRisk.score).toBeGreaterThan(currentScore.lifecycleRisk.score)
    expect(obsoleteScore.technicalConsultingPriority.score).toBeGreaterThan(currentScore.technicalConsultingPriority.score)
  })

  it('returns a sorted ranked account list', () => {
    const scored = scoreAccounts(sampleAccounts)

    expect(scored[0].technicalConsultingPriority.score).toBeGreaterThanOrEqual(scored[1].technicalConsultingPriority.score)
    expect(scored.at(-1)?.technicalConsultingPriority.score).toBeLessThanOrEqual(scored[0].technicalConsultingPriority.score)
  })

  it('classifies low-readiness low-value records as low priority', () => {
    const scored = scoreAccount(sampleAccounts.find((account) => account.accountId === 'IBA-030')!)
    const segment = classifySegment(scored.account, {
      lifecycleRisk: scored.lifecycleRisk,
      installedBaseComplexity: scored.installedBaseComplexity,
      modernizationFit: scored.modernizationFit,
      serviceUrgency: scored.serviceUrgency,
      dataReadiness: scored.dataReadiness,
      salesReadiness: scored.salesReadiness,
      priority: scored.technicalConsultingPriority,
    })

    expect(['Low priority', 'Education/nurture account', 'Service-risk account']).toContain(segment.segment)
    expect(segment.reason.length).toBeGreaterThan(20)
  })
})
