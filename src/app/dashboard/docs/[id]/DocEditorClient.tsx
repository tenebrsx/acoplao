'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Lock, Loader2, Copy, Check } from 'lucide-react'
import { TiptapEditor } from '@/components/TiptapEditor'

export function DocEditorClient({ doc, isPublicView = false }: { doc: any, isPublicView?: boolean }) {
  const [title, setTitle] = useState(doc.title || 'Untitled Document')
  const [saving, setSaving] = useState(false)
  const [isPublic, setIsPublic] = useState(doc.is_public || false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const titleRef = useRef<HTMLInputElement>(null)

  const saveTitle = async (newTitle: string) => {
    if (newTitle === doc.title || isPublicView) return
    await supabase.from('documents').update({ title: newTitle }).eq('id', doc.id)
  }

  const handleContentUpdate = async (content: any, wordCount: number) => {
    if (isPublicView) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('documents')
      .update({
        content,
        word_count: wordCount,
        last_edited_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', doc.id)
    setSaving(false)
  }

  const togglePublic = async () => {
    if (isPublicView) return
    const newVal = !isPublic
    setIsPublic(newVal)
    await supabase.from('documents').update({ is_public: newVal }).eq('id', doc.id)
  }

  const copyShareLink = () => {
    const url = `${window.location.origin}/docs/shared/${doc.share_token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="animate-in delay-100" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Top bar */}
      {!isPublicView && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link href="/dashboard/docs" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.875rem', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> All Documents
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Save indicator */}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {saving ? (
                <><Loader2 size={12} className="animate-spin" /> Saving...</>
              ) : (
                <>Saved</>
              )}
            </span>

            {/* Public toggle */}
            <button
              onClick={togglePublic}
              className="btn btn-sm btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isPublic ? <Globe size={14} color="var(--success)" /> : <Lock size={14} />}
              {isPublic ? 'Public' : 'Private'}
            </button>

            {/* Share link (only when public) */}
            {isPublic && (
              <button
                onClick={copyShareLink}
                className="btn btn-sm btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      {isPublicView ? (
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '32px',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
      ) : (
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={(e) => saveTitle(e.target.value)}
          placeholder="Untitled Document"
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            width: '100%',
            outline: 'none',
            padding: 0,
            marginBottom: '32px',
            lineHeight: 1.2,
          }}
        />
      )}

      {/* Editor */}
      <div className={isPublicView ? "" : "glass-panel"} style={{ overflow: 'hidden' }}>
        <TiptapEditor
          content={doc.content}
          onUpdate={handleContentUpdate}
          editable={!isPublicView}
        />
      </div>
    </div>
  )
}
