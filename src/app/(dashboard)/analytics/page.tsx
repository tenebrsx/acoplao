import { LineChart } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="animate-in delay-100">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Analytics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track campaign performance and system metrics.</p>
        </div>
        <button className="btn btn-secondary glass-panel">
          Export Report
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <LineChart size={32} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Insights Engine</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
          This page is currently under construction. Live data ingestion will appear here soon.
        </p>
      </div>
    </div>
  )
}
