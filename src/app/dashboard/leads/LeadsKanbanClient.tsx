'use client'

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Mail, Phone, DollarSign, Building, Sparkles, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// --- Types ---
type Lead = {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone?: string
  budget?: string
  project_type?: string
  message?: string
  status: 'new' | 'contacted' | 'proposal_sent' | 'won' | 'lost'
  converted_business_id?: string
  created_at: string
}

const COLUMNS = [
  { id: 'new', title: 'New Leads', color: '#00e1ff' },
  { id: 'contacted', title: 'Contacted', color: '#eab308' },
  { id: 'proposal_sent', title: 'Proposal Sent', color: '#8b5cf6' },
  { id: 'won', title: 'Won', color: '#22c55e' },
  { id: 'lost', title: 'Lost', color: '#ef4444' }
]

// --- Lead Card Component ---
function LeadCard({ lead, isOverlay, onConvert }: { lead: Lead, isOverlay?: boolean, onConvert: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id, data: { type: 'Lead', lead } })
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    opacity: isDragging ? 0.3 : 1,
    boxShadow: isOverlay ? '0 24px 48px rgba(0,0,0,0.5)' : 'none',
    cursor: isOverlay ? 'grabbing' : 'grab',
  }

  return (
    <div ref={setNodeRef} style={{ ...style, padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '12px' }} {...attributes} {...listeners} className="glass-panel">
      <div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{lead.company_name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <Building size={12} /> {lead.contact_name}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} /> {lead.email}</div>
        {lead.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} /> {lead.phone}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--surface-border)' }}>
        {lead.budget ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)' }}>
            <DollarSign size={12} /> {lead.budget}
          </div>
        ) : <div />}
        
        {lead.project_type && (
          <span style={{ fontSize: '0.6875rem', background: 'var(--surface)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
            {lead.project_type}
          </span>
        )}
      </div>

      {lead.message && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '8px', background: 'var(--surface)', borderRadius: '6px', borderLeft: '2px solid var(--accent-primary)', marginTop: '4px', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          "{lead.message}"
        </div>
      )}

      {lead.status === 'won' && !lead.converted_business_id && (
        <button 
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
          onClick={() => onConvert(lead.id)}
          style={{ width: '100%', padding: '10px', marginTop: '8px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Sparkles size={14} /> Convert to Project
        </button>
      )}

      {lead.converted_business_id && (
        <div style={{ width: '100%', padding: '10px', marginTop: '8px', background: 'var(--surface)', color: 'var(--text-tertiary)', border: '1px dashed var(--surface-border)', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} /> Converted
        </div>
      )}
    </div>
  )
}

// --- Column Component ---
function Column({ id, title, color, leads, onConvert }: { id: string; title: string; color: string; leads: Lead[], onConvert: (id: string) => void }) {
  const { setNodeRef } = useSortable({ id, data: { type: 'Column', colId: id } })

  return (
    <div ref={setNodeRef} className="glass-panel" style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--surface-border)', overflow: 'hidden', maxHeight: 'calc(100vh - 160px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--surface-border)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{title}</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{leads.length}</span>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(0, 0, 0, 0.1)' }}>
        <SortableContext items={leads.map(l => l.id)}>
          {leads.map(lead => <LeadCard key={lead.id} lead={lead} onConvert={onConvert} />)}
        </SortableContext>
        {leads.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--surface-border)', borderRadius: '8px', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
            Drop leads here
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main Kanban Board ---
export function LeadsKanbanClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    // Setup Supabase Realtime Subscription
    const channel = supabase.channel('realtime_leads')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads((current) => {
              if (!current.find(l => l.id === payload.new.id)) {
                return [...current, payload.new as Lead]
              }
              return current
            })
          } else if (payload.eventType === 'UPDATE') {
            setLeads((current) => current.map(l => l.id === payload.new.id ? { ...l, ...payload.new } : l))
          } else if (payload.eventType === 'DELETE') {
            setLeads((current) => current.filter(l => l.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleConvert = async (leadId: string) => {
    if (isConverting) return
    setIsConverting(true)
    
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    try {
      // 1. Create Business
      const { data: biz, error: bizErr } = await supabase.from('businesses').insert({
        name: lead.company_name,
        contact_email: lead.email,
        contact_name: lead.contact_name
      }).select().single()

      if (bizErr) throw bizErr

      // 2. Create Project
      const { data: proj, error: projErr } = await supabase.from('projects').insert({
        title: `${lead.company_name} - Initial Build`,
        business_id: biz.id,
        status: 'planning',
        description: lead.message
      }).select().single()

      if (projErr) throw projErr

      // 3. Mark lead as converted
      await supabase.from('leads').update({ converted_business_id: biz.id }).eq('id', lead.id)

      // 4. Navigate to new project
      router.push(`/dashboard/projects/${proj.id}`)
    } catch (err) {
      console.error(err)
      alert("Failed to convert lead. Check console.")
      setIsConverting(false)
    }
  }

  const handleDragStart = (event: any) => setActiveId(event.active.id)

  const handleDragOver = (event: any) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id
    if (activeId === overId) return

    const isActiveLead = active.data.current?.type === 'Lead'
    const isOverLead = over.data.current?.type === 'Lead'
    const isOverColumn = over.data.current?.type === 'Column'

    if (isActiveLead && isOverLead) {
      setLeads((leads) => {
        const activeIndex = leads.findIndex((l) => l.id === activeId)
        const overIndex = leads.findIndex((l) => l.id === overId)
        if (leads[activeIndex].status !== leads[overIndex].status) {
          const newLeads = [...leads]
          newLeads[activeIndex].status = leads[overIndex].status
          return arrayMove(newLeads, activeIndex, overIndex)
        }
        return arrayMove(leads, activeIndex, overIndex)
      })
    }

    if (isActiveLead && isOverColumn) {
      setLeads((leads) => {
        const activeIndex = leads.findIndex((l) => l.id === activeId)
        const newLeads = [...leads]
        newLeads[activeIndex].status = overId as Lead['status']
        return arrayMove(newLeads, activeIndex, activeIndex)
      })
    }
  }

  const handleDragEnd = async (event: any) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const leadId = active.id
    const newStatus = active.data.current?.lead?.status

    // Optimistic UI update already happened in dragOver, but we need the final status
    const finalLead = leads.find(l => l.id === leadId)
    if (finalLead) {
      // Background save to Supabase
      await supabase.from('leads').update({ status: finalLead.status }).eq('id', leadId)
    }
  }

  const dropAnimation = { sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }
  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newLeadData, setNewLeadData] = useState({ company: '', contact: '', email: '', budget: '', projectType: '' })

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeadData.company || !newLeadData.contact || !newLeadData.email) return

    const newLead = {
      company_name: newLeadData.company,
      contact_name: newLeadData.contact,
      email: newLeadData.email,
      budget: newLeadData.budget || null,
      project_type: newLeadData.projectType || null,
      status: 'new' as const,
    }

    const { data, error } = await supabase.from('leads').insert(newLead).select().single()
    if (!error && data) {
      setLeads([...leads, data])
      setIsAddModalOpen(false)
      setNewLeadData({ company: '', contact: '', email: '', budget: '', projectType: '' })
    } else {
      alert("Error adding lead")
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} /> Add Lead Manually
        </button>
      </div>
      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '24px', alignItems: 'flex-start' }}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          {COLUMNS.map(col => (
            <Column 
              key={col.id} 
              id={col.id} 
              title={col.title} 
              color={col.color} 
              leads={leads.filter(l => l.status === col.id)} 
              onConvert={handleConvert}
            />
          ))}

          <DragOverlay dropAnimation={dropAnimation}>
            {activeLead ? <LeadCard lead={activeLead} isOverlay onConvert={() => {}} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsAddModalOpen(false)} />
          <div className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '32px', background: 'var(--bg-secondary)', border: '1px solid var(--surface-border)', borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" /> New Inbound Lead
            </h2>
            <form onSubmit={handleAddLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Company Name *</label>
                  <input required value={newLeadData.company} onChange={e => setNewLeadData(prev => ({...prev, company: e.target.value}))} style={{ width: '100%', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'white', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Contact Name *</label>
                  <input required value={newLeadData.contact} onChange={e => setNewLeadData(prev => ({...prev, contact: e.target.value}))} style={{ width: '100%', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'white', outline: 'none' }} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address *</label>
                <input required type="email" value={newLeadData.email} onChange={e => setNewLeadData(prev => ({...prev, email: e.target.value}))} style={{ width: '100%', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'white', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Budget</label>
                  <input placeholder="$10,000+" value={newLeadData.budget} onChange={e => setNewLeadData(prev => ({...prev, budget: e.target.value}))} style={{ width: '100%', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'white', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Project Type</label>
                  <input placeholder="e.g. Website Redesign" value={newLeadData.projectType} onChange={e => setNewLeadData(prev => ({...prev, projectType: e.target.value}))} style={{ width: '100%', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'white', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
