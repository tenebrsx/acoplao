'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function BusinessEditorClient({ business }: { business: any }) {
  const [name, setName] = useState(business.name || '')
  const [contactName, setContactName] = useState(business.contact_name || '')
  const [contactEmail, setContactEmail] = useState(business.contact_email || '')
  const [notes, setNotes] = useState(business.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const saveChanges = async (field: string, value: string) => {
    setIsSaving(true)
    await supabase
      .from('businesses')
      .update({ [field]: value })
      .eq('id', business.id)
    setIsSaving(false)
    router.refresh()
  }

  const handleBlur = (field: string, value: string) => {
    if (business[field] !== value) {
      saveChanges(field, value)
    }
  }

  return (
    <div>
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)}
        onBlur={(e) => handleBlur('name', e.target.value)}
        placeholder="Untitled Business"
        style={{ 
          fontSize: '2.5rem', 
          fontWeight: 700, 
          letterSpacing: '-0.02em',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          width: '100%',
          outline: 'none',
          padding: 0,
          marginBottom: '8px'
        }} 
      />
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <input 
          type="text" 
          value={contactName} 
          onChange={(e) => setContactName(e.target.value)}
          onBlur={(e) => handleBlur('contact_name', e.target.value)}
          placeholder="Add contact name..."
          style={{ 
            fontSize: '0.9375rem', 
            color: 'var(--text-tertiary)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0
          }} 
        />
        <input 
          type="email" 
          value={contactEmail} 
          onChange={(e) => setContactEmail(e.target.value)}
          onBlur={(e) => handleBlur('contact_email', e.target.value)}
          placeholder="Add contact email..."
          style={{ 
            fontSize: '0.9375rem', 
            color: 'var(--text-tertiary)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0
          }} 
        />
      </div>
      
      <textarea 
        value={notes} 
        onChange={(e) => setNotes(e.target.value)}
        onBlur={(e) => handleBlur('notes', e.target.value)}
        placeholder="Add notes about this client..."
        style={{ 
          width: '100%', 
          background: 'transparent', 
          border: 'none', 
          color: 'var(--text-secondary)', 
          fontSize: '1rem', 
          lineHeight: 1.6,
          outline: 'none',
          resize: 'none',
          padding: 0,
          minHeight: '60px'
        }} 
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
      />
    </div>
  )
}
