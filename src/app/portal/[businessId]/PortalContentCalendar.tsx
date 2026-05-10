'use client'

import React from 'react'
import { Calendar as CalendarIcon, ExternalLink, Video } from 'lucide-react'

type Deliverable = {
  id: string
  title: string
  status_v2: string
  published_url?: string
  publish_date?: string
}

export function PortalContentCalendar({ deliverables }: { deliverables: Deliverable[] }) {
  // Filter deliverables that have a publish_date
  const scheduled = deliverables
    .filter(d => d.publish_date)
    .sort((a, b) => new Date(a.publish_date!).getTime() - new Date(b.publish_date!).getTime())

  const live = deliverables
    .filter(d => d.published_url)
    .sort((a, b) => new Date(b.publish_date || Date.now()).getTime() - new Date(a.publish_date || Date.now()).getTime())

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
      {/* Content Calendar */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarIcon size={20} color="var(--accent-primary)" /> Release Calendar
        </h3>
        
        {scheduled.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--surface-border)', borderRadius: '12px' }}>
            No content scheduled for release yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {scheduled.map(d => (
              <div key={`cal-${d.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={18} color="var(--text-secondary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{d.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {d.status_v2 === 'published' ? 'Published' : 'Scheduled'}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
                  {new Date(d.publish_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Content Feed */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ExternalLink size={20} color="var(--success)" /> Live Content
        </h3>
        
        {live.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--surface-border)', borderRadius: '12px' }}>
            Live links will appear here once content is published.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {live.map(d => (
              <a 
                key={`live-${d.id}`} 
                href={d.published_url} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s' }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--surface-border)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 255, 136, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={18} color="var(--success)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{d.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      View live post
                    </div>
                  </div>
                </div>
                <ExternalLink size={16} color="var(--text-tertiary)" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
