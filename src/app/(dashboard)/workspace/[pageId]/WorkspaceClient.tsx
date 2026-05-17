'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'
import { DocBlock } from './DocBlock'
import { KanbanBlock } from './KanbanBlock'
import { TableBlock } from './TableBlock'
import { CanvasBlock } from './CanvasBlock'

export function WorkspaceClient({ page, initialContent }: { page: any, initialContent: any }) {
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleUpdate = async (newContent: any) => {
    setContent(newContent)
    setSaving(true)
    
    await supabase
      .from('workspace_page_content')
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq('page_id', page.id)

    setSaving(false)
  }

  return (
    <div className="animate-in delay-100">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem' }}>{page.icon || '📄'}</span>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {page.title}
              {saving && <Loader2 size={16} className="animate-spin" color="var(--text-tertiary)" />}
            </h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              {page.workspace_sections?.title} / {page.page_type.charAt(0).toUpperCase() + page.page_type.slice(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Block Switcher */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', minHeight: '500px' }}>
        {page.page_type === 'doc' && <DocBlock content={content} onUpdate={handleUpdate} />}
        {page.page_type === 'kanban' && <KanbanBlock content={content} onUpdate={handleUpdate} />}
        {page.page_type === 'table' && <TableBlock content={content} onUpdate={handleUpdate} />}
        {page.page_type === 'canvas' && <CanvasBlock pageId={page.id} initialContent={content} />}
      </div>
    </div>
  )
}
