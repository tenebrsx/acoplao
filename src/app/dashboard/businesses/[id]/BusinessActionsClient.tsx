'use client'

import { FileText, Globe } from 'lucide-react'
import Link from 'next/link'

export default function BusinessActionsClient({ businessId }: { businessId: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
      
      {/* Proposal & Invoice Engine */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileText size={16} color="var(--accent-secondary)" /> Document Engine
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Generate branded PDFs from active data.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1, background: 'var(--surface-hover)' }} onClick={() => alert('Generating Proposal PDF...')}>
            Generate Proposal
          </button>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1, background: 'var(--surface-hover)', color: 'var(--success)' }} onClick={() => alert('Generating Invoice PDF...')}>
            Generate Invoice
          </button>
        </div>
      </div>

      {/* Portal Provisioning */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Globe size={16} color="var(--success)" /> Client Portal
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Manage the white-glove external view.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/portal/${businessId}`} target="_blank" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
            View Live Portal
          </Link>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ flex: 1, background: 'var(--surface-hover)' }} 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/portal/${businessId}`)
              alert('Portal Magic Link Copied!')
            }}
          >
            Copy Magic Link
          </button>
        </div>
      </div>

    </div>
  )
}
