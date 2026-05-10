'use client'

import { useState, useEffect } from 'react'
import { TiptapEditor } from '@/components/TiptapEditor'
import { createClient } from '@/utils/supabase/client'
import { Save, Share2, Globe, Lock, ArrowLeft, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function DocEditorClient({ docId, initialDoc, isPublicView = false }: { docId: string, initialDoc: any, isPublicView?: boolean }) {
  const [content, setContent] = useState(initialDoc.content || '<p></p>')
  const [title, setTitle] = useState(initialDoc.title || 'Untitled Document')
  const [wordCount, setWordCount] = useState(initialDoc.word_count || 0)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date(initialDoc.updated_at))
  const [isPublic, setIsPublic] = useState(initialDoc.is_public || false)
  const [shareToken, setShareToken] = useState(initialDoc.share_token)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const saveDocument = async (newContent: any, newWordCount: number, newTitle?: string) => {
    if (isPublicView) return // Don't save if in public read-only view
    
    setIsSaving(true)
    const currentTitle = newTitle !== undefined ? newTitle : title
    
    const { error } = await supabase
      .from('documents')
      .update({
        content: newContent,
        word_count: newWordCount,
        title: currentTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', docId)

    setIsSaving(false)
    if (!error) {
      setLastSaved(new Date())
      if (newContent !== content) setContent(newContent)
      if (newWordCount !== wordCount) setWordCount(newWordCount)
      if (newTitle !== undefined && newTitle !== title) setTitle(newTitle)
    }
  }

  const togglePublic = async () => {
    const newValue = !isPublic
    setIsPublic(newValue)
    
    const { error } = await supabase
      .from('documents')
      .update({ is_public: newValue })
      .eq('id', docId)
      
    if (error) {
      setIsPublic(!newValue) // Revert on error
      alert('Failed to update sharing settings')
    }
  }

  const copyShareLink = () => {
    const url = `${window.location.origin}/docs/shared/${shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          {!isPublicView && (
            <Link href="/dashboard/docs" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={20} />
            </Link>
          )}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              saveDocument(content, wordCount, e.target.value)
            }}
            readOnly={isPublicView}
            placeholder="Document Title"
            style={{ 
              fontSize: '1.5rem', fontWeight: 600, background: 'transparent', 
              border: 'none', color: 'var(--text-primary)', outline: 'none',
              width: '50%', padding: '4px 0'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Status */}
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSaving ? (
              <><Loader2 size={12} className="animate-spin" /> Saving...</>
            ) : lastSaved ? (
              <><Save size={12} /> Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
            ) : null}
            <span style={{ margin: '0 8px' }}>•</span>
            <span>{wordCount} words</span>
          </div>

          {/* Share Menu */}
          {!isPublicView && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="btn btn-secondary btn-sm"
                style={{ background: isPublic ? 'var(--surface-hover)' : '', color: isPublic ? 'var(--text-primary)' : '', borderColor: isPublic ? 'var(--text-primary)' : '' }}
              >
                <Share2 size={14} /> Share
              </button>
              
              {showShareMenu && (
                <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', padding: '16px', width: '280px', zIndex: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>Share Document</h4>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface)', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isPublic ? <Globe size={16} color="var(--accent-primary)" /> : <Lock size={16} color="var(--text-tertiary)" />}
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Public Link</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{isPublic ? 'Anyone with link can view' : 'Only collaborators'}</div>
                      </div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
                      <input type="checkbox" checked={isPublic} onChange={togglePublic} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ 
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: isPublic ? 'var(--success)' : 'var(--surface-border)', 
                        transition: '.4s', borderRadius: '34px' 
                      }}>
                        <span style={{ 
                          position: 'absolute', content: '""', height: '14px', width: '14px', 
                          left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', 
                          borderRadius: '50%', transform: isPublic ? 'translateX(16px)' : 'none' 
                        }} />
                      </span>
                    </label>
                  </div>
                  
                  {isPublic && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Public URL</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          readOnly 
                          value={`${window.location.origin}/docs/shared/${shareToken}`} 
                          style={{ flex: 1, padding: '8px', fontSize: '0.75rem', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '6px', color: 'var(--text-secondary)' }}
                        />
                        <button onClick={copyShareLink} className="btn btn-primary" style={{ padding: '8px' }}>
                          {copied ? <Check size={14} /> : <Share2 size={14} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editor Space */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <TiptapEditor 
          content={content} 
          onUpdate={saveDocument} 
          editable={!isPublicView}
        />
      </div>
      
      {showShareMenu && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }} 
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  )
}
