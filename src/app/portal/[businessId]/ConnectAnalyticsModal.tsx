'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Instagram, Youtube, Link as LinkIcon, CheckCircle2 } from 'lucide-react'

export function ConnectAnalyticsModal({ businessId, isOpen, onClose }: { businessId: string, isOpen: boolean, onClose: () => void }) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connected, setConnected] = useState<string[]>([])

  const handleConnect = (platform: string) => {
    setConnecting(platform)
    // Simulate OAuth flow delay
    setTimeout(() => {
      setConnecting(null)
      setConnected(prev => [...prev, platform])
    }, 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel"
            style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '24px', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={24} color="var(--info)" /> Connect Accounts
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                  Link your brand's social and analytics accounts to enable real-time ROI tracking and AI-driven content suggestions.
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Instagram */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Instagram size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Instagram</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Reels & Post Analytics</div>
                  </div>
                </div>
                
                {connected.includes('instagram') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600, padding: '8px 16px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '24px' }}>
                    <CheckCircle2 size={16} /> Connected
                  </div>
                ) : (
                  <button 
                    onClick={() => handleConnect('instagram')}
                    disabled={connecting !== null}
                    className="btn btn-secondary btn-sm"
                    style={{ borderRadius: '24px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {connecting === 'instagram' ? 'Connecting...' : <><LinkIcon size={14} /> Connect</>}
                  </button>
                )}
              </div>

              {/* TikTok */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem', fontStyle: 'italic', color: '#00f2fe' }}>t<span style={{ color: '#fe0979' }}>t</span></span>
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>TikTok</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Creator Marketplace Data</div>
                  </div>
                </div>
                
                {connected.includes('tiktok') ? (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600, padding: '8px 16px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '24px' }}>
                    <CheckCircle2 size={16} /> Connected
                  </div>
                ) : (
                  <button 
                    onClick={() => handleConnect('tiktok')}
                    disabled={connecting !== null}
                    className="btn btn-secondary btn-sm"
                    style={{ borderRadius: '24px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {connecting === 'tiktok' ? 'Connecting...' : <><LinkIcon size={14} /> Connect</>}
                  </button>
                )}
              </div>
              
              {/* YouTube */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Youtube size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>YouTube</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Shorts & Channel Analytics</div>
                  </div>
                </div>
                
                {connected.includes('youtube') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600, padding: '8px 16px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '24px' }}>
                    <CheckCircle2 size={16} /> Connected
                  </div>
                ) : (
                  <button 
                    onClick={() => handleConnect('youtube')}
                    disabled={connecting !== null}
                    className="btn btn-secondary btn-sm"
                    style={{ borderRadius: '24px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {connecting === 'youtube' ? 'Connecting...' : <><LinkIcon size={14} /> Connect</>}
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Data is read-only and encrypted. We will never post on your behalf.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
