'use client'

import Link from 'next/link'
import { FileText, Globe, Lock, Calendar, Tag } from 'lucide-react'
import { DocActions } from './DocActions'
import { FavoriteButton } from '@/components/FavoriteButton'

export function DocCard({ doc, isFavorite }: { doc: any, isFavorite?: boolean }) {
  const creatorInitial = doc.profiles?.email?.charAt(0).toUpperCase() || '?'

  return (
    <Link 
      href={`/docs/${doc.id}`}
      className="glass-panel"
      style={{ 
        padding: '20px', 
        textDecoration: 'none', 
        color: 'inherit', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        transition: 'all 0.2s ease',
        position: 'relative',
        border: '1px solid var(--surface-border)',
        background: 'var(--surface)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'var(--text-tertiary)'
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0,0,0,0.1)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'var(--surface-border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--surface-border)' }}>
            <FileText size={20} color="var(--text-secondary)" />
          </div>
          <FavoriteButton entityId={doc.id} entityType="document" initialIsFavorite={isFavorite} />
        </div>
        <DocActions doc={doc} />
      </div>
      
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '8px', lineHeight: 1.4, color: 'var(--text-primary)' }}>
          {doc.title}
        </h3>
        
        {/* Tags */}
        {doc.tags && doc.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {doc.tags.map((tag: string) => (
              <span key={tag} style={{ fontSize: '0.65rem', background: 'var(--surface-hover)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-tertiary)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Tag size={8} /> {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="avatar avatar-sm" style={{ background: 'var(--surface-hover)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 700 }}>
            {creatorInitial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {doc.profiles?.email?.split('@')[0] || 'Unknown'}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Calendar size={10} />
              {new Date(doc.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {doc.is_public ? (
            <div title="Public" style={{ color: 'var(--success)', opacity: 0.8 }}>
              <Globe size={14} />
            </div>
          ) : (
            <div title="Private" style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}>
              <Lock size={14} />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
