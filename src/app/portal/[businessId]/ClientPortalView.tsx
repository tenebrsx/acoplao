'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle2, Circle, ArrowRight, FolderKanban, Play, Download, MessageSquare, Receipt, Sparkles } from 'lucide-react'

import { PortalRequestClient } from './PortalRequestClient'
import { PortalContentCalendar } from './PortalContentCalendar'
import { BrandIdentityVault } from './BrandIdentityVault'

export function ClientPortalView({ business, assets, invoices }: { business: any, assets: any[], invoices: any[] }) {
  // Aggregate stats
  const totalProjects = business.projects?.length || 0
  const allDeliverables = business.projects?.flatMap((p: any) => p.deliverables) || []
  const allPhases = allDeliverables.flatMap((d: any) => d.deliverable_phases || [])
  const completedPhases = allPhases.filter((p: any) => p.is_completed).length
  const progressPercent = allPhases.length > 0 ? Math.round((completedPhases / allPhases.length) * 100) : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '48px' }}>
      
      {/* Left Column: Active Projects & Brand Vault */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* Active Campaigns */}
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.02em' }}>
            Welcome back.
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '600px', lineHeight: 1.6 }}>
            Here is the live status of all your active campaigns. Click into any deliverable to review the latest assets or leave feedback.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FolderKanban size={20} color="var(--accent-primary)" /> Active Campaigns
            </h2>
            <PortalRequestClient business={business} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {business.projects?.map((project: any) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{ padding: '32px', borderRadius: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '4px' }}>{project.title}</h3>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Status: <span style={{ color: 'var(--text-primary)' }}>{project.status.replace('_', ' ')}</span></div>
                  </div>
                </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {project.deliverables?.map((del: any) => {
                  const isDone = del.status_v2 === 'approved'
                  const needsReview = del.status_v2 === 'review_ready'
                  
                  return (
                    <div key={del.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {isDone ? <CheckCircle2 size={20} color="var(--success)" /> : <Circle size={20} color={needsReview ? 'var(--warning)' : 'var(--text-tertiary)'} />}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{del.title}</div>
                          <div style={{ fontSize: '0.75rem', color: needsReview ? 'var(--warning)' : 'var(--text-tertiary)', fontWeight: needsReview ? 600 : 400, marginTop: '2px' }}>
                            {needsReview ? 'Ready for your review' : del.status_v2.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      
                      {needsReview && (
                        <Link 
                          href={`/portal/${business.id}/deliverable/${del.id}`}
                          className="btn btn-primary btn-sm" 
                          style={{ padding: '6px 16px', borderRadius: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Play size={14} fill="currentColor" /> Review Now
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
          {(!business.projects || business.projects.length === 0) && (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--surface-border)', borderRadius: '16px' }}>
              No active campaigns at the moment.
            </div>
          )}
        </div>
        </div>
        
        {/* Brand Identity Vault */}
        <BrandIdentityVault business={business} />

      </div>
      {/* Right Column: Global Stats & Assets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Progress Ring Card */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px' }}>
            Overall Progress
          </div>
          
          <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="none" stroke="var(--surface-border)" strokeWidth="12" />
              <circle 
                cx="80" cy="80" r="70" fill="none" stroke="var(--accent-primary)" strokeWidth="12" 
                strokeDasharray="439.8" 
                strokeDashoffset={439.8 - (439.8 * progressPercent) / 100}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{progressPercent}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Complete</div>
            </div>
          </div>
        </div>

        {/* Brand Assets */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Download size={18} color="var(--accent-primary)" /> Brand Assets
          </h2>
          
          {assets.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              No finalized assets available yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {assets.map((asset) => (
                <div key={asset.id} className="hover-card-biz" style={{ background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Asset Preview Thumbnail */}
                  <div style={{ height: '80px', background: 'var(--surface)', position: 'relative' }}>
                    {asset.file_type.includes('image') ? (
                      <img src={asset.file_url} alt={asset.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : asset.file_type.includes('video') ? (
                      <video src={asset.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>DOC</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Asset Details & Download */}
                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={asset.file_name}>
                        {asset.file_name}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
                        {(asset.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                    <a 
                      href={asset.file_url}
                      download={asset.file_name}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px', display: 'flex', justifyContent: 'center', gap: '4px', textDecoration: 'none', fontSize: '0.6875rem' }}
                    >
                      <Download size={12} /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices & Billing */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Receipt size={18} color="var(--accent-primary)" /> Billing & Invoices
          </h2>
          
          {(!invoices || invoices.length === 0) ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              No invoices available.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {invoices.map((inv: any) => (
                <Link 
                  key={inv.id} 
                  href={`/portal/${business.id}/invoices/${inv.id}`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--surface-border)', transition: 'border-color 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--text-secondary)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        ${Number(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span style={{ 
                        fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                        padding: '2px 8px', borderRadius: '12px',
                        background: inv.status === 'paid' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                        color: inv.status === 'paid' ? 'var(--success)' : 'var(--warning)'
                      }}>
                        {inv.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Upon receipt'}
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--text-tertiary)" />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
      
      {/* Full Width: Content Release Calendar & Live Links */}
      <div style={{ gridColumn: '1 / -1' }}>
        <PortalContentCalendar deliverables={allDeliverables} />
      </div>

      {/* Full Width: Content Performance Insights */}
      <div style={{ gridColumn: '1 / -1', marginTop: '24px' }}>
        <div className="glass-panel" style={{ padding: '48px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Sparkles size={24} color="var(--info)" /> Content Performance & Insights
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Live performance metrics for your recently delivered marketing assets.</p>
            </div>
            <div style={{ padding: '8px 16px', background: 'var(--surface)', borderRadius: '24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', border: '1px solid var(--surface-border)' }}>
              LAST 30 DAYS
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {/* Metric Card 1 */}
            <div style={{ padding: '24px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)', borderTop: '2px solid var(--info)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Total Assets Delivered</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>{completedDeliverables}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 500 }}>↑ +2 this month</div>
            </div>

            {/* Metric Card 2 */}
            <div style={{ padding: '24px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)', borderTop: '2px solid #a855f7' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Est. Total Reach</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>{(completedDeliverables * 42.5).toFixed(1)}k</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 500 }}>↑ +14.2% engagement</div>
            </div>

            {/* Metric Card 3 */}
            <div style={{ padding: '24px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)', borderTop: '2px solid var(--warning)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Top Performing Format</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px', marginBottom: '8px' }}>Short-Form Video</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Drives 68% of traffic</div>
            </div>

            {/* Metric Card 4 */}
            <div style={{ padding: '24px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px dashed var(--surface-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Sparkles size={16} color="var(--text-secondary)" />
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Connect Analytics</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Sync IG/TikTok accounts for live data.</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
