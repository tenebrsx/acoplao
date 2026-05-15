'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, LinkIcon, Plus, Trash2, Loader2, GripVertical, X, Eye, EyeOff, Save, Milestone, Info, FileVideo, Layout, MessageSquare, ExternalLink } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { TiptapEditor } from '@/components/TiptapEditor'

type Phase = {
  id: string
  phase_name: string
  scheduled_date: string
  is_completed: boolean
  sort_order: number
}

type Deliverable = {
  id: string
  title: string
  description: string | null
  status_v2: string
  file_url: string | null
  deliverable_phases: Phase[]
  review_links?: any[]
  creative_brief: any
  is_client_visible: boolean
}

export function DeliverablesClient({ 
  projectId, 
  initialDeliverables 
}: { 
  projectId: string, 
  initialDeliverables: Deliverable[] 
}) {
  const [deliverables, setDeliverables] = useState(initialDeliverables)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const selectedAsset = deliverables.find(d => d.id === selectedAssetId)

  // Dynamic columns generation based on all unique phase names
  const columnsMap = new Map<string, number>()
  deliverables.forEach(d => {
    d.deliverable_phases.forEach(p => {
      if (!columnsMap.has(p.phase_name) || columnsMap.get(p.phase_name)! > p.sort_order) {
        columnsMap.set(p.phase_name, p.sort_order)
      }
    })
  })
  const columns = Array.from(columnsMap.entries())
    .sort((a, b) => a[1] - b[1])
    .map(c => c[0])

  // ---- NEW TASK ----
  const createDeliverable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const titleInput = form.elements.namedItem('title') as HTMLInputElement
    const title = titleInput.value.trim()
    if (!title) return

    titleInput.disabled = true
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: newDeliv } = await supabase.from('deliverables').insert({
      project_id: projectId,
      title,
      status_v2: 'in_progress',
      created_by: user?.id,
    }).select('id').single()

    if (newDeliv) {
      // Log activity
      await supabase.from('campaign_activity').insert({
        project_id: projectId,
        user_id: user?.id,
        action: 'asset_created',
        target_name: title
      })

      // Create creative matrix standard phases
      const baseDate = new Date()
      const defaultPhases = [
        { phase_name: 'Pre-Prod', sort_order: 1, offset: 0 },
        { phase_name: 'Audio', sort_order: 2, offset: 1 },
        { phase_name: 'Video', sort_order: 3, offset: 1 },
        { phase_name: 'Editing', sort_order: 4, offset: 3 },
        { phase_name: 'Delivery', sort_order: 5, offset: 4 },
      ]
      
      const phaseRows = defaultPhases.map(p => {
        const d = new Date(baseDate)
        d.setDate(d.getDate() + p.offset)
        return {
          deliverable_id: newDeliv.id,
          phase_name: p.phase_name,
          scheduled_date: d.toISOString().split('T')[0],
          sort_order: p.sort_order,
        }
      })
      await supabase.from('deliverable_phases').insert(phaseRows)
      
      router.refresh()
      form.reset()
    }
    titleInput.disabled = false
  }

  const createFromTemplate = async (type: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Notion-style templates pre-filled briefs (Tiptap JSON structure)
    const templates: Record<string, any> = {
      'Reel': {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🎬 Reel Creative Brief' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '🪝 The Hook' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Enter high-engagement hook here...' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '📝 The Script' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Draft your script or outline...' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '📢 CTA' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'What should they do next?' }] }
        ]
      },
      'Carousel': {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📊 Carousel Breakdown' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Slide 1: Hook Headline' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Slide 2: Context/Problem' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Slide 3: Value/Solution' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Slide 4: Detailed Tip' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Slide 5: CTA' }] }
        ]
      },
      'Static Post': {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🖼️ Static Post Strategy' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Caption' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Write the main caption here...' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Image Refs' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Links to inspiration...' }] }
        ]
      }
    }

    const { data: newDeliv } = await supabase.from('deliverables').insert({
      project_id: projectId,
      title: `Untitled ${type}`,
      status_v2: 'in_progress',
      created_by: user?.id,
      creative_brief: templates[type] || null
    }).select('id').single()

    if (newDeliv) {
      // Log activity
      await supabase.from('campaign_activity').insert({
        project_id: projectId,
        user_id: user?.id,
        action: 'asset_created',
        target_name: `New ${type}`
      })

      // Standard phases
      const baseDate = new Date()
      const defaultPhases = [
        { phase_name: 'Idea', sort_order: 1, offset: 0 },
        { phase_name: 'Script', sort_order: 2, offset: 1 },
        { phase_name: 'Editing', sort_order: 3, offset: 3 },
        { phase_name: 'Review', sort_order: 4, offset: 4 },
        { phase_name: 'Final', sort_order: 5, offset: 5 },
      ]
      
      const phaseRows = defaultPhases.map(p => {
        const d = new Date(baseDate)
        d.setDate(d.getDate() + p.offset)
        return {
          deliverable_id: newDeliv.id,
          phase_name: p.phase_name,
          scheduled_date: d.toISOString().split('T')[0],
          sort_order: p.sort_order,
        }
      })
      await supabase.from('deliverable_phases').insert(phaseRows)
      
      router.refresh()
      setSelectedAssetId(newDeliv.id) // Open the workspace immediately
    }
  }

  // ---- TOGGLE PHASE ----
  const togglePhase = async (deliverableId: string, phaseId: string, currentlyCompleted: boolean) => {
    const asset = deliverables.find(d => d.id === deliverableId)
    const phase = asset?.deliverable_phases.find(p => p.id === phaseId)

    setDeliverables(prev => prev.map(d => {
      if (d.id !== deliverableId) return d
      return {
        ...d,
        deliverable_phases: d.deliverable_phases.map(p => 
          p.id === phaseId ? { ...p, is_completed: !currentlyCompleted } : p
        )
      }
    }))

    const { data: { user } } = await supabase.auth.getUser()
    if (currentlyCompleted) {
      await supabase.from('deliverable_phases').update({
        is_completed: false,
        completed_at: null,
        completed_by: null,
      }).eq('id', phaseId)
    } else {
      await supabase.from('deliverable_phases').update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user?.id,
      }).eq('id', phaseId)

      // Log activity only on completion
      await supabase.from('campaign_activity').insert({
        project_id: projectId,
        user_id: user?.id,
        action: 'phase_completed',
        target_name: `${asset?.title}: ${phase?.phase_name}`
      })
    }
    router.refresh()
  }
  // ---- DELETE TASK ----
  const deleteDeliverable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content piece?')) return
    setDeliverables(prev => prev.filter(d => d.id !== id))
    await supabase.from('deliverables').delete().eq('id', id)
    if (selectedAssetId === id) setSelectedAssetId(null)
    router.refresh()
  }

  const updateAssetField = async (id: string, field: string, value: any) => {
    const asset = deliverables.find(d => d.id === id)
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
    await supabase.from('deliverables').update({ [field]: value }).eq('id', id)
    
    // Log status change
    if (field === 'status_v2' && value !== asset?.status_v2) {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('campaign_activity').insert({
        project_id: projectId,
        user_id: user?.id,
        action: 'status_change',
        target_name: `${asset?.title} ➔ ${value.replace('_', ' ')}`
      })
    }

    router.refresh()
  }

  const [viewMode, setViewMode] = useState<'matrix' | 'board'>('board')

  return (
    <div className="animate-in fade-in" style={{ animationDuration: '400ms', position: 'relative' }}>
      
      {/* View Toggles */}
      {deliverables.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <div style={{ display: 'flex', background: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <button 
              onClick={() => setViewMode('matrix')}
              style={{ padding: '6px 12px', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '4px', background: viewMode === 'matrix' ? 'var(--surface-hover)' : 'transparent', color: viewMode === 'matrix' ? 'var(--text-primary)' : 'var(--text-tertiary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Pipeline Matrix
            </button>
            <button 
              onClick={() => setViewMode('board')}
              style={{ padding: '6px 12px', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '4px', background: viewMode === 'board' ? 'var(--surface-hover)' : 'transparent', color: viewMode === 'board' ? 'var(--text-primary)' : 'var(--text-tertiary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Content Board
            </button>
          </div>
        </div>
      )}

      
      {(!deliverables || deliverables.length === 0) ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          No content assets yet. Create your first one to initialize the pipeline.
        </div>
      ) : viewMode === 'matrix' ? (
        <div className="glass-panel" style={{ overflowX: 'auto', background: 'var(--surface)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Content Piece / Milestone
                </th>
                {columns.map(col => (
                  <th key={col} style={{ padding: '16px 12px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-tertiary)', fontWeight: 500, fontSize: '0.8125rem', width: '120px', textAlign: 'center' }}>
                    {col}
                  </th>
                ))}
                <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {deliverables.map((d) => {
                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} onClick={() => setSelectedAssetId(d.id)}>
                    
                    {/* Task Info Cell */}
                    <td style={{ padding: '16px 20px', minWidth: '280px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.title}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description || 'No description...'}</div>
                        
                        {/* Status Badge */}
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="badge" style={{
                            background: d.status_v2 === 'approved' ? 'rgba(16, 185, 129, 0.1)' :
                              d.status_v2 === 'rejected' ? 'rgba(239, 68, 68, 0.1)' :
                              d.status_v2 === 'delivered' ? 'rgba(0, 225, 255, 0.1)' : 'var(--bg-primary)',
                            color: d.status_v2 === 'approved' ? 'var(--success)' :
                              d.status_v2 === 'rejected' ? 'var(--error)' :
                              d.status_v2 === 'delivered' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                            textTransform: 'capitalize',
                            fontSize: '0.7rem'
                          }}>
                            {(d.status_v2 || 'in_progress').replace('_', ' ')}
                          </span>
                          {d.is_client_visible && <Eye size={12} color="var(--accent-primary)" title="Visible to Client" />}
                        </div>
                      </div>
                    </td>

                    {/* Phase Cells */}
                    {columns.map(col => {
                      const phase = d.deliverable_phases.find(p => p.phase_name === col)
                      
                      // AI Risk Detection: If phase is not completed and scheduled date is in the past
                      let isAtRisk = false
                      if (phase && !phase.is_completed && phase.scheduled_date) {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const scheduled = new Date(phase.scheduled_date)
                        if (scheduled < today) isAtRisk = true
                      }

                      return (
                        <td key={col} style={{ padding: '16px 12px', textAlign: 'center', verticalAlign: 'top', position: 'relative' }}>
                          {phase ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
                              
                              {/* Risk Badge */}
                              {isAtRisk && (
                                <div style={{ position: 'absolute', top: '-12px', right: '-12px', background: 'var(--error)', color: 'var(--bg-primary)', fontSize: '0.6rem', fontWeight: 800, padding: '2px 4px', borderRadius: '4px', textTransform: 'uppercase', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)', zIndex: 5 }}>
                                  Risk
                                </div>
                              )}

                              <button 
                                onClick={(e) => { e.stopPropagation(); togglePhase(d.id, phase.id, phase.is_completed) }}
                                style={{ 
                                  color: phase.is_completed ? 'var(--success)' : isAtRisk ? 'var(--error)' : 'var(--surface-border)', 
                                  background: phase.is_completed ? 'rgba(16, 185, 129, 0.1)' : isAtRisk ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                  border: `1px solid ${phase.is_completed || isAtRisk ? 'transparent' : 'var(--text-tertiary)'}`,
                                  borderRadius: '50%', width: '28px', height: '28px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', transition: 'all 0.2s ease',
                                  boxShadow: isAtRisk ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none'
                                }}
                              >
                                {phase.is_completed ? <CheckCircle2 size={16} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--surface-border)' }}>-</span>
                          )}
                        </td>
                      )
                    })}

                    {/* Delete Cell */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'top', textAlign: 'right' }}>
                      <button onClick={(e) => { e.stopPropagation(); deleteDeliverable(d.id) }} style={{ color: 'var(--text-tertiary)', padding: '4px', opacity: 0.5, transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '1'} onMouseOut={e => e.currentTarget.style.opacity = '0.5'}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px', minHeight: '600px', alignItems: 'flex-start' }}>
          {['not_started', 'in_progress', 'review', 'approved', 'delivered'].map(status => {
            const cols = deliverables.filter(d => {
              const s = d.status_v2 || 'in_progress'
              if (status === 'not_started' && !d.status_v2) return false // default is in_progress
              return s === status
            })
            
            return (
              <div key={status} style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <h4 style={{ textTransform: 'capitalize', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: status === 'approved' ? 'var(--success)' : status === 'delivered' ? 'var(--accent-secondary)' : status === 'review' ? 'var(--warning)' : 'var(--text-tertiary)' }} />
                    {status.replace('_', ' ')}
                  </div>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', background: 'var(--surface-hover)', padding: '2px 8px', borderRadius: '10px' }}>{cols.length}</span>
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '100px' }}>
                  {cols.map(d => {
                    let deliverableAtRisk = false
                    d.deliverable_phases.forEach(phase => {
                      if (!phase.is_completed && phase.scheduled_date) {
                        const today = new Date()
                        today.setHours(0,0,0,0)
                        if (new Date(phase.scheduled_date) < today) deliverableAtRisk = true
                      }
                    })

                    return (
                      <div 
                        key={d.id} 
                        className="glass-panel" 
                        onClick={() => setSelectedAssetId(d.id)}
                        style={{ padding: '16px', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s', border: `1px solid ${deliverableAtRisk ? 'var(--error)' : 'var(--surface-border)'}`, boxShadow: deliverableAtRisk ? '0 4px 15px rgba(239, 68, 68, 0.1)' : 'none' }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = deliverableAtRisk ? 'var(--error)' : 'var(--text-secondary)' }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = deliverableAtRisk ? 'var(--error)' : 'var(--surface-border)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {d.title}
                            {deliverableAtRisk && <span style={{ background: 'var(--error)', color: 'var(--bg-primary)', fontSize: '0.6rem', padding: '2px 4px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800 }}>Risk</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {d.is_client_visible && <Eye size={12} color="var(--accent-primary)" />}
                            <GripVertical size={14} color="var(--surface-border)" />
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {d.description || 'No description available.'}
                        </div>
                        
                        {/* Phases Mini View */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {columns.map(col => {
                            const phase = d.deliverable_phases.find(p => p.phase_name === col)
                            let isPhaseAtRisk = false
                            if (phase && !phase.is_completed && phase.scheduled_date) {
                              const today = new Date()
                              today.setHours(0,0,0,0)
                              if (new Date(phase.scheduled_date) < today) isPhaseAtRisk = true
                            }

                            return phase ? (
                              <div key={col} title={`${col}: ${phase.is_completed ? 'Done' : 'Pending'}`} style={{ flex: 1, height: '4px', borderRadius: '2px', background: phase.is_completed ? 'var(--success)' : isPhaseAtRisk ? 'var(--error)' : 'var(--surface-hover)' }} />
                            ) : <div key={col} style={{ flex: 1, height: '4px' }} />
                          })}
                        </div>
                      </div>
                    )
                  })}
                  {cols.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--surface-border)', border: '1px dashed var(--surface-border)', borderRadius: '8px', fontSize: '0.8125rem' }}>
                      Empty
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Inline Create & Templates */}
      <div style={{ padding: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Plus size={16} color="var(--accent-secondary)" />
          <form onSubmit={createDeliverable} style={{ flex: 1, margin: 0 }}>
            <input 
              type="text" 
              name="title" 
              placeholder="Create a new content piece..."
              style={{ 
                width: '100%', background: 'transparent', border: 'none', 
                color: 'var(--accent-secondary)', fontSize: '0.9375rem', outline: 'none', fontWeight: 500
              }} 
            />
          </form>
        </div>

        <div style={{ display: 'flex', gap: '8px', paddingLeft: '28px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', alignSelf: 'center', marginRight: '4px' }}>Quick Templates:</span>
          <button 
            onClick={() => createFromTemplate('Reel')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.7rem', padding: '4px 10px' }}
          >
            <FileVideo size={12} /> + Reel
          </button>
          <button 
            onClick={() => createFromTemplate('Carousel')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.7rem', padding: '4px 10px' }}
          >
            <Layout size={12} /> + Carousel
          </button>
          <button 
            onClick={() => createFromTemplate('Static Post')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.7rem', padding: '4px 10px' }}
          >
            <Info size={12} /> + Static
          </button>
        </div>
      </div>

      {/* Asset Workspace Side Panel (Notion-style) */}
      <AnimatePresence>
        {selectedAssetId && selectedAsset && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAssetId(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 100 }}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '700px', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--surface-border)', zIndex: 101, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' }}
            >
              {/* Panel Header */}
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <button onClick={() => setSelectedAssetId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                    <X size={20} />
                  </button>
                  <input 
                    defaultValue={selectedAsset.title}
                    onBlur={(e) => updateAssetField(selectedAsset.id, 'title', e.target.value)}
                    style={{ fontSize: '1.25rem', fontWeight: 700, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => updateAssetField(selectedAsset.id, 'is_client_visible', !selectedAsset.is_client_visible)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', 
                      background: selectedAsset.is_client_visible ? 'rgba(0,225,255,0.1)' : 'var(--surface)',
                      border: `1px solid ${selectedAsset.is_client_visible ? 'var(--accent-primary)' : 'var(--surface-border)'}`,
                      color: selectedAsset.is_client_visible ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {selectedAsset.is_client_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    {selectedAsset.is_client_visible ? 'Visible to Client' : 'Internal Only'}
                  </button>
                  <select 
                    value={selectedAsset.status_v2}
                    onChange={(e) => updateAssetField(selectedAsset.id, 'status_v2', e.target.value)}
                    className="badge"
                    style={{ padding: '8px 12px', border: 'none', cursor: 'pointer', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>

              {/* Panel Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                
                {/* Phases Tracker (Compact) */}
                <div style={{ marginBottom: '40px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Milestone size={16} /> Production Pipeline
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {selectedAsset.deliverable_phases.map((phase) => (
                      <button 
                        key={phase.id}
                        onClick={() => togglePhase(selectedAsset.id, phase.id, phase.is_completed)}
                        style={{ 
                          flex: 1, padding: '12px', borderRadius: '8px', 
                          background: phase.is_completed ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-primary)',
                          border: `1px solid ${phase.is_completed ? 'var(--success)' : 'var(--surface-border)'}`,
                          color: phase.is_completed ? 'var(--success)' : 'var(--text-tertiary)',
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                        }}
                      >
                        {phase.is_completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        {phase.phase_name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Creative Brief (Rich Text Workspace) */}
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layout size={16} /> Creative Brief & Script
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      <Info size={12} /> Autosaves changes
                    </div>
                  </div>
                  <div className="glass-panel" style={{ background: 'var(--bg-primary)', minHeight: '400px', border: '1px solid var(--surface-border)' }}>
                    <TiptapEditor 
                      content={selectedAsset.creative_brief} 
                      onUpdate={(content) => updateAssetField(selectedAsset.id, 'creative_brief', content)} 
                    />
                  </div>
                </div>

                {/* Final Asset & Links */}
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileVideo size={16} /> Final Asset
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {!selectedAsset.file_url ? (
                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        const val = (e.currentTarget.elements.namedItem('fileUrl') as HTMLInputElement).value
                        if (!val) return
                        updateAssetField(selectedAsset.id, 'file_url', val)
                        updateAssetField(selectedAsset.id, 'status_v2', 'delivered')
                      }} style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" name="fileUrl" placeholder="Final video link (e.g. Frame.io, Dropbox)..."
                          style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-primary)' }} />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>Attach</button>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(0,225,255,0.05)', border: '1px solid var(--accent-primary)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <FileVideo size={20} color="var(--accent-primary)" />
                          <div>
                            <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Final Delivery Attached</div>
                            <a href={selectedAsset.file_url} target="_blank" rel="noopener" style={{ fontSize: '0.8125rem', color: 'var(--accent-secondary)', textDecoration: 'none' }}>Open Link <ExternalLink size={12} style={{ display: 'inline' }} /></a>
                          </div>
                        </div>
                        <button onClick={() => updateAssetField(selectedAsset.id, 'file_url', null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Panel Footer */}
              <div style={{ padding: '24px 32px', borderTop: '1px solid var(--surface-border)', background: 'var(--surface)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button 
                  onClick={() => deleteDeliverable(selectedAsset.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} /> Delete Content Piece
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
