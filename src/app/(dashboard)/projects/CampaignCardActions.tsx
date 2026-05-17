'use client'

import { useState } from 'react'
import { MoreVertical, Trash2, Archive, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function CampaignCardActions({ projectId, projectTitle }: { projectId: string, projectTitle: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete "${projectTitle}"?\nThis action cannot be undone and will delete all associated content assets.`)) {
      setIsOpen(false)
      return
    }

    setIsDeleting(true)
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    
    if (error) {
      alert(`Error deleting campaign: ${error.message}`)
      setIsDeleting(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }} onClick={(e) => e.preventDefault()}>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen) }}
        style={{ 
          background: 'var(--surface)', border: '1px solid var(--surface-border)', 
          color: 'var(--text-tertiary)', padding: '6px', borderRadius: '8px', 
          cursor: 'pointer', display: 'flex', transition: 'all 0.2s' 
        }}
        onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
      >
        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <MoreVertical size={16} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              style={{ position: 'fixed', inset: 0, zIndex: 100 }} 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false) }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              style={{ 
                position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                width: '180px', background: 'var(--bg-secondary)', border: '1px solid var(--surface-border)',
                borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                padding: '8px', zIndex: 101, display: 'flex', flexDirection: 'column', gap: '4px'
              }}
            >
              <button 
                onClick={handleDelete}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
                  background: 'none', border: 'none', borderRadius: '8px',
                  color: 'var(--error)', fontSize: '0.8125rem', fontWeight: 600,
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                <Trash2 size={14} /> Delete Campaign
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
