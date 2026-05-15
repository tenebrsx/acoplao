'use client'

export function ProfitEngineChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
  const data = [
    { rev: 45, prof: 28 },
    { rev: 65, prof: 42 },
    { rev: 55, prof: 35 },
    { rev: 85, prof: 60 },
    { rev: 70, prof: 50 },
    { rev: 95, prof: 68 },
    { rev: 80, prof: 55 },
    { rev: 100, prof: 75 },
  ]

  return (
    <div style={{ padding: '24px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '220px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)', position: 'relative' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100%' }}>
            <div 
              title={`Revenue: $${d.rev}k`}
              style={{ width: '50%', height: `${d.rev}%`, background: 'var(--accent-primary)', borderRadius: '4px 4px 0 0', opacity: 0.8, transition: 'all 0.2s', cursor: 'pointer' }} 
              onMouseOver={e => e.currentTarget.style.opacity = '1'} 
              onMouseOut={e => e.currentTarget.style.opacity = '0.8'} 
            />
            <div 
              title={`Profit: $${d.prof}k`}
              style={{ width: '50%', height: `${d.prof}%`, background: 'var(--success)', borderRadius: '4px 4px 0 0', opacity: 0.8, transition: 'all 0.2s', cursor: 'pointer' }} 
              onMouseOver={e => e.currentTarget.style.opacity = '1'} 
              onMouseOut={e => e.currentTarget.style.opacity = '0.8'} 
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px 0', marginBottom: '24px' }}>
        {months.map(m => (
          <span key={m} style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{m}</span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-primary)' }}/> Revenue ($)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--success)' }}/> Profit ($)</span>
      </div>
    </div>
  )
}
