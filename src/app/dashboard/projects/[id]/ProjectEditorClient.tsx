'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProjectEditorClient({ project }: { project: any }) {
  const [title, setTitle] = useState(project.title || '')
  const [description, setDescription] = useState(project.description || '')
  const [isSaving, setIsSaving] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const saveChanges = async (field: string, value: string) => {
    setIsSaving(true)
    await supabase
      .from('projects')
      .update({ [field]: value })
      .eq('id', project.id)
    setIsSaving(false)
    router.refresh()
  }

  const handleBlur = (field: string, value: string) => {
    if (project[field] !== value) {
      saveChanges(field, value)
    }
  }

  return (
    <div>
      <input 
        type="text" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)}
        onBlur={(e) => handleBlur('title', e.target.value)}
        placeholder="Untitled Project"
        style={{ 
          fontSize: '2rem', 
          fontWeight: 700, 
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          width: '100%',
          outline: 'none',
          padding: 0,
          marginBottom: '8px'
        }} 
      />
      

    </div>
  )
}
