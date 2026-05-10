'use client'

import React from 'react'
import { Palette, Type, BookOpen, ExternalLink, Link as LinkIcon, Info } from 'lucide-react'

type BrandColor = {
  name: string
  hex: string
}

type BrandTypography = {
  usage: string
  font_family: string
  weight: string
}

export function BrandIdentityVault({ business }: { business: any }) {
  const colors: BrandColor[] = business.brand_colors || []
  const typography: BrandTypography[] = business.brand_typography || []
  const toneOfVoice = business.brand_tone_of_voice
  const strategyUrl = business.brand_strategy_url

  // If completely empty, show a very sleek placeholder indicating it's being prepared
  const isEmpty = colors.length === 0 && typography.length === 0 && !toneOfVoice && !strategyUrl

  if (isEmpty) {
    return (
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '200px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <Palette size={20} color="var(--text-secondary)" />
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Brand Vault Empty</h3>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', maxWidth: '300px' }}>
          The agency is currently compiling your official brand guidelines.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Palette size={20} color="#a855f7" /> Brand Identity Vault
        </h3>
        {strategyUrl && (
          <a href={strategyUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', borderRadius: '24px' }}>
            <BookOpen size={14} /> Brand Strategy Deck <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Colors Grid */}
      {colors.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Official Color Palette
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {colors.map((color, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-primary)', padding: '8px 16px 8px 8px', borderRadius: '32px', border: '1px solid var(--surface-border)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: color.hex, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{color.name}</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{color.hex.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typography & Tone */}
      <div style={{ display: 'grid', gridTemplateColumns: typography.length > 0 && toneOfVoice ? '1fr 1fr' : '1fr', gap: '24px' }}>
        
        {typography.length > 0 && (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              <Type size={14} /> Typography Stack
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {typography.map((type, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: idx !== typography.length - 1 ? '1px dashed var(--surface-border)' : 'none' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{type.usage}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: type.weight as any, color: 'var(--text-primary)' }}>{type.font_family}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{type.weight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {toneOfVoice && (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              <Info size={14} /> Tone of Voice
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              "{toneOfVoice}"
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
