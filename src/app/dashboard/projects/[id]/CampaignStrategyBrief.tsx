'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Target, Users, Zap, Save, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function CampaignStrategyBrief({ projectId, initialData, isAdmin }: { projectId: string, initialData: any, isAdmin: boolean }) {
  const [data, setData] = useState(initialData || {})
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    setIsSaving(true)
    await supabase.from('projects').update({ strategy_data: data }).eq('id', projectId)
    setIsSaving(false)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  const updateField = (field: string, value: string) => {
    setData((prev: any) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={18} color="#a855f7" /> Strategy Brief
        </h3>
        <AnimatePresence>
          {showSaved && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Primary Goal</label>
          <textarea 
            readOnly={!isAdmin}
            value={data.goal || ''}
            onChange={(e) => updateField('goal', e.target.value)}
            placeholder="e.g. 100k views on Instagram..."
            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', fontSize: '0.875rem', resize: 'none', outline: 'none' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Target Audience</label>
          <input 
            readOnly={!isAdmin}
            value={data.audience || ''}
            onChange={(e) => updateField('audience', e.target.value)}
            placeholder="e.g. Gen-Z Tech Enthusiasts..."
            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Visual Vibe / Aesthetic</label>
          <input 
            readOnly={!isAdmin}
            value={data.vibe || ''}
            onChange={(e) => updateField('vibe', e.target.value)}
            placeholder="e.g. Minimalist, High-Energy, Lo-Fi..."
            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
          />
        </div>
      </div>

      {isAdmin && (
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Save size={14} /> {isSaving ? 'Saving...' : 'Update Brief'}
        </button>
      )}
    </div>
  )
}
