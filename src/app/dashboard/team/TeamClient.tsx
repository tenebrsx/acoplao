'use client'

import { motion } from 'framer-motion'
import { Users, Shield, Zap } from 'lucide-react'
import { ContractorTable } from '@/components/ContractorTable'

export function TeamClient({ initialTeam, userRole }: { initialTeam: any[], userRole: string }) {
  if (userRole !== 'admin') {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <Shield size={48} color="var(--error)" style={{ margin: '0 auto 20px', opacity: 0.5 }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Only administrators can manage team members and roles.</p>
      </div>
    )
  }

  return (
    <div className="animate-in delay-100" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Team & Access Management</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your agency collaborators, assign roles, and invite new members to the workspace.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass-panel" style={{ padding: '24px 32px', marginBottom: '32px', border: '1px solid var(--surface-border)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} /> Role Architecture
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { role: 'Admin', desc: 'Full system control. Manages clients, finances, and team.', color: 'var(--accent-primary)' },
              { role: 'Manager', desc: 'Campaign operations. Manages assigned campaigns and contractors.', color: 'var(--accent-secondary)' },
              { role: 'Contractor', desc: 'Creative production. Work on assigned assets and tasks.', color: 'var(--info)' },
              { role: 'Client', desc: 'Read-only access. Reviews assets and strategy in their portal.', color: 'var(--warning)' },
            ].map(({ role, desc, color }) => (
              <div key={role} style={{ display: 'flex', gap: '12px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, marginTop: '4px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '4px' }}>{role}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The existing ContractorTable component handles the heavy lifting of invites and member listing */}
        <ContractorTable />
      </motion.div>
    </div>
  )
}
