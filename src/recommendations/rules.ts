import type { Account, OpportunityType, Recommendation } from '../types'

export interface RecommendationRule {
  id: string
  opportunityType: OpportunityType
  title: string
  applies: (account: Account) => boolean
  rationale: (account: Account) => string
  nextMove: string
  evidenceToCollect: string[]
}

const plcLooksOld = (plc: string) =>
  /PLC-5|SLC|MicroLogix|S7-300|S7-400|Quantum|relay logic/i.test(plc)

const poorVisibility = (account: Account) =>
  account.downtimePainPoints.some((point) =>
    /visibility|manual|historian|logs|reports|boards|SCADA client|line balance/i.test(point),
  )

const hasHighDowntime = (account: Account) =>
  account.estimatedAnnualDowntimeCost >= 750000 || account.supportRisk === 'High' || account.supportRisk === 'Critical'

const hasProcessVariability = (account: Account) =>
  account.downtimePainPoints.some((point) => /yield|variability|recipe|scale-up|scrap|batch/i.test(point))

const hasExistingService = (account: Account) =>
  !/no active|no recent|infrequent/i.test(account.serviceHistory) &&
  /service|support|retainer|contract|pilot|commissioning/i.test(account.serviceHistory)

const hasCompetitor = (account: Account) =>
  !/none known/i.test(account.competitorPresence)

export const recommendationRules: RecommendationRule[] = [
  {
    id: 'old-plc-high-downtime',
    opportunityType: 'Controls modernization discovery',
    title: 'Aging controls with measurable downtime',
    applies: (account) =>
      plcLooksOld(account.installedPlcFamily) &&
      hasHighDowntime(account) &&
      account.assetLifecycleStage !== 'Current',
    rationale: (account) =>
      `${account.installedPlcFamily} assets and ${account.assetLifecycleStage.toLowerCase()} lifecycle status create support risk while downtime exposure is ${formatMoney(account.estimatedAnnualDowntimeCost)} per year.`,
    nextMove: 'Map obsolete controls to a phased modernization path tied to uptime and supportability.',
    evidenceToCollect: ['Controller revision list', 'Critical line ranking', 'Spares availability', 'Downtime by asset family'],
  },
  {
    id: 'motor-count-downtime',
    opportunityType: 'Drive health and predictive maintenance',
    title: 'Large motor and drive footprint with reliability exposure',
    applies: (account) =>
      account.driveMotorCount >= 120 &&
      hasHighDowntime(account) &&
      account.downtimePainPoints.some((point) => /drive|motor|conveyor|pump|crusher|press|web/i.test(point)),
    rationale: (account) =>
      `${account.driveMotorCount} drives and motors give reliability work a large surface area, especially with current pain points around ${account.downtimePainPoints.slice(0, 2).join(' and ')}.`,
    nextMove: 'Prioritize a drive health review and identify one critical asset class for monitoring.',
    evidenceToCollect: ['Drive fault history', 'Motor load profiles', 'Critical spares list', 'Maintenance work orders'],
  },
  {
    id: 'many-lines-poor-visibility',
    opportunityType: 'HMI/SCADA standardization',
    title: 'Multi-line operation with uneven visibility',
    applies: (account) => account.productionLines >= 8 && poorVisibility(account),
    rationale: (account) =>
      `${account.productionLines} production lines and visibility-related pain points indicate standard views, alarm cleanup, and reporting could reduce response time.`,
    nextMove: 'Assess HMI/SCADA standards and define a common operational view for the most critical lines.',
    evidenceToCollect: ['HMI inventory', 'Alarm counts', 'Shift report examples', 'Line performance metrics'],
  },
  {
    id: 'old-safety',
    opportunityType: 'Safety lifecycle review',
    title: 'Safety system age requires lifecycle review',
    applies: (account) => account.safetySystemAge >= 12 || account.downtimePainPoints.some((point) => /safety/i.test(point)),
    rationale: (account) =>
      `The safety layer is ${account.safetySystemAge} years old, which is enough to warrant a review of devices, circuits, validation records, and bypass practices.`,
    nextMove: 'Open with a safety lifecycle review before defining controls scope.',
    evidenceToCollect: ['Safety device inventory', 'Validation records', 'Bypass logs', 'Risk assessment date'],
  },
  {
    id: 'process-complexity',
    opportunityType: 'Digital simulation workshop',
    title: 'Process variability suggests simulation value',
    applies: (account) =>
      hasProcessVariability(account) &&
      (account.strategicFit === 'High' || account.strategicFit === 'Strategic') &&
      account.modernizationInterest !== 'Low',
    rationale: (account) =>
      `Current issues around ${account.downtimePainPoints.slice(0, 2).join(' and ')} suggest a workshop could test operating scenarios before capital is committed.`,
    nextMove: 'Facilitate a simulation workshop around one high-risk process or line expansion.',
    evidenceToCollect: ['Process parameters', 'Current constraints', 'Changeover recipes', 'Planned capacity changes'],
  },
  {
    id: 'existing-service',
    opportunityType: 'Short-cycle service opportunity',
    title: 'Existing service activity can shorten the path to value',
    applies: (account) =>
      hasExistingService(account) &&
      account.modernizationInterest !== 'Low' &&
      account.installedBaseConfidence !== 'Low',
    rationale: (account) =>
      `Recent service context gives the team a credible starting point: ${account.serviceHistory}.`,
    nextMove: 'Convert known service history into a focused reliability or supportability scope.',
    evidenceToCollect: ['Open service items', 'Recent callout notes', 'Stakeholder list', 'Known outage windows'],
  },
  {
    id: 'data-ready',
    opportunityType: 'Analytics and edge monitoring',
    title: 'Data foundation is ready for a performance pilot',
    applies: (account) =>
      (account.dataAvailability === 'Rich' || account.dataAvailability === 'Usable') &&
      account.sensorCount >= 500 &&
      account.modernizationInterest !== 'Low',
    rationale: (account) =>
      `${account.dataAvailability} data availability and ${account.sensorCount} sensors make a focused monitoring pilot practical without waiting for a full platform rebuild.`,
    nextMove: 'Validate data quality and scope a pilot around one expensive downtime mode.',
    evidenceToCollect: ['Tag list', 'Data retention rules', 'Event codes', 'Network access constraints'],
  },
  {
    id: 'competitor-presence',
    opportunityType: 'Discovery-first positioning',
    title: 'Competitive context calls for discovery-first positioning',
    applies: hasCompetitor,
    rationale: (account) =>
      `${account.competitorPresence} is already present, so the first move should avoid over-prescribing and focus on evidence, risk, and decision criteria.`,
    nextMove: 'Use discovery questions to expose gaps before proposing a solution category.',
    evidenceToCollect: ['Current supplier scope', 'Decision criteria', 'Pain points not covered today', 'Contract timing'],
  },
  {
    id: 'low-data-readiness',
    opportunityType: 'Assessment workshop',
    title: 'Low data readiness requires assessment before proposal',
    applies: (account) => account.dataAvailability === 'Sparse' || account.installedBaseConfidence === 'Low',
    rationale: (account) =>
      `${account.dataAvailability} data availability and ${account.installedBaseConfidence.toLowerCase()} installed-base confidence make a discovery workshop the right first step.`,
    nextMove: 'Run a structured installed-base assessment before committing to project scope.',
    evidenceToCollect: ['Asset inventory', 'Network map', 'Downtime examples', 'Decision owner'],
  },
]

export function getRecommendations(account: Account): Recommendation[] {
  const matches = recommendationRules.filter((rule) => rule.applies(account))

  return matches.map((rule) => ({
    id: rule.id,
    opportunityType: rule.opportunityType,
    title: rule.title,
    rationale: rule.rationale(account),
    nextMove: rule.nextMove,
    evidenceToCollect: rule.evidenceToCollect,
  }))
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}
