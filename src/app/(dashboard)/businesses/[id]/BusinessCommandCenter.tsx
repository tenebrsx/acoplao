'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/ToastProvider'
import { 
  Copy, CheckCircle2, Circle, Upload, DollarSign, Calendar, 
  ExternalLink, Globe, FileText, FolderKanban, X, Plus, 
  Trash2, Save, LayoutTemplate, ListTodo, FilePlus, 
  Milestone, Clock, Activity, ArrowRight 
} from 'lucide-react'

import { BusinessCalendarClient } from './BusinessCalendarClient'

export function BusinessCommandCenter({ 
  business, 
  invoices, 
  expenses, 
  todos, 
  assets, 
  events = [],
  blueprints = []
}: { 
  business: any, 
  invoices: any[], 
  expenses: any[], 
  todos: any[], 
  assets: any[], 
  events?: any[],
  blueprints?: any[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [copied, setCopied] = useState(false)
  
  // Modal States
  const [isEditingBrand, setIsEditingBrand] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [uploadDeliverable, setUploadDeliverable] = useState<any | null>(null)
  
  const [saving, setSaving] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Invoice Form State
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceDescription, setInvoiceDescription] = useState('')
  const [invoiceDueDate, setInvoiceDueDate] = useState('')

  // Todo State
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // Brand Vault Form State
  const [brandColors, setBrandColors] = useState<{name: string, hex: string}[]>(business.brand_colors || [])
  const [brandTypography, setBrandTypography] = useState<{usage: string, font_family: string, weight: string}[]>(business.brand_typography || [])
  const [brandTone, setBrandTone] = useState(business.brand_tone_of_voice || '')
  const [brandStrategyUrl, setBrandStrategyUrl] = useState(business.brand_strategy_url || '')

  // Notes Form State
  const [meetingNotes, setMeetingNotes] = useState(business.notes || '')

  // Calculate Finances
  const ltv = invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, inv: any) => sum + Number(inv.amount), 0)
  const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0)
  const netProfit = ltv - totalExpenses
  const profitMargin = ltv > 0 ? ((netProfit / ltv) * 100).toFixed(1) : 0

  // Extract all deliverables across projects
  const allDeliverables = business.projects?.flatMap((p: any) => p.deliverables?.map((d: any) => ({ ...d, projectTitle: p.title, projectId: p.id })) || []) || []

  // Business Schedule
  const scheduleItems: {id: string, title: string, subtitle: string, date: Date, color: string, icon: any}[] = []
  events.forEach(e => {
    scheduleItems.push({
      id: `event-${e.id}`, title: e.title, subtitle: 'Event',
      date: new Date(e.start_time), color: e.color || 'var(--accent-secondary)', icon: Calendar
    })
  })
  todos.forEach(t => {
    if (t.due_date && !t.is_completed) {
      scheduleItems.push({
        id: `todo-${t.id}`, title: t.title, subtitle: 'Task',
        date: new Date(t.due_date), color: 'var(--info)', icon: CheckCircle2
      })
    }
  })

  const upcomingSchedule = scheduleItems
    .filter(item => item.date >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/portal/${business.id}`)
      setCopied(true)
      toast("Portal link copied to clipboard!", "success")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCreateProject = async (blueprintId: string) => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const blueprint = blueprints.find(b => b.id === blueprintId)
    let projectTitle = blueprint ? blueprint.name : 'Untitled Project'
    if (blueprintId === 'blank') projectTitle = 'Untitled Project'

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: projectTitle,
        business_id: business.id,
        status: 'active',
        created_by: user?.id,
      })
      .select('id')
      .single()

    if (error || !project) {
      toast("Failed to create service", "error")
      setSaving(false)
      return
    }

    await supabase.from('project_members').insert({ project_id: project.id, user_id: user?.id })

    if (blueprint && blueprint.blueprint_deliverables) {
      for (const bDeliv of blueprint.blueprint_deliverables) {
        const { data: deliverable, error: delivErr } = await supabase
          .from('deliverables')
          .insert({
            project_id: project.id,
            title: bDeliv.title,
            status_v2: 'in_progress',
            type: bDeliv.type,
            created_by: user?.id
          })
          .select('id')
          .single()

        if (!delivErr && deliverable && Array.isArray(bDeliv.phases)) {
          const phasesToInsert = bDeliv.phases.map((pName: string, idx: number) => ({
            deliverable_id: deliverable.id,
            phase_name: pName,
            sort_order: idx,
            is_completed: false
          }))
          await supabase.from('deliverable_phases').insert(phasesToInsert)
        }
      }
    }

    toast("Service provisioned successfully!", "success")
    setSaving(false)
    setIsCreatingProject(false)
    router.refresh()
  }

  const handleUploadFinal = async () => {
    if (!uploadDeliverable || !uploadFile) return
    setSaving(true)

    try {
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${business.id}/${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('assets').upload(fileName, uploadFile)
      
      let fileUrl = 'https://via.placeholder.com/800x600?text=Final+Asset'
      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName)
        fileUrl = publicUrl
      }

      await supabase.from('digital_assets').insert({
        business_id: business.id,
        project_id: uploadDeliverable.projectId,
        file_name: uploadFile.name,
        file_type: uploadFile.type,
        file_size_bytes: uploadFile.size,
        file_url: fileUrl,
        is_approved: true
      })

      await supabase.from('deliverables').update({ status_v2: 'approved' }).eq('id', uploadDeliverable.id)

      toast("Final asset published to portal!", "success")
      setSaving(false)
      setUploadDeliverable(null)
      setUploadFile(null)
      router.refresh()
    } catch (e) {
      console.error(e)
      toast("Upload failed", "error")
      setSaving(false)
    }
  }

  const handleSaveBrandVault = async () => {
    setSaving(true)
    await supabase.from('businesses').update({
      brand_colors: brandColors,
      brand_typography: brandTypography,
      brand_tone_of_voice: brandTone,
      brand_strategy_url: brandStrategyUrl
    }).eq('id', business.id)
    toast("Brand vault updated", "success")
    setSaving(false)
    setIsEditingBrand(false)
    router.refresh()
  }

  const handleSaveNotes = async () => {
    setSaving(true)
    await supabase.from('businesses').update({ notes: meetingNotes }).eq('id', business.id)
    toast("Strategy notes saved", "success")
    setSaving(false)
    setIsEditingNotes(false)
    router.refresh()
  }

  const handleToggleTodo = async (todo: any) => {
    await supabase.from('todos').update({ is_completed: !todo.is_completed }).eq('id', todo.id)
    router.refresh()
  }

  const handleAddTodo = async () => {
    if (!newTaskTitle.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('todos').insert({
      title: newTaskTitle,
      business_id: business.id,
      created_by: user?.id,
      assigned_to: user?.id
    })
    setNewTaskTitle('')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Client Header */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--surface-border)', fontSize: '24px', fontWeight: 700 }}>
              {business.name.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.02em' }}>{business.name} Basecamp</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.9375rem', color: 'var(--text-tertiary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14} color="var(--success)" /> Healthy</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14} /> ${ltv.toLocaleString()} Revenue</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIsCreatingProject(true)} className="btn btn-secondary" style={{ borderRadius: '10px' }}>
              <Plus size={16} /> Add Service
            </button>
            <button onClick={handleCopyLink} className="btn btn-primary" style={{ borderRadius: '10px' }}>
              <Globe size={16} /> Portal Link
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '32px', padding: '4px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)', width: 'fit-content' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === 'dashboard' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'dashboard' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: activeTab === 'dashboard' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Dashboard
          </button>
          {business.projects?.map((project: any) => (
            <button
              key={project.id}
              onClick={() => setActiveTab(project.id)}
              style={{
                padding: '8px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === project.id ? 'var(--surface)' : 'transparent',
                color: activeTab === project.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: activeTab === project.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <FolderKanban size={14} /> {project.title}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* Left Column: Strategy & Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Financial Health */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px' }}>Financial Engine</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>LTV</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>${ltv.toLocaleString()}</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Burn</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>${totalExpenses.toLocaleString()}</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Net Profit</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${netProfit.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Brand Vault */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Brand Identity Vault</h2>
                <button onClick={() => setIsEditingBrand(true)} className="btn btn-secondary btn-sm">Edit Vault</button>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {brandColors.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: c.hex }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{c.hex}</span>
                  </div>
                ))}
                {brandColors.length === 0 && <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>No colors defined.</span>}
              </div>
              {brandTone && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', borderLeft: '3px solid var(--accent-primary)', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{brandTone}"
                </div>
              )}
            </div>

            {/* Strategy & Notes */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Strategy & Meeting Notes</h2>
                <button onClick={() => setIsEditingNotes(true)} className="btn btn-secondary btn-sm">Update Notes</button>
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {meetingNotes || 'No strategy notes yet. Start documenting the roadmap here.'}
              </div>
            </div>
          </div>

          {/* Right Column: Schedule & Assets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Quick Tasks */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px' }}>Account Tasks</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {todos.slice(0, 5).map((todo) => (
                  <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => handleToggleTodo(todo)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {todo.is_completed ? <CheckCircle2 size={16} color="var(--success)" /> : <Circle size={16} color="var(--text-tertiary)" />}
                    </button>
                    <span style={{ fontSize: '0.875rem', textDecoration: todo.is_completed ? 'line-through' : 'none', color: todo.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{todo.title}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="Add task..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTodo()} style={{ flex: 1, padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '6px', fontSize: '0.8125rem' }} />
                <button onClick={handleAddTodo} className="btn btn-primary btn-sm"><Plus size={14} /></button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px' }}>Final Assets</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {assets.map((asset) => (
                  <a key={asset.id} href={asset.file_url} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)', textDecoration: 'none', color: 'inherit' }}>
                    <FilePlus size={16} color="var(--accent-primary)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.file_name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{(asset.file_size_bytes / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                  </a>
                ))}
                {assets.length === 0 && <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>No assets uploaded.</span>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Project Specific View */
        <div className="animate-in slide-in-from-bottom-2 duration-300">
          {business.projects?.filter((p: any) => p.id === activeTab).map((project: any) => (
            <div key={project.id} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                      {project.status.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ width: '1px', height: '32px', background: 'var(--surface-border)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Timeline</div>
                    <div style={{ fontWeight: 600 }}>{project.deliverables?.length || 0} Deliverables Active</div>
                  </div>
                </div>
                <Link href={`/projects/${project.id}`} className="btn btn-secondary">
                  Open Project Board <ArrowRight size={16} />
                </Link>
              </div>

              <div className="glass-panel" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Production Pipeline</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {project.deliverables?.map((d: any) => (
                    <div key={d.id} style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{d.title}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                          {d.status_v2}
                        </div>
                      </div>
                      <button onClick={() => setUploadDeliverable({ ...d, projectId: project.id })} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                        <Upload size={14} /> Upload Final
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isCreatingProject && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsCreatingProject(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Add New Service</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {blueprints.map(bp => (
                  <button key={bp.id} onClick={() => handleCreateProject(bp.id)} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '16px', textAlign: 'left', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600 }}>{bp.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{bp.description}</div>
                  </button>
                ))}
                <button onClick={() => handleCreateProject('blank')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '16px' }}>
                  <Plus size={16} /> Blank Service
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isEditingBrand && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsEditingBrand(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Brand Identity Vault</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Colors</label>
                  {brandColors.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input type="text" value={c.hex} onChange={e => { const nc = [...brandColors]; nc[i].hex = e.target.value; setBrandColors(nc) }} className="input" style={{ flex: 1 }} />
                      <button onClick={() => setBrandColors(brandColors.filter((_, idx) => idx !== i))} className="btn btn-secondary"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => setBrandColors([...brandColors, { name: '', hex: '#000000' }])} className="btn btn-secondary btn-sm"><Plus size={14} /> Add Color</button>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Tone of Voice</label>
                  <textarea value={brandTone} onChange={e => setBrandTone(e.target.value)} className="input" style={{ width: '100%', minHeight: '80px' }} />
                </div>
                <button onClick={handleSaveBrandVault} disabled={saving} className="btn btn-primary" style={{ width: '100%' }}>{saving ? 'Saving...' : 'Save Vault'}</button>
              </div>
            </motion.div>
          </div>
        )}

        {isEditingNotes && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsEditingNotes(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', padding: '32px', borderRadius: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Strategy & Meeting Notes</h2>
              <textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} className="input" style={{ flex: 1, width: '100%', resize: 'none', padding: '20px', fontSize: '1rem' }} />
              <button onClick={handleSaveNotes} disabled={saving} className="btn btn-primary" style={{ marginTop: '24px' }}>{saving ? 'Saving...' : 'Save Notes'}</button>
            </motion.div>
          </div>
        )}

        {uploadDeliverable && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setUploadDeliverable(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Upload Final Delivery</h2>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Uploading for: <strong>{uploadDeliverable.title}</strong></div>
              <input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)} style={{ marginBottom: '24px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setUploadDeliverable(null)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleUploadFinal} disabled={saving || !uploadFile} className="btn btn-primary">{saving ? 'Publishing...' : 'Publish to Portal'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
