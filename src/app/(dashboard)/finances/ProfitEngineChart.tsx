'use client'

import { MonthlyFinanceData } from '@/lib/types/finance'

interface ProfitEngineChartProps {
  data: MonthlyFinanceData[]
}

export function ProfitEngineChart({ data }: ProfitEngineChartProps) {
  const formatValue = (val: number): string => {
    return val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val}`
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '24px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No financial data yet</span>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.revenue, d.profit)))

  return (
    <div style={{ padding: '24px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '220px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)', position: 'relative' }}>
        {data.map((d, i) => {
          const revHeight = maxValue > 0 ? (d.revenue / maxValue) * 100 : 0
          const profHeight = maxValue > 0 ? (d.profit / maxValue) * 100 : 0

          return (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100%' }}>
              <div
                title={`Revenue: ${formatValue(d.revenue)}`}
                style={{ width: '50%', height: `${revHeight}%`, background: 'var(--accent-primary)', borderRadius: '4px 4px 0 0', opacity: 0.8, transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 0 12px var(--accent-primary)' }}
                onMouseOut={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.boxShadow = 'none' }}
              />
              <div
                title={`Profit: ${formatValue(d.profit)}`}
                style={{ width: '50%', height: `${profHeight}%`, background: 'var(--success)', borderRadius: '4px 4px 0 0', opacity: 0.8, transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 0 12px var(--success)' }}
                onMouseOut={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px 0', marginBottom: '24px' }}>
        {data.map((d, i) => (
          <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{d.month}</span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-primary)' }} /> Revenue</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--success)' }} /> Profit</span>
      </div>
    </div>
  )
}