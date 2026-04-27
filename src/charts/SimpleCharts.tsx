import type { ScoredAccount } from '../types'
import { formatCompactCurrency } from '../utils/format'

export function BarList({
  title,
  data,
  valueLabel,
}: {
  title: string
  data: { label: string; value: number }[]
  valueLabel?: (value: number) => string
}) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="panel chart-panel">
      <h3>{title}</h3>
      <div className="bar-list">
        {data.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
            <strong>{valueLabel ? valueLabel(item.value) : item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DistributionChart({
  title,
  data,
}: {
  title: string
  data: { label: string; value: number; color: string }[]
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1
  const segments = data.reduce<{ label: string; color: string; strokeDasharray: string; strokeDashoffset: number }[]>((items, item) => {
    const previousOffset = items.reduce((sum, segment) => sum + Number(segment.strokeDasharray.split(' ')[0]), 0)
    const dash = (item.value / total) * 100

    return [
      ...items,
      {
        label: item.label,
        color: item.color,
        strokeDasharray: `${dash} ${100 - dash}`,
        strokeDashoffset: -previousOffset,
      },
    ]
  }, [])

  return (
    <div className="panel chart-panel">
      <h3>{title}</h3>
      <div className="distribution">
        <svg viewBox="0 0 42 42" role="img" aria-label={title}>
          <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#e4e9ed" strokeWidth="7" />
          {segments.map((item) => (
            <circle
              key={item.label}
              cx="21"
              cy="21"
              r="15.9"
              fill="transparent"
              stroke={item.color}
              strokeWidth="7"
              strokeDasharray={item.strokeDasharray}
              strokeDashoffset={item.strokeDashoffset}
            />
          ))}
        </svg>
        <div className="legend">
          {data.map((item) => (
            <span key={item.label}>
              <i style={{ background: item.color }} />
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MatrixChart({
  title,
  accounts,
  xLabel,
  yLabel,
  xValue,
  yValue,
}: {
  title: string
  accounts: ScoredAccount[]
  xLabel: string
  yLabel: string
  xValue: (account: ScoredAccount) => number
  yValue: (account: ScoredAccount) => number
}) {
  const top = [...accounts].sort((a, b) => b.account.estimatedOpportunitySize - a.account.estimatedOpportunitySize).slice(0, 24)

  return (
    <div className="panel chart-panel">
      <h3>{title}</h3>
      <svg className="matrix-chart" viewBox="0 0 360 240" role="img" aria-label={title}>
        <line x1="42" y1="198" x2="330" y2="198" stroke="#b8c3cc" />
        <line x1="42" y1="30" x2="42" y2="198" stroke="#b8c3cc" />
        <line x1="186" y1="30" x2="186" y2="198" stroke="#dce3e8" strokeDasharray="4 4" />
        <line x1="42" y1="114" x2="330" y2="114" stroke="#dce3e8" strokeDasharray="4 4" />
        <text x="186" y="226" textAnchor="middle">
          {xLabel}
        </text>
        <text x="14" y="118" textAnchor="middle" transform="rotate(-90 14 118)">
          {yLabel}
        </text>
        {top.map((scored) => {
          const x = 42 + (clamp(xValue(scored)) / 100) * 288
          const y = 198 - (clamp(yValue(scored)) / 100) * 168
          const radius = 4 + Math.min(scored.account.estimatedOpportunitySize / 220000, 9)

          return (
            <g key={scored.account.accountId}>
              <circle cx={x} cy={y} r={radius} fill="#247c8f" fillOpacity="0.78" />
              <title>
                {scored.account.accountName}: {formatCompactCurrency(scored.account.estimatedOpportunitySize)}
              </title>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}
