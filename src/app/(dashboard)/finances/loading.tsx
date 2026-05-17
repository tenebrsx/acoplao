export default function FinancesLoading() {
  return (
    <div className="animate-in delay-100">
      <div style={{ position: 'relative', borderRadius: '16px', marginBottom: '32px', overflow: 'hidden', border: '1px solid var(--surface-border)', background: 'var(--surface)', height: '140px' }}>
        <div style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ width: '200px', height: '28px', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '12px' }} />
            <div style={{ width: '320px', height: '16px', background: 'var(--surface-hover)', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '120px', height: '36px', background: 'var(--surface-hover)', borderRadius: '8px' }} />
            <div style={{ width: '140px', height: '36px', background: 'var(--surface-hover)', borderRadius: '8px' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ width: '60%', height: '10px', background: 'var(--surface-hover)', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ width: '40%', height: '24px', background: 'var(--surface-hover)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px', height: '320px' }}>
            <div style={{ width: '120px', height: '16px', background: 'var(--surface-hover)', borderRadius: '4px', marginBottom: '24px' }} />
            <div style={{ height: '220px', background: 'var(--surface-hover)', borderRadius: '8px' }} />
          </div>
          <div className="glass-panel" style={{ padding: '24px', minHeight: '200px' }}>
            <div style={{ width: '160px', height: '16px', background: 'var(--surface-hover)', borderRadius: '4px', marginBottom: '24px' }} />
            <div style={{ display: 'flex', gap: '16px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: '280px', height: '160px', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--surface-border)' }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px', height: '200px' }}>
            <div style={{ width: '140px', height: '16px', background: 'var(--surface-hover)', borderRadius: '4px', marginBottom: '20px' }} />
            <div style={{ height: '10px', background: 'var(--surface-hover)', borderRadius: '4px', marginBottom: '16px' }} />
            <div style={{ height: '10px', background: 'var(--surface-hover)', borderRadius: '4px' }} />
          </div>
          <div className="glass-panel" style={{ padding: '24px', height: '120px' }}>
            <div style={{ width: '140px', height: '16px', background: 'var(--surface-hover)', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
