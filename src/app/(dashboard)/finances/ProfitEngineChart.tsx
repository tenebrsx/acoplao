'use client'

import { useState } from 'react'
import { MonthlyFinanceData } from '@/lib/types/finance'

interface ProfitEngineChartProps {
  data: MonthlyFinanceData[]
}

export function ProfitEngineChart({ data }: ProfitEngineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

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
        
        {/* Dynamic Tooltip */}
        {hoveredIndex !== null && (
          <div
            style={{
              position: 'absolute',
              top: '-15px',
              left: `${((hoveredIndex + 0.5) / data.length) * 100}%`,
              transform: 'translate(-50%, -100%)',
              background: 'rgba(20, 20, 22, 0.96)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px 14px',
              zIndex: 50,
              pointerEvents: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '140px',
              transition: 'left 0.15s ease-out, top 0.15s ease-out'
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
              {data[hoveredIndex].month} Overview
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                Revenue
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                ${data[hoveredIndex].revenue.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                Profit
              </span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                ${data[hoveredIndex].profit.toLocaleString()}
              </span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '2px', paddingTop: '2px', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', gap: '8px' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Margin</span>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                {data[hoveredIndex].revenue > 0 
                  ? `${((data[hoveredIndex].profit / data[hoveredIndex].revenue) * 100).toFixed(0)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        )}

        {data.map((d, i) => {
          const revHeight = maxValue > 0 ? (d.revenue / maxValue) * 100 : 0
          const profHeight = maxValue > 0 ? (d.profit / maxValue) * 100 : 0

          return (
            <div 
              key={i} 
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100%' }}
            >
              <div
                style={{ 
                  width: '50%', 
                  height: `${revHeight}%`, 
                  background: 'var(--accent-primary)', 
                  borderRadius: '4px 4px 0 0', 
                  opacity: hoveredIndex === i ? 1 : 0.8, 
                  transition: 'all 0.2s', 
                  cursor: 'pointer',
                  boxShadow: hoveredIndex === i ? '0 0 12px var(--accent-primary)' : 'none'
                }}
              />
              <div
                style={{ 
                  width: '50%', 
                  height: `${profHeight}%`, 
                  background: 'var(--success)', 
                  borderRadius: '4px 4px 0 0', 
                  opacity: hoveredIndex === i ? 1 : 0.8, 
                  transition: 'all 0.2s', 
                  cursor: 'pointer',
                  boxShadow: hoveredIndex === i ? '0 0 12px var(--success)' : 'none'
                }}
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