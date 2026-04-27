import { describe, expect, it } from 'vitest'
import { parseAccountsCsv, sampleCsv } from './csv'

describe('CSV parsing and validation', () => {
  it('parses the sample CSV into account records', () => {
    const result = parseAccountsCsv(sampleCsv)

    expect(result.errors).toEqual([])
    expect(result.accounts.length).toBeGreaterThanOrEqual(40)
    expect(result.accounts[0].downtimePainPoints.length).toBeGreaterThan(1)
  })

  it('reports missing required columns', () => {
    const result = parseAccountsCsv('accountId,accountName\nIBA-999,Test Account')

    expect(result.errors.join(' ')).toContain('Missing required columns')
    expect(result.accounts).toEqual([])
  })

  it('reports numeric validation errors', () => {
    const lines = sampleCsv.split('\n')
    const headers = lines[0].split(',')
    const row = lines[1].split(',')
    row[headers.indexOf('productionLines')] = 'not-a-number'

    const result = parseAccountsCsv([lines[0], row.join(',')].join('\n'))

    expect(result.errors.join(' ')).toContain('productionLines must be a number')
  })
})
