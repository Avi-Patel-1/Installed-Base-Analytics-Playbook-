export type LifecycleStage = 'Current' | 'Mature' | 'Limited support' | 'Obsolete'

export type SupportRisk = 'Low' | 'Moderate' | 'High' | 'Critical'

export type ModernizationInterest = 'Low' | 'Moderate' | 'Active' | 'Budgeted'

export type StrategicFit = 'Low' | 'Medium' | 'High' | 'Strategic'

export type ConfidenceLevel = 'Low' | 'Medium' | 'High'

export type DataAvailability = 'Sparse' | 'Partial' | 'Usable' | 'Rich'

export type PrioritySegment =
  | 'Quick win'
  | 'Modernization candidate'
  | 'Strategic enterprise account'
  | 'Service-risk account'
  | 'Data-readiness candidate'
  | 'Education/nurture account'
  | 'Low priority'

export type OpportunityType =
  | 'Controls modernization discovery'
  | 'Drive health and predictive maintenance'
  | 'HMI/SCADA standardization'
  | 'Safety lifecycle review'
  | 'Digital simulation workshop'
  | 'Short-cycle service opportunity'
  | 'Analytics and edge monitoring'
  | 'Assessment workshop'
  | 'Discovery-first positioning'

export interface Account {
  accountId: string
  accountName: string
  industrySegment: string
  region: string
  plantType: string
  productionLines: number
  installedPlcFamily: string
  installedHmiScadaSystem: string
  driveMotorCount: number
  sensorCount: number
  safetySystemAge: number
  assetLifecycleStage: LifecycleStage
  supportRisk: SupportRisk
  downtimePainPoints: string[]
  modernizationInterest: ModernizationInterest
  estimatedAnnualDowntimeCost: number
  serviceHistory: string
  decisionMakerPersona: string
  strategicFit: StrategicFit
  estimatedOpportunitySize: number
  likelyBuyingTrigger: string
  recommendedNextAction: string
  lastEngagementDate: string
  installedBaseConfidence: ConfidenceLevel
  competitorPresence: string
  dataAvailability: DataAvailability
  urgencyNotes: string
}

export interface ScoreDetail {
  name: string
  score: number
  label: string
  rationale: string
  triggeredRules: string[]
  improvementLevers: string[]
}

export interface ScoredAccount {
  account: Account
  lifecycleRisk: ScoreDetail
  installedBaseComplexity: ScoreDetail
  modernizationFit: ScoreDetail
  serviceUrgency: ScoreDetail
  dataReadiness: ScoreDetail
  salesReadiness: ScoreDetail
  technicalConsultingPriority: ScoreDetail
  confidenceLevel: ConfidenceLevel
  segment: PrioritySegment
  segmentReason: string
  recommendedOpportunityType: OpportunityType
  nextBestAction: string
  recommendations: Recommendation[]
}

export interface Recommendation {
  id: string
  opportunityType: OpportunityType
  title: string
  rationale: string
  nextMove: string
  evidenceToCollect: string[]
}

export interface SegmentDefinition {
  name: PrioritySegment
  definition: string
  recommendedNextMove: string
  evidenceToCollect: string[]
}

export interface PlaybookSection {
  title: string
  body: string
}

export interface Playbook {
  accountId: string
  accountName: string
  generatedOn: string
  sections: PlaybookSection[]
  questions: string[]
}

export interface ImportResult {
  accounts: Account[]
  errors: string[]
  warnings: string[]
  rows: Record<string, string>[]
}
