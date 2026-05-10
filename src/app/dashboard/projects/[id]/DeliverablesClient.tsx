'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, LinkIcon, Plus, Trash2, Loader2, GripVertical } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

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
}

export function DeliverablesClient({ 
  projectId, 
  initialDeliverables 
}: { 
  projectId: string, 
  initialDeliverables: Deliverable[] 
}) {
  const [deliverables, setDeliverables] = useState(initialDeliverables)
  const supabase = createClient()
  const router = useRouter()

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

  // ---- NEW DELIVERABLE ----
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

  // ---- TOGGLE PHASE ----
  const togglePhase = async (deliverableId: string, phaseId: string, currentlyCompleted: boolean) => {
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
    }
    router.refresh()
  }

  // ---- DELETE DELIVERABLE ----
  const deleteDeliverable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deliverable?')) return
    setDeliverables(prev => prev.filter(d => d.id !== id))
    await supabase.from('deliverables').delete().eq('id', id)
    router.refresh()
  }

  const [viewMode, setViewMode] = useState<'matrix' | 'board'>('matrix')

  return (
    <div className="animate-in fade-in" style={{ animationDuration: '400ms' }}>
      
      {/* View Toggles */}
      {deliverables.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <div style={{ display: 'flex', background: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <button 
              onClick={() => setViewMode('matrix')}
              style={{ padding: '6px 12px', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '4px', background: viewMode === 'matrix' ? 'var(--surface-hover)' : 'transparent', color: viewMode === 'matrix' ? 'var(--text-primary)' : 'var(--text-tertiary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Matrix View
            </button>
            <button 
              onClick={() => setViewMode('board')}
              style={{ padding: '6px 12px', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '4px', background: viewMode === 'board' ? 'var(--surface-hover)' : 'transparent', color: viewMode === 'board' ? 'var(--text-primary)' : 'var(--text-tertiary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Board View
            </button>
          </div>
        </div>
      )}

      
      {(!deliverables || deliverables.length === 0) ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          No deliverables yet. Create your first one to initialize the Creative Matrix.
        </div>
      ) : viewMode === 'matrix' ? (
        <div className="glass-panel" style={{ overflowX: 'auto', background: 'var(--surface)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Deliverable
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
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    
                    {/* Deliverable Info Cell */}
                    <td style={{ padding: '16px 20px', minWidth: '280px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input 
                          defaultValue={d.title}
                          onBlur={async (e) => {
                            if (e.target.value !== d.title) {
                              await supabase.from('deliverables').update({ title: e.target.value }).eq('id', d.id)
                            }
                          }}
                          style={{ 
                            fontSize: '1rem', fontWeight: 600, background: 'transparent', border: 'none', 
                            color: 'var(--text-primary)', outline: 'none', width: '100%', padding: 0
                          }}
                        />
                        <input 
                          placeholder="Add description..."
                          defaultValue={d.description || ''}
                          onBlur={async (e) => {
                            if (e.target.value !== d.description) {
                              await supabase.from('deliverables').update({ description: e.target.value }).eq('id', d.id)
                            }
                          }}
                          style={{ 
                            fontSize: '0.8125rem', color: 'var(--text-tertiary)', background: 'transparent', 
                            border: 'none', outline: 'none', width: '100%', padding: 0
                          }}
                        />
                        
                        {/* Status Badge */}
                        <div style={{ marginTop: '8px' }}>
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
                                onClick={() => togglePhase(d.id, phase.id, phase.is_completed)}
                                style={{ 
                                  color: phase.is_completed ? 'var(--success)' : isAtRisk ? 'var(--error)' : 'var(--surface-border)', 
                                  background: phase.is_completed ? 'rgba(16, 185, 129, 0.1)' : isAtRisk ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                  border: `1px solid ${phase.is_completed || isAtRisk ? 'transparent' : 'var(--text-tertiary)'}`,
                                  borderRadius: '50%', width: '28px', height: '28px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', transition: 'all 0.2s ease',
                                  boxShadow: isAtRisk ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none'
                                }}
                                onMouseOver={e => {
                                  if (!phase.is_completed) {
                                    e.currentTarget.style.borderColor = 'var(--text-secondary)'
                                    e.currentTarget.style.color = 'var(--text-secondary)'
                                  }
                                }}
                                onMouseOut={e => {
                                  if (!phase.is_completed) {
                                    e.currentTarget.style.borderColor = 'var(--text-tertiary)'
                                    e.currentTarget.style.color = 'var(--surface-border)'
                                  }
                                }}
                              >
                                {phase.is_completed ? <CheckCircle2 size={16} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />}
                              </button>

                              {/* Only show dates or asset inputs if it's the Delivery column or completed */}
                              {col === 'Delivery' && phase.is_completed && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', marginTop: '8px' }}>
                                  {!d.file_url ? (
                                    <form onSubmit={async (e) => {
                                      e.preventDefault()
                                      const val = (e.currentTarget.elements.namedItem('fileUrl') as HTMLInputElement).value
                                      if (!val) return
                                      await supabase.from('deliverables').update({ file_url: val, status_v2: 'delivered' }).eq('id', d.id)
                                      router.refresh()
                                    }} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <input type="text" name="fileUrl" placeholder="Paste link..."
                                        style={{ width: '100px', padding: '4px 6px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '4px', fontSize: '0.7rem', textAlign: 'center' }} />
                                      <button type="submit" className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>Attach</button>
                                    </form>
                                  ) : (
                                    <a href={d.file_url} target="_blank" rel="noopener" style={{ color: 'var(--accent-secondary)', fontSize: '0.7rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <LinkIcon size={12} /> Asset
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--surface-border)' }}>-</span>
                          )}
                        </td>
                      )
                    })}

                    {/* Delete Cell */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'top', textAlign: 'right' }}>
                      <button onClick={() => deleteDeliverable(d.id)} style={{ color: 'var(--text-tertiary)', padding: '4px', opacity: 0.5, transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '1'} onMouseOut={e => e.currentTarget.style.opacity = '0.5'}>
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
                        style={{ padding: '16px', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s', border: `1px solid ${deliverableAtRisk ? 'var(--error)' : 'var(--surface-border)'}`, boxShadow: deliverableAtRisk ? '0 4px 15px rgba(239, 68, 68, 0.1)' : 'none' }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = deliverableAtRisk ? 'var(--error)' : 'var(--text-secondary)' }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = deliverableAtRisk ? 'var(--error)' : 'var(--surface-border)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {d.title}
                            {deliverableAtRisk && <span style={{ background: 'var(--error)', color: 'var(--bg-primary)', fontSize: '0.6rem', padding: '2px 4px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800 }}>Risk</span>}
                          </div>
                          <GripVertical size={14} color="var(--surface-border)" />
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

      {/* Inline Create */}
      <div style={{ padding: '16px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Plus size={16} color="var(--accent-secondary)" />
        <form onSubmit={createDeliverable} style={{ flex: 1, margin: 0 }}>
          <input 
            type="text" 
            name="title" 
            placeholder="Create a new deliverable..."
            style={{ 
              width: '100%', background: 'transparent', border: 'none', 
              color: 'var(--accent-secondary)', fontSize: '0.9375rem', outline: 'none', fontWeight: 500
            }} 
          />
        </form>
      </div>
    </div>
  )
}
