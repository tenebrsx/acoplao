'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, ExternalLink } from 'lucide-react'

export type EmbedType = 'youtube' | 'figma' | 'loom' | 'sheets' | 'miro' | 'generic'

interface EmbedBlockRendererProps {
  embedType: EmbedType
  embedUrl: string
  title?: string
  onUpdate?: (updates: { embedUrl?: string; title?: string }) => void
  onDelete?: () => void
  editable?: boolean
}

function getEmbedSrc(type: EmbedType, url: string): string | null {
  try {
    switch (type) {
      case 'youtube': {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
        const id = match ? match[1] : null
        return id ? `https://www.youtube.com/embed/${id}` : null
      }
      case 'figma': {
        if (url.includes('figma.com')) return `https://www.figma.com/embed?embed_host=aura&url=${encodeURIComponent(url)}`
        return null
      }
      case 'loom': {
        const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
        const id = match ? match[1] : null
        return id ? `https://www.loom.com/embed/${id}` : null
      }
      case 'sheets': {
        if (url.includes('docs.google.com/spreadsheets')) {
          const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
          const id = match ? match[1] : null
          return id ? `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing&rm=minimal` : null
        }
        return null
      }
      case 'miro': {
        if (url.includes('miro.com')) return `https://miro.com/app/live-embed/${url.split('/').pop()}?embedAutoplay=true`
        return null
      }
      default:
        return url
    }
  } catch {
    return null
  }
}

function YouTubeEmbed({ src, title }: { src: string; title?: string }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={src}
        title={title || 'YouTube video'}
        className="absolute inset-0 w-full h-full rounded-xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

function GenericEmbed({ src, title }: { src: string; title?: string }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={src}
        title={title || 'Embedded content'}
        className="absolute inset-0 w-full h-full rounded-xl border"
        allowFullScreen
      />
    </div>
  )
}

function LoomEmbed({ src, title }: { src: string; title?: string }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={src}
        title={title || 'Loom video'}
        className="absolute inset-0 w-full h-full rounded-xl"
        allowFullScreen
      />
    </div>
  )
}

function SheetsEmbed({ src, title }: { src: string; title?: string }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '75%' }}>
      <iframe
        src={src}
        title={title || 'Google Sheets'}
        className="absolute inset-0 w-full h-full rounded-xl border"
      />
    </div>
  )
}

export function EmbedBlockRenderer({
  embedType,
  embedUrl,
  title,
  onUpdate,
  onDelete,
  editable = true,
}: EmbedBlockRendererProps) {
  const [editUrl, setEditUrl] = useState(embedUrl)
  const [editTitle, setEditTitle] = useState(title || '')
  const [isEditing, setIsEditing] = useState(!embedUrl)
  const src = getEmbedSrc(embedType, embedUrl)

  const handleSave = () => {
    onUpdate?.({ embedUrl: editUrl, title: editTitle })
    setIsEditing(false)
  }

  const typeLabels: Record<string, string> = {
    youtube: 'YouTube',
    figma: 'Figma',
    loom: 'Loom',
    sheets: 'Google Sheets',
    miro: 'Miro',
    generic: 'Embed',
  }

  if (isEditing) {
    return (
      <div className="border rounded-xl p-4 bg-card/30 space-y-3 my-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{typeLabels[embedType] || 'Embed'}</span>
          {editable && onDelete && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
              <X size={14} />
            </Button>
          )}
        </div>
        <Input
          placeholder={`Paste ${typeLabels[embedType] || 'embed'} URL...`}
          value={editUrl}
          onChange={e => setEditUrl(e.target.value)}
          className="h-8 text-sm"
        />
        <Input
          placeholder="Title (optional)"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          className="h-8 text-sm"
        />
        <div className="flex gap-2">
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setIsEditing(false); setEditUrl(embedUrl); setEditTitle(title || '') }}>Cancel</Button>
        </div>
      </div>
    )
  }

  if (!src) {
    return (
      <div className="border rounded-xl p-6 bg-card/30 text-center my-4">
        <p className="text-sm text-muted-foreground">Invalid {typeLabels[embedType]} URL</p>
        {editable && (
          <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={() => setIsEditing(true)}>
            Edit URL
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="my-4 group">
      <div className="flex items-center justify-between mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-muted-foreground">{title || typeLabels[embedType] || 'Embed'}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(embedUrl, '_blank')}>
            <ExternalLink size={12} />
          </Button>
          {editable && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)}>
              <span className="text-xs">Edit</span>
            </Button>
          )}
          {editable && onDelete && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDelete}>
              <X size={12} />
            </Button>
          )}
        </div>
      </div>
      {embedType === 'youtube' && <YouTubeEmbed src={src} title={title} />}
      {embedType === 'loom' && <LoomEmbed src={src} title={title} />}
      {embedType === 'sheets' && <SheetsEmbed src={src} title={title} />}
      {(embedType === 'figma' || embedType === 'miro' || embedType === 'generic') && <GenericEmbed src={src} title={title} />}
    </div>
  )
}
