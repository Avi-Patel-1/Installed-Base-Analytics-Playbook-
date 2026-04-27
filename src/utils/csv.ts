import { sampleAccounts } from '../data/accounts'
import type {
  Account,
  ConfidenceLevel,
  DataAvailability,
  LifecycleStage,
  ModernizationInterest,
  StrategicFit,
  SupportRisk,
} from '../types'

export const accountColumns: (keyof Account)[] = [
  'accountId',
  'accountName',
  'industrySegment',
  'region',
  'plantType',
  'productionLines',
  'installedPlcFamily',
  'installedHmiScadaSystem',
  'driveMotorCount',
  'sensorCount',
  'safetySystemAge',
  'assetLifecycleStage',
  'supportRisk',
  'downtimePainPoints',
  'modernizationInterest',
  'estimatedAnnualDowntimeCost',
  'serviceHistory',
  'decisionMakerPersona',
  'strategicFit',
  'estimatedOpportunitySize',
  'likelyBuyingTrigger',
  'recommendedNextAction',
  'lastEngagementDate',
  'installedBaseConfidence',
  'competitorPresence',
  'dataAvailability',
  'urgencyNotes',
]

const lifecycleValues: LifecycleStage[] = ['Current', 'Mature', 'Limited support', 'Obsolete']
const supportValues: SupportRisk[] = ['Low', 'Moderate', 'High', 'Critical']
const interestValues: ModernizationInterest[] = ['Low', 'Moderate', 'Active', 'Budgeted']
const strategicValues: StrategicFit[] = ['Low', 'Medium', 'High', 'Strategic']
const confidenceValues: ConfidenceLevel[] = ['Low', 'Medium', 'High']
const dataValues: DataAvailability[] = ['Sparse', 'Partial', 'Usable', 'Rich']

export function parseAccountsCsv(csvText: string) {
  const parsed = parseCsv(csvText)
  const errors = [...parsed.errors]
  const warnings: string[] = []
  const missingColumns = accountColumns.filter((column) => !parsed.headers.includes(column))

  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`)
  }

  const accounts: Account[] = []

  parsed.rows.forEach((row, rowIndex) => {
    if (missingColumns.length > 0) return
    const converted = rowToAccount(row, rowIndex + 2)

    if (converted.errors.length > 0) {
      errors.push(...converted.errors)
    } else if (converted.account) {
      accounts.push(converted.account)
    }

    warnings.push(...converted.warnings)
  })

  return {
    accounts,
    errors,
    warnings,
    rows: parsed.rows,
  }
}

export function parseCsv(csvText: string): { headers: string[]; rows: Record<string, string>[]; errors: string[] } {
  const normalized = csvText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  if (!normalized) {
    return { headers: [], rows: [], errors: ['CSV is empty.'] }
  }

  const lines = normalized.split('\n').filter((line) => line.trim().length > 0)
  const headers = splitCsvLine(lines[0]).map((header) => header.trim())
  const errors: string[] = []

  if (new Set(headers).size !== headers.length) {
    errors.push('CSV headers must be unique.')
  }

  const rows = lines.slice(1).map((line, lineIndex) => {
    const values = splitCsvLine(line)

    if (values.length !== headers.length) {
      errors.push(`Row ${lineIndex + 2} has ${values.length} values but expected ${headers.length}.`)
    }

    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index]?.trim() ?? ''
      return row
    }, {})
  })

  return { headers, rows, errors }
}

export function accountsToCsv(accounts: Account[]) {
  const header = accountColumns.join(',')
  const lines = accounts.map((account) =>
    accountColumns
      .map((column) => {
        const value = account[column]
        return csvEscape(Array.isArray(value) ? value.join('; ') : String(value))
      })
      .join(','),
  )

  return [header, ...lines].join('\n')
}

export const sampleCsv = accountsToCsv(sampleAccounts)

function rowToAccount(row: Record<string, string>, rowNumber: number): { account?: Account; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const numberFields: (keyof Account)[] = [
    'productionLines',
    'driveMotorCount',
    'sensorCount',
    'safetySystemAge',
    'estimatedAnnualDowntimeCost',
    'estimatedOpportunitySize',
  ]

  numberFields.forEach((field) => {
    if (Number.isNaN(Number(row[field])) || row[field].trim() === '') {
      errors.push(`Row ${rowNumber}: ${field} must be a number.`)
    }
  })

  const lifecycle = asOneOf(row.assetLifecycleStage, lifecycleValues, rowNumber, 'assetLifecycleStage', errors)
  const supportRisk = asOneOf(row.supportRisk, supportValues, rowNumber, 'supportRisk', errors)
  const modernizationInterest = asOneOf(row.modernizationInterest, interestValues, rowNumber, 'modernizationInterest', errors)
  const strategicFit = asOneOf(row.strategicFit, strategicValues, rowNumber, 'strategicFit', errors)
  const installedBaseConfidence = asOneOf(row.installedBaseConfidence, confidenceValues, rowNumber, 'installedBaseConfidence', errors)
  const dataAvailability = asOneOf(row.dataAvailability, dataValues, rowNumber, 'dataAvailability', errors)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.lastEngagementDate)) {
    warnings.push(`Row ${rowNumber}: lastEngagementDate should use YYYY-MM-DD format.`)
  }

  if (errors.length > 0) {
    return { errors, warnings }
  }

  return {
    errors,
    warnings,
    account: {
      accountId: row.accountId,
      accountName: row.accountName,
      industrySegment: row.industrySegment,
      region: row.region,
      plantType: row.plantType,
      productionLines: Number(row.productionLines),
      installedPlcFamily: row.installedPlcFamily,
      installedHmiScadaSystem: row.installedHmiScadaSystem,
      driveMotorCount: Number(row.driveMotorCount),
      sensorCount: Number(row.sensorCount),
      safetySystemAge: Number(row.safetySystemAge),
      assetLifecycleStage: lifecycle,
      supportRisk,
      downtimePainPoints: row.downtimePainPoints
        .split(';')
        .map((point) => point.trim())
        .filter(Boolean),
      modernizationInterest,
      estimatedAnnualDowntimeCost: Number(row.estimatedAnnualDowntimeCost),
      serviceHistory: row.serviceHistory,
      decisionMakerPersona: row.decisionMakerPersona,
      strategicFit,
      estimatedOpportunitySize: Number(row.estimatedOpportunitySize),
      likelyBuyingTrigger: row.likelyBuyingTrigger,
      recommendedNextAction: row.recommendedNextAction,
      lastEngagementDate: row.lastEngagementDate,
      installedBaseConfidence,
      competitorPresence: row.competitorPresence,
      dataAvailability,
      urgencyNotes: row.urgencyNotes,
    },
  }
}

function asOneOf<T extends string>(
  value: string,
  allowed: T[],
  rowNumber: number,
  fieldName: string,
  errors: string[],
): T {
  if (allowed.includes(value as T)) {
    return value as T
  }

  errors.push(`Row ${rowNumber}: ${fieldName} must be one of ${allowed.join(', ')}.`)
  return allowed[0]
}

function splitCsvLine(line: string) {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const next = line[index + 1]

    if (character === '"' && next === '"') {
      current += '"'
      index += 1
    } else if (character === '"') {
      inQuotes = !inQuotes
    } else if (character === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += character
    }
  }

  values.push(current)
  return values
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}
