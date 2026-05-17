'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function NewDocButton({ label = 'New Document' }: { label?: string }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleCreate = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: 'Untitled Document',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        created_by: user?.id || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error("Failed to create document:", error.message, error.code, error)
      alert(`Failed to create document: ${error.message || 'Unknown error'}`)
      setLoading(false)
      return
    }

    if (data) {
      router.push(`/docs/${data.id}`)
    }
  }

  return (
    <button 
      onClick={handleCreate} 
      className="btn btn-primary"
      disabled={loading}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Plus size={16} />
      )}
      {label}
    </button>
  )
}
