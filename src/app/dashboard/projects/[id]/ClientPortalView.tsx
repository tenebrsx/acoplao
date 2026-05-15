'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, MessageSquare, ExternalLink, Play, Layout, FileVideo, Zap, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { TiptapEditor } from '@/components/TiptapEditor'

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
            Welcome to your dedicated campaign workspace. Track real-time progress, review content assets, and provide feedback.
          </p>

          {/* Client Broadcast */}
          {project.client_broadcast_message && (
            <div style={{ marginTop: '32px', padding: '16px 24px', background: 'rgba(0,225,255,0.1)', border: `1px solid ${brandColor}`, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={20} color="#000" />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: brandColor, marginBottom: '2px' }}>Latest Update</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{project.client_broadcast_message}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        {/* Content Board */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Strategy / Media Pool Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
             {/* Read-only Strategy Brief */}
             {project.strategy_data && (
               <div className="glass-panel" style={{ padding: '24px' }}>
                 <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Zap size={18} color={brandColor} /> Campaign Strategy
                 </h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {project.strategy_data.goal && <div><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Goal</div><div style={{ fontSize: '0.875rem' }}>{project.strategy_data.goal}</div></div>}
                   {project.strategy_data.vibe && <div><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Visual Vibe</div><div style={{ fontSize: '0.875rem' }}>{project.strategy_data.vibe}</div></div>}
                 </div>
               </div>
             )}

             {/* Read-only Media Pool (Simplified) */}
             <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layout size={18} color={brandColor} /> Media & References
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                   <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Reference assets and inspiration links provided by the team.</p>
                </div>
             </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: brandColor }} />
              Campaign Content
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {deliverables.map((del) => {
                const phases = del.deliverable_phases || []
                const allCompleted = phases.length > 0 && phases.every((p: any) => p.is_completed)
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
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: p.is_completed ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                            {p.is_completed ? <CheckCircle2 size={14} color={brandColor} /> : <Circle size={14} />}
                            {p.phase_name}
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
                        {p.is_completed ? (
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                            <CheckCircle2 size={14} />
                          </div>
                        ) : (
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                            {i + 1}
                          </div>
                        )}
                        <span style={{ fontSize: '0.875rem', fontWeight: p.is_completed ? 600 : 500, color: p.is_completed ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                          {p.phase_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Creative Brief (If visible) */}
                {activeDeliverable.is_client_visible && activeDeliverable.creative_brief && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      <Layout size={14} /> Creative Brief & Script
                    </div>
                    <div className="glass-panel" style={{ background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', padding: '12px', borderRadius: '12px' }}>
                      <TiptapEditor 
                        content={activeDeliverable.creative_brief} 
                        onUpdate={() => {}} 
                        editable={false} 
                      />
                    </div>
                  </div>
                )}

                {/* Final Asset Link */}
                {activeDeliverable.file_url && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Final Asset</div>
                    <a 
                      href={activeDeliverable.file_url} 
                      target="_blank" 
                      rel="noopener" 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                        background: 'rgba(0,225,255,0.05)', border: `1px solid ${brandColor}`, 
                        borderRadius: '12px', textDecoration: 'none', color: brandColor, fontWeight: 600
                      }}
                    >
                      <FileVideo size={20} />
                      View Final Content Piece
                      <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
                    </a>
                  </div>
                )}

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
                Select a content piece to view details and action items.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
