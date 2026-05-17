import { Users } from 'lucide-react'

export default function ClientsPage() {
  return (
    <div className="animate-in delay-100">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Clients & Team</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your client roster and internal team members.</p>
        </div>
        <button className="btn btn-primary">
          Invite User
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(0, 225, 255, 0.1)', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <Users size={32} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Directory</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
          This page is currently under construction. The directory list will be available here soon.
        </p>
      </div>
    </div>
  )
}
