'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, MessageSquare, ExternalLink, Play } from 'lucide-react'
import { format } from 'date-fns'

export function ClientPortalView({ project, deliverables }: { project: any, deliverables: any[] }) {
  const [activeDeliverable, setActiveDeliverable] = useState<any | null>(null)

  const brandColor = '#00e1ff' // In real app, fetch from project.businesses.brand_color

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      {/* Branded Header */}
      <div style={{ padding: '64px 40px', background: `linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,1) 100%)`, borderRadius: '16px', marginBottom: '40px', border: '1px solid var(--surface-border)', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle Brand Glow */}
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '600px', height: '600px', background: brandColor, filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: brandColor, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Client Portal • {project.businesses?.name || 'Aura Client'}
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '16px' }}>{project.title}</h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.6 }}>
            Welcome to your dedicated project workspace. Track real-time progress, review deliverables, and provide feedback.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        {/* Deliverables Board */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: brandColor }} />
            Project Deliverables
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {deliverables.map((del) => {
              const phases = del.deliverable_phases || []
              const allCompleted = phases.length > 0 && phases.every((p: any) => p.status === 'completed')
              const reviewLink = del.review_links?.[0]

              return (
                <motion.div 
                  key={del.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setActiveDeliverable(del)}
                  style={{ 
                    padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', 
                    border: activeDeliverable?.id === del.id ? `1px solid ${brandColor}` : '1px solid var(--surface-border)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>{del.title}</h3>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                      {phases.map((p: any) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: p.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                          {p.status === 'completed' ? <CheckCircle2 size={14} color={brandColor} /> : <Circle size={14} />}
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    {allCompleted ? (
                      <div style={{ padding: '8px 16px', background: `rgba(0, 225, 255, 0.1)`, color: brandColor, borderRadius: '24px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Ready for Review
                      </div>
                    ) : (
                      <div style={{ padding: '8px 16px', background: 'var(--surface)', color: 'var(--text-secondary)', borderRadius: '24px', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> In Progress
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Right Panel: Review Action */}
        <div>
          <div style={{ position: 'sticky', top: '24px' }}>
            {activeDeliverable ? (
              <div className="glass-panel" style={{ padding: '32px', borderTop: `4px solid ${brandColor}` }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>{activeDeliverable.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
                  {activeDeliverable.description || 'No description provided.'}
                </p>

                {/* Status Block */}
                <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Current Phase</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeDeliverable.deliverable_phases?.map((p: any, i: number) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {p.status === 'completed' ? (
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                            <CheckCircle2 size={14} />
                          </div>
                        ) : (
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                            {i + 1}
                          </div>
                        )}
                        <span style={{ fontSize: '0.875rem', fontWeight: p.status === 'completed' ? 600 : 500, color: p.status === 'completed' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Action */}
                {activeDeliverable.review_links?.[0]?.is_active ? (
                  <button 
                    onClick={() => window.open(`/review/${activeDeliverable.review_links[0].token}`, '_blank')}
                    style={{ width: '100%', padding: '16px', background: brandColor, color: '#000', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Play size={18} fill="currentColor" /> Open Review Room
                  </button>
                ) : (
                  <button disabled style={{ width: '100%', padding: '16px', background: 'var(--surface)', color: 'var(--text-tertiary)', border: '1px dashed var(--surface-border)', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, cursor: 'not-allowed' }}>
                    Files not ready for review
                  </button>
                )}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px dashed var(--surface-border)', borderRadius: '12px', color: 'var(--text-tertiary)' }}>
                Select a deliverable to view details and action items.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
