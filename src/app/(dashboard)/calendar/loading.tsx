export default function CalendarLoading() {
  return (
    <div className="animate-in delay-100">
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 320px', gap: '24px', minHeight: 'calc(100vh - 120px)' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ width: '100%', height: '36px', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '24px' }} />
          <div style={{ width: '60%', height: '12px', background: 'var(--surface-hover)', borderRadius: '4px', marginBottom: '16px' }} />
          {[1, 2, 3].map(i => (
            <div key={i} style={{ width: '100%', height: '36px', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '8px' }} />
          ))}
          <div style={{ width: '50%', height: '12px', background: 'var(--surface-hover)', borderRadius: '4px', margin: '24px 0 16px' }} />
          {[1, 2].map(i => (
            <div key={i} style={{ width: '100%', height: '36px', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '8px' }} />
          ))}
        </div>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: '200px', height: '28px', background: 'var(--surface-hover)', borderRadius: '8px' }} />
            <div style={{ width: '120px', height: '28px', background: 'var(--surface-hover)', borderRadius: '8px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--surface-border)' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} style={{ padding: '12px 0', textAlign: 'center' }}>
                <div style={{ width: '24px', height: '10px', background: 'var(--surface-hover)', borderRadius: '2px', margin: '0 auto' }} />
              </div>
            ))}
          </div>
          {[1, 2, 3, 4, 5].map(w => (
            <div key={w} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--surface-border)' }}>
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <div key={d} style={{ minHeight: '120px', borderRight: '1px solid var(--surface-border)', padding: '8px' }}>
                  <div style={{ width: '24px', height: '24px', background: 'var(--surface-hover)', borderRadius: '50%', marginBottom: '8px' }} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ width: '120px', height: '20px', background: 'var(--surface-hover)', borderRadius: '4px', marginBottom: '8px' }} />
          <div style={{ width: '80px', height: '12px', background: 'var(--surface-hover)', borderRadius: '4px', marginBottom: '24px' }} />
          {[1, 2, 3].map(i => (
            <div key={i} style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: '12px', marginBottom: '12px' }}>
              <div style={{ width: '70%', height: '14px', background: 'var(--surface-border)', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '50%', height: '10px', background: 'var(--surface-border)', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
