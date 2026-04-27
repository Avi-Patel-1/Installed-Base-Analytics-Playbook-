import type { PrioritySegment, SegmentDefinition } from '../types'

export const segmentDefinitions: Record<PrioritySegment, SegmentDefinition> = {
  'Quick win': {
    name: 'Quick win',
    definition:
      'Strong fit, clear trigger, usable data, and enough service context to justify a near-term customer conversation.',
    recommendedNextMove:
      'Schedule a focused discovery call and confirm the business case before preparing a short proposal.',
    evidenceToCollect: [
      'Recent downtime examples',
      'Current service contract scope',
      'Budget owner and approval path',
      'Preferred implementation window',
    ],
  },
  'Modernization candidate': {
    name: 'Modernization candidate',
    definition:
      'Aging controls, high downtime exposure, or lifecycle pressure create a credible case for modernization planning.',
    recommendedNextMove:
      'Run an installed-base assessment and map risk reduction to phased controls upgrades.',
    evidenceToCollect: [
      'PLC and HMI revision inventory',
      'Unplanned downtime history',
      'Spare parts availability',
      'Line criticality ranking',
    ],
  },
  'Strategic enterprise account': {
    name: 'Strategic enterprise account',
    definition:
      'Large operational footprint, high opportunity value, and strategic fit justify a deeper multi-site engagement.',
    recommendedNextMove:
      'Align around business outcomes, standardization needs, and a roadmap that can scale beyond one plant.',
    evidenceToCollect: [
      'Corporate operations priorities',
      'Site standardization policies',
      'Cross-plant technology variation',
      'Executive sponsor expectations',
    ],
  },
  'Service-risk account': {
    name: 'Service-risk account',
    definition:
      'Support exposure, obsolete assets, or recurring service needs make reliability the primary entry point.',
    recommendedNextMove:
      'Lead with a lifecycle and supportability review before proposing capital work.',
    evidenceToCollect: [
      'Open service issues',
      'Critical spare part gaps',
      'Safety lifecycle dates',
      'Maintenance staffing constraints',
    ],
  },
  'Data-readiness candidate': {
    name: 'Data-readiness candidate',
    definition:
      'The site has enough instrumentation or historian context to support monitoring, analytics, and performance work.',
    recommendedNextMove:
      'Validate data quality and define a pilot around one high-value equipment area.',
    evidenceToCollect: [
      'Historian tag list',
      'Alarm and downtime codes',
      'Network architecture',
      'Data owner and access path',
    ],
  },
  'Education/nurture account': {
    name: 'Education/nurture account',
    definition:
      'The account has some useful indicators, but the timing, data, or business case is not mature enough for a proposal.',
    recommendedNextMove:
      'Share an assessment framework and keep the account warm with targeted technical content.',
    evidenceToCollect: [
      'Known upgrade windows',
      'Pain point severity',
      'Decision criteria',
      'Baseline equipment inventory',
    ],
  },
  'Low priority': {
    name: 'Low priority',
    definition:
      'Current assets, low risk, limited opportunity value, or weak readiness make immediate pursuit less attractive.',
    recommendedNextMove:
      'Monitor for triggers and revisit when lifecycle, downtime, or budget conditions change.',
    evidenceToCollect: [
      'Next capital planning cycle',
      'New production programs',
      'Known reliability incidents',
      'Installed-base confidence updates',
    ],
  },
}
