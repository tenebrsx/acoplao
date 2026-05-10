import { ContractorTable } from '@/components/ContractorTable'
import { Shield, ShieldAlert, UserPlus, Users } from 'lucide-react'

export default async function SettingsPage() {
  // DEV OVERRIDE: no auth check

  return (
    <div className="animate-in delay-100">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Team Management</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage user roles and access. Users are created when they sign in for the first time.
        </p>
      </div>

      {/* Role legend */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', border: '1px solid var(--surface-border)' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role Permissions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { role: 'Admin', desc: 'Full access. Manages businesses, projects, team, and billing.', color: 'var(--accent-primary)' },
            { role: 'Manager', desc: 'Can view and manage assigned projects and deliverables.', color: 'var(--accent-secondary)' },
            { role: 'Contractor', desc: 'Can view assigned projects and mark phase progress.', color: 'var(--success)' },
            { role: 'Client', desc: 'Can view their own projects and review deliverables.', color: 'var(--warning)' },
          ].map(({ role, desc, color }) => (
            <div key={role} style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, marginTop: '6px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>{role}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* User table */}
      <ContractorTable />
    </div>
  )
}
