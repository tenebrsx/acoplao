'use client'

import Link from 'next/link'
import { FileText, Globe, Lock, Calendar, Tag } from 'lucide-react'
import { DocActions } from './DocActions'
import { FavoriteButton } from '@/components/FavoriteButton'
export function DocListRow({ doc, isFavorite }: { doc: any, isFavorite?: boolean }) {
  const creatorInitial = doc.profiles?.email?.charAt(0).toUpperCase() || '?'

  return (
    <Link 
      href={`/docs/${doc.id}`}
      style={{ 
        textDecoration: 'none', 
        color: 'inherit', 
        display: 'grid', 
        gridTemplateColumns: '1.8fr 1fr 1fr 120px 40px',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--surface-border)',
        transition: 'background 0.2s ease',
        background: 'transparent'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'var(--surface-hover)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <FavoriteButton entityId={doc.id} entityType="document" initialIsFavorite={isFavorite} />
        <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--surface-border)' }}>
          <FileText size={16} color="var(--text-secondary)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{doc.title}</span>
          {doc.tags && doc.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              {doc.tags.map((tag: string) => (
                <span key={tag} style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="avatar avatar-sm" style={{ background: 'var(--surface-hover)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 700 }}>
          {creatorInitial}
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {doc.profiles?.email?.split('@')[0] || 'Unknown'}
        </span>
      </div>

      <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Calendar size={14} />
        {new Date(doc.updated_at).toLocaleDateString()}
      </div>

      <div>
        {doc.is_public ? (
          <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontSize: '0.65rem' }}>
            <Globe size={10} style={{ marginRight: '4px' }} /> Public
          </div>
        ) : (
          <div className="badge" style={{ background: 'var(--surface)', color: 'var(--text-tertiary)', fontSize: '0.65rem', border: '1px solid var(--surface-border)' }}>
            <Lock size={10} style={{ marginRight: '4px' }} /> Private
          </div>
        )}
      </div>

      <DocActions doc={doc} />
    </Link>
  )
}
