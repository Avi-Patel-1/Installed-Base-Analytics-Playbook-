import { segmentDefinitions } from '../data/segments'
import { getRecommendations } from '../recommendations/rules'
import type {
  Account,
  ConfidenceLevel,
  DataAvailability,
  ModernizationInterest,
  OpportunityType,
  PrioritySegment,
  ScoreDetail,
  ScoredAccount,
  StrategicFit,
  SupportRisk,
} from '../types'

const lifecycleStageScore: Record<Account['assetLifecycleStage'], number> = {
  Current: 12,
  Mature: 42,
  'Limited support': 72,
  Obsolete: 92,
}

const supportRiskScore: Record<SupportRisk, number> = {
  Low: 15,
  Moderate: 42,
  High: 72,
  Critical: 92,
}

const interestScore: Record<ModernizationInterest, number> = {
  Low: 18,
  Moderate: 50,
  Active: 75,
  Budgeted: 90,
}

const strategicFitScore: Record<StrategicFit, number> = {
  Low: 18,
  Medium: 48,
  High: 72,
  Strategic: 92,
}

const dataAvailabilityScore: Record<DataAvailability, number> = {
  Sparse: 18,
  Partial: 45,
  Usable: 70,
  Rich: 88,
}

const confidenceScore: Record<ConfidenceLevel, number> = {
  Low: 30,
  Medium: 62,
  High: 88,
}

export function scoreAccounts(accounts: Account[]): ScoredAccount[] {
  return accounts.map(scoreAccount).sort((a, b) => b.technicalConsultingPriority.score - a.technicalConsultingPriority.score)
}

export function scoreAccount(account: Account): ScoredAccount {
  const lifecycleRisk = lifecycleRiskScore(account)
  const installedBaseComplexity = complexityScore(account)
  const modernizationFit = modernizationScore(account, lifecycleRisk)
  const serviceUrgency = serviceUrgencyScore(account)
  const dataReadiness = dataReadinessScore(account)
  const salesReadiness = salesReadinessScore(account)
  const priority = priorityScore({
    lifecycleRisk,
    installedBaseComplexity,
    modernizationFit,
    serviceUrgency,
    dataReadiness,
    salesReadiness,
    opportunitySize: account.estimatedOpportunitySize,
  })
  const recommendations = getRecommendations(account)
  const segmentResult = classifySegment(account, {
    lifecycleRisk,
    installedBaseComplexity,
    modernizationFit,
    serviceUrgency,
    dataReadiness,
    salesReadiness,
    priority,
  })

  return {
    account,
    lifecycleRisk,
    installedBaseComplexity,
    modernizationFit,
    serviceUrgency,
    dataReadiness,
    salesReadiness,
    technicalConsultingPriority: priority,
    confidenceLevel: deriveConfidence(account, dataReadiness),
    segment: segmentResult.segment,
    segmentReason: segmentResult.reason,
    recommendedOpportunityType: selectOpportunityType(recommendations, account),
    nextBestAction: recommendations[0]?.nextMove || segmentDefinitions[segmentResult.segment].recommendedNextMove,
    recommendations,
  }
}

export function classifySegment(
  account: Account,
  scores: {
    lifecycleRisk: ScoreDetail
    installedBaseComplexity: ScoreDetail
    modernizationFit: ScoreDetail
    serviceUrgency: ScoreDetail
    dataReadiness: ScoreDetail
    salesReadiness: ScoreDetail
    priority: ScoreDetail
  },
): { segment: PrioritySegment; reason: string } {
  if (scores.priority.score < 36 && scores.salesReadiness.score < 45) {
    return {
      segment: 'Low priority',
      reason: 'Low near-term readiness and limited value signal make immediate pursuit less attractive.',
    }
  }

  if (
    account.strategicFit === 'Strategic' &&
    account.estimatedOpportunitySize >= 800000 &&
    (scores.installedBaseComplexity.score >= 58 || scores.dataReadiness.score >= 72)
  ) {
    return {
      segment: 'Strategic enterprise account',
      reason: 'Large opportunity value and strategic fit justify a roadmap-level conversation.',
    }
  }

  if (
    scores.priority.score >= 72 &&
    scores.salesReadiness.score >= 66 &&
    scores.serviceUrgency.score >= 58 &&
    account.installedBaseConfidence !== 'Low'
  ) {
    return {
      segment: 'Quick win',
      reason: 'Strong readiness, visible urgency, and service context support a short-cycle next step.',
    }
  }

  if (scores.lifecycleRisk.score >= 76 && scores.serviceUrgency.score >= 58) {
    return {
      segment: 'Service-risk account',
      reason: 'Support exposure and reliability risk are the clearest path into the account.',
    }
  }

  if (scores.dataReadiness.score >= 76 && scores.modernizationFit.score >= 58) {
    return {
      segment: 'Data-readiness candidate',
      reason: 'Instrumentation and data availability support a performance pilot or monitoring discussion.',
    }
  }

  if (scores.lifecycleRisk.score >= 58 || scores.modernizationFit.score >= 66) {
    return {
      segment: 'Modernization candidate',
      reason: 'Lifecycle, uptime, or modernization indicators point to a phased upgrade discussion.',
    }
  }

  return {
    segment: 'Education/nurture account',
    reason: 'There are useful signals, but more evidence is needed before pursuing a proposal.',
  }
}

function lifecycleRiskScore(account: Account): ScoreDetail {
  const safetyPressure = account.safetySystemAge >= 18 ? 90 : account.safetySystemAge >= 12 ? 68 : account.safetySystemAge >= 8 ? 45 : 18
  const downtimePressure = normalize(account.estimatedAnnualDowntimeCost, 250000, 2200000)
  const score = weightedAverage([
    [lifecycleStageScore[account.assetLifecycleStage], 0.38],
    [supportRiskScore[account.supportRisk], 0.32],
    [safetyPressure, 0.18],
    [downtimePressure, 0.12],
  ])
  const rules = [
    `${account.assetLifecycleStage} lifecycle stage`,
    `${account.supportRisk} support risk`,
    `${account.safetySystemAge}-year safety system`,
  ]

  return detail(
    'Lifecycle risk',
    score,
    riskLabel(score),
    `Lifecycle risk is driven by ${account.assetLifecycleStage.toLowerCase()} assets, ${account.supportRisk.toLowerCase()} support risk, and a ${account.safetySystemAge}-year safety layer.`,
    rules,
    ['Confirm controller firmware and module availability', 'Document safety validation dates', 'Rank production lines by business criticality'],
  )
}

function complexityScore(account: Account): ScoreDetail {
  const lineScore = normalize(account.productionLines, 3, 18)
  const driveScore = normalize(account.driveMotorCount, 40, 310)
  const sensorScore = normalize(account.sensorCount, 120, 1500)
  const mixedPlatformBump = /mixed|and|local|legacy/i.test(`${account.installedPlcFamily} ${account.installedHmiScadaSystem}`) ? 10 : 0
  const score = clamp(weightedAverage([
    [lineScore, 0.34],
    [driveScore, 0.28],
    [sensorScore, 0.26],
    [mixedPlatformBump, 0.12],
  ]))

  return detail(
    'Installed-base complexity',
    score,
    complexityLabel(score),
    `${account.productionLines} lines, ${account.driveMotorCount} drives/motors, and ${account.sensorCount} sensors define the installed-base surface area.`,
    [
      `${account.productionLines} production lines`,
      `${account.driveMotorCount} drives and motors`,
      `${account.sensorCount} sensors`,
    ],
    ['Standardize equipment taxonomy', 'Identify the most critical asset class', 'Validate platform variation by line'],
  )
}

function modernizationScore(account: Account, lifecycleRisk: ScoreDetail): ScoreDetail {
  const downtimeScore = normalize(account.estimatedAnnualDowntimeCost, 250000, 2000000)
  const score = weightedAverage([
    [interestScore[account.modernizationInterest], 0.32],
    [lifecycleRisk.score, 0.28],
    [strategicFitScore[account.strategicFit], 0.22],
    [downtimeScore, 0.18],
  ])

  return detail(
    'Modernization fit',
    score,
    fitLabel(score),
    `${account.modernizationInterest} modernization interest, ${account.strategicFit.toLowerCase()} strategic fit, and downtime exposure shape the modernization fit.`,
    [
      `${account.modernizationInterest} modernization interest`,
      `${account.strategicFit} strategic fit`,
      `${formatMoney(account.estimatedAnnualDowntimeCost)} annual downtime exposure`,
    ],
    ['Tie scope to a business trigger', 'Define a phased migration path', 'Separate reliability fixes from long-range platform choices'],
  )
}

function serviceUrgencyScore(account: Account): ScoreDetail {
  const serviceSignal = /emergency|active|retainer|quarterly|monthly|support|service|pilot|commissioning/i.test(account.serviceHistory)
    ? 74
    : /no active|no recent|infrequent/i.test(account.serviceHistory)
      ? 28
      : 48
  const triggerSignal = /launch|audit|inspection|outage|funding|season|ramp|refresh|window|readiness/i.test(account.likelyBuyingTrigger)
    ? 82
    : 50
  const score = weightedAverage([
    [supportRiskScore[account.supportRisk], 0.34],
    [normalize(account.estimatedAnnualDowntimeCost, 250000, 2200000), 0.28],
    [serviceSignal, 0.2],
    [triggerSignal, 0.18],
  ])

  return detail(
    'Service urgency',
    score,
    urgencyLabel(score),
    `${account.supportRisk} support risk and the buying trigger "${account.likelyBuyingTrigger}" indicate the urgency of a technical conversation.`,
    [
      `${account.supportRisk} support risk`,
      account.likelyBuyingTrigger,
      account.serviceHistory,
    ],
    ['Capture recent service issues', 'Confirm outage windows', 'Quantify downtime by failure mode'],
  )
}

function dataReadinessScore(account: Account): ScoreDetail {
  const score = weightedAverage([
    [dataAvailabilityScore[account.dataAvailability], 0.44],
    [confidenceScore[account.installedBaseConfidence], 0.26],
    [normalize(account.sensorCount, 120, 1400), 0.2],
    [/Ignition|historian|SCADA|WinCC|DeltaV/i.test(account.installedHmiScadaSystem) ? 78 : 44, 0.1],
  ])

  return detail(
    'Data readiness',
    score,
    readinessLabel(score),
    `${account.dataAvailability} data availability and ${account.installedBaseConfidence.toLowerCase()} installed-base confidence determine how quickly evidence can be gathered.`,
    [
      `${account.dataAvailability} data availability`,
      `${account.installedBaseConfidence} installed-base confidence`,
      `${account.sensorCount} sensors`,
    ],
    ['Validate tag quality', 'Review historian retention', 'Confirm access and ownership for operating data'],
  )
}

function salesReadinessScore(account: Account): ScoreDetail {
  const serviceRelationship = /active|contract|retainer|quarterly|monthly|pilot|support|service/i.test(account.serviceHistory) ? 75 : 38
  const competitorPenalty = /none known/i.test(account.competitorPresence) ? 0 : 10
  const triggerStrength = /budget|funding|launch|audit|inspection|outage|refresh|ramp|program|readiness/i.test(
    `${account.modernizationInterest} ${account.likelyBuyingTrigger}`,
  )
    ? 82
    : 52
  const score = clamp(weightedAverage([
    [interestScore[account.modernizationInterest], 0.32],
    [strategicFitScore[account.strategicFit], 0.26],
    [serviceRelationship, 0.22],
    [triggerStrength, 0.2],
  ]) - competitorPenalty)

  return detail(
    'Sales readiness',
    score,
    readinessLabel(score),
    `${account.modernizationInterest} interest, ${account.strategicFit.toLowerCase()} fit, and service history define account readiness.`,
    [
      `${account.modernizationInterest} modernization interest`,
      `${account.strategicFit} strategic fit`,
      account.likelyBuyingTrigger,
    ],
    ['Validate decision path', 'Confirm economic buyer', 'Identify competitive position and timing'],
  )
}

function priorityScore(input: {
  lifecycleRisk: ScoreDetail
  installedBaseComplexity: ScoreDetail
  modernizationFit: ScoreDetail
  serviceUrgency: ScoreDetail
  dataReadiness: ScoreDetail
  salesReadiness: ScoreDetail
  opportunitySize: number
}): ScoreDetail {
  const valueScore = normalize(input.opportunitySize, 180000, 1500000)
  const score = weightedAverage([
    [input.lifecycleRisk.score, 0.18],
    [input.installedBaseComplexity.score, 0.14],
    [input.modernizationFit.score, 0.22],
    [input.serviceUrgency.score, 0.18],
    [input.dataReadiness.score, 0.1],
    [input.salesReadiness.score, 0.12],
    [valueScore, 0.06],
  ])

  return detail(
    'Technical consulting priority',
    score,
    priorityLabel(score),
    'Priority balances lifecycle risk, modernization fit, urgency, data readiness, account readiness, and opportunity value.',
    [
      `${input.lifecycleRisk.label} lifecycle risk`,
      `${input.modernizationFit.label} modernization fit`,
      `${input.serviceUrgency.label} urgency`,
    ],
    ['Improve installed-base confidence', 'Tie the recommended workshop to an active buying trigger', 'Quantify current downtime cost'],
  )
}

function selectOpportunityType(recommendations: { opportunityType: OpportunityType }[], account: Account): OpportunityType {
  if (recommendations.length > 0) {
    return recommendations[0].opportunityType
  }

  if (account.dataAvailability === 'Sparse') {
    return 'Assessment workshop'
  }

  return 'HMI/SCADA standardization'
}

function deriveConfidence(account: Account, dataReadiness: ScoreDetail): ConfidenceLevel {
  const base = confidenceScore[account.installedBaseConfidence]
  const blended = weightedAverage([
    [base, 0.65],
    [dataReadiness.score, 0.35],
  ])

  if (blended >= 74) return 'High'
  if (blended >= 50) return 'Medium'
  return 'Low'
}

function detail(
  name: string,
  score: number,
  label: string,
  rationale: string,
  triggeredRules: string[],
  improvementLevers: string[],
): ScoreDetail {
  return {
    name,
    score: Math.round(clamp(score)),
    label,
    rationale,
    triggeredRules,
    improvementLevers,
  }
}

function normalize(value: number, min: number, max: number) {
  return clamp(((value - min) / (max - min)) * 100)
}

function weightedAverage(values: [number, number][]) {
  const totalWeight = values.reduce((sum, [, weight]) => sum + weight, 0)
  return values.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

function riskLabel(score: number) {
  if (score >= 78) return 'Critical'
  if (score >= 58) return 'High'
  if (score >= 36) return 'Moderate'
  return 'Low'
}

function complexityLabel(score: number) {
  if (score >= 72) return 'Complex'
  if (score >= 48) return 'Scaled'
  if (score >= 28) return 'Focused'
  return 'Simple'
}

function fitLabel(score: number) {
  if (score >= 76) return 'Strong'
  if (score >= 56) return 'Good'
  if (score >= 36) return 'Emerging'
  return 'Limited'
}

function urgencyLabel(score: number) {
  if (score >= 76) return 'Immediate'
  if (score >= 56) return 'Near term'
  if (score >= 36) return 'Monitor'
  return 'Low'
}

function readinessLabel(score: number) {
  if (score >= 76) return 'Ready'
  if (score >= 56) return 'Developing'
  if (score >= 36) return 'Needs discovery'
  return 'Early'
}

function priorityLabel(score: number) {
  if (score >= 78) return 'Tier 1'
  if (score >= 62) return 'Tier 2'
  if (score >= 44) return 'Tier 3'
  return 'Monitor'
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}
