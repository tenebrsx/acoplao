'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { TiptapEditor } from '@/components/TiptapEditor'
import { FileText, Loader2 } from 'lucide-react'

export function ProjectDocument({ projectId }: { projectId: string }) {
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadOrCreateDoc() {
      // Check if a document already exists for this project
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (data) {
        setDoc(data)
      } else {
        // Create a new one
        const { data: { user } } = await supabase.auth.getUser()
        const { data: newDoc } = await supabase
          .from('documents')
          .insert({
            project_id: projectId,
            title: 'Project Workspace',
            content: { type: 'doc', content: [{ type: 'paragraph' }] },
            created_by: user?.id
          })
          .select()
          .single()
        
        if (newDoc) setDoc(newDoc)
      }
      setLoading(false)
    }
    loadOrCreateDoc()
  }, [projectId, supabase])

  const handleUpdate = async (content: any, wordCount: number) => {
    if (!doc) return
    setSaving(true)
    
    // Optimistic
    setDoc({ ...doc, content, word_count: wordCount })
    
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('documents')
      .update({ 
        content, 
        word_count: wordCount,
        last_edited_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', doc.id)
      
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={24} color="var(--text-tertiary)" />
      </div>
    )
  }

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--accent-secondary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Project Workspace</h3>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saving ? (
            <><Loader2 size={12} className="animate-spin" /> Saving...</>
          ) : (
            <>Saved to cloud</>
          )}
        </div>
      </div>
      
      {/* Tiptap Editor Wrapper */}
      <div style={{ padding: '0', background: 'var(--surface)' }}>
        <TiptapEditor 
          content={doc?.content || ''} 
          onUpdate={handleUpdate} 
          editable={true} 
        />
      </div>
    </div>
  )
}
