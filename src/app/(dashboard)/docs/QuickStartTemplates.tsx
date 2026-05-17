'use client'

import { useState } from 'react'
import { Plus, Loader2, FileText, ClipboardList, BookOpen } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const TEMPLATES = [
  {
    id: 'blank',
    title: 'Blank Document',
    icon: <FileText size={20} />,
    content: { type: 'doc', content: [{ type: 'paragraph' }] }
  },
  {
    id: 'meeting',
    title: 'Meeting Notes',
    icon: <ClipboardList size={20} />,
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Meeting Notes' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Date: ' }, { type: 'text', text: new Date().toLocaleDateString(), marks: [{ type: 'bold' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Attendees' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '...' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Agenda' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '...' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Action Items' }] },
        { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '...' }] }] }] }
      ]
    }
  },
  {
    id: 'brief',
    title: 'Project Brief',
    icon: <BookOpen size={20} />,
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Project Brief: [Project Name]' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Objective' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Describe the main goal of this project...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Scope' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '...' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Timeline' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Estimated completion date: ...' }] }
      ]
    }
  }
]

export function QuickStartTemplates() {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleCreate = async (template: typeof TEMPLATES[0]) => {
    setLoadingId(template.id)
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: template.id === 'blank' ? 'Untitled Document' : template.title,
        content: template.content,
        created_by: user?.id || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error("Failed to create document:", error.message)
      alert(`Failed to create document: ${error.message}`)
      setLoadingId(null)
      return
    }

    if (data) {
      router.push(`/docs/${data.id}`)
    }
  }

  return (
    <div style={{ marginBottom: '40px' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Quick Start
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => handleCreate(template)}
            disabled={loadingId !== null}
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              border: '1px solid var(--surface-border)',
              background: 'var(--surface)',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              width: '100%',
              color: 'var(--text-primary)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-tertiary)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.background = 'var(--surface-hover)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--surface-border)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.background = 'var(--surface)'
            }}
          >
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'var(--surface-hover)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}>
              {loadingId === template.id ? <Loader2 size={16} className="animate-spin" /> : template.icon}
            </div>
            <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{template.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
