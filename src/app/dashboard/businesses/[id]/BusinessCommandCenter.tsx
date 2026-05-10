'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Copy, CheckCircle2, Circle, Upload, DollarSign, Calendar, ExternalLink, Globe, FileText, FolderKanban, X, Plus, Trash2, Save, LayoutTemplate, ListTodo, FilePlus, Milestone } from 'lucide-react'

export function BusinessCommandCenter({ business, invoices, expenses, todos, assets }: { business: any, invoices: any[], expenses: any[], todos: any[], assets: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  
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
  const unpaid = invoices.filter((i: any) => i.status === 'open' || i.status === 'draft').reduce((sum: number, inv: any) => sum + Number(inv.amount), 0)
  const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0)
  const netProfit = ltv - totalExpenses
  const profitMargin = ltv > 0 ? ((netProfit / ltv) * 100).toFixed(1) : 0

  // Extract all deliverables across projects
  const allDeliverables = business.projects?.flatMap((p: any) => p.deliverables?.map((d: any) => ({ ...d, projectTitle: p.title, projectId: p.id })) || []) || []

  // Extract timeline deliverables (must have publish_date)
  const timelineDeliverables = allDeliverables
    .filter((d: any) => d.publish_date)
    .sort((a: any, b: any) => new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime())

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/portal/${business.id}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCreateInvoice = async () => {
    if (!invoiceAmount || !invoiceDueDate) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('invoices').insert({
      business_id: business.id,
      amount: parseFloat(invoiceAmount),
      description: invoiceDescription,
      due_date: invoiceDueDate,
      status: 'draft',
      created_by: user?.id
    })

    setSaving(false)
    setIsCreatingInvoice(false)
    setInvoiceAmount('')
    setInvoiceDescription('')
    setInvoiceDueDate('')
    router.refresh()
  }

  const handleSaveBrandVault = async () => {
    setSaving(true)
    await supabase.from('businesses').update({
      brand_colors: brandColors,
      brand_typography: brandTypography,
      brand_tone_of_voice: brandTone,
      brand_strategy_url: brandStrategyUrl
    }).eq('id', business.id)
    setSaving(false)
    setIsEditingBrand(false)
    router.refresh()
  }

  const handleSaveNotes = async () => {
    setSaving(true)
    await supabase.from('businesses').update({
      notes: meetingNotes
    }).eq('id', business.id)
    setSaving(false)
    setIsEditingNotes(false)
    router.refresh()
  }

  const handleCreateProject = async (templateId: string) => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    let projectTitle = 'Untitled Project'
    if (templateId === 'monthly_retainer') projectTitle = 'Monthly Content Retainer'
    if (templateId === 'brand_build') projectTitle = 'Brand Identity Build'

    // 1. Insert Project
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
      setSaving(false)
      return
    }

    // 2. Auto-add creator as member
    await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: user?.id,
    })

    // 3. Apply Template Deliverables
    if (templateId === 'monthly_retainer') {
      const deliverables = Array.from({ length: 4 }).map((_, i) => ({
        project_id: project.id,
        title: `TikTok/IG Reel - Week ${i + 1}`,
        status_v2: 'in_progress',
        type: 'video',
        created_by: user?.id
      }))
      await supabase.from('deliverables').insert(deliverables)
    }

    if (templateId === 'brand_build') {
      const deliverables = [
        { project_id: project.id, title: 'Moodboard & Direction', status_v2: 'in_progress', type: 'image', created_by: user?.id },
        { project_id: project.id, title: 'Logo System Concepts', status_v2: 'in_progress', type: 'image', created_by: user?.id },
        { project_id: project.id, title: 'Brand Guidelines PDF', status_v2: 'in_progress', type: 'other', created_by: user?.id }
      ]
      await supabase.from('deliverables').insert(deliverables)
    }

    setSaving(false)
    setIsCreatingProject(false)
    router.push(`/dashboard/projects/${project.id}`)
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

      await supabase.from('deliverables').update({
        status_v2: 'approved'
      }).eq('id', uploadDeliverable.id)

      setSaving(false)
      setUploadDeliverable(null)
      setUploadFile(null)
      router.refresh()
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
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

  const handleToggleTodo = async (todo: any) => {
    await supabase.from('todos').update({
      is_completed: !todo.is_completed
    }).eq('id', todo.id)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Global Header */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            {business.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> {business.contact_name} ({business.contact_email})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderKanban size={16} /> {business.projects?.length || 0} Active Projects
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '24px', borderRight: '1px solid var(--surface-border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profit Margin</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: netProfit >= 0 ? 'var(--success)' : 'var(--error)' }}>
              {profitMargin}%
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '24px', borderRight: '1px solid var(--surface-border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lifetime Value</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              ${ltv.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <button onClick={handleCopyLink} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px' }}>
            {copied ? <CheckCircle2 size={16} color="var(--success)" /> : <Copy size={16} />}
            {copied ? 'Copied Link' : 'Copy Portal Link'}
          </button>
          <a href={`/portal/${business.id}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none' }}>
            <Globe size={16} /> View Portal
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
        
        {/* Left Column: Deliverables Hub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={20} color="var(--accent-primary)" /> Deliverables & Publishing Hub
                </h2>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Upload finals and push to portal
                </div>
              </div>
              <button onClick={() => setIsCreatingProject(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={14} /> New Project
              </button>
            </div>

            {/* Visual Timeline (Gantt) */}
            {timelineDeliverables.length > 0 && (
              <div style={{ marginBottom: '48px' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Milestone size={14} /> Publishing Timeline
                </h3>
                <div style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  overflowX: 'auto', 
                  paddingBottom: '16px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--surface-border) transparent'
                }}>
                  {timelineDeliverables.map((deliv: any, idx: number) => {
                    const date = new Date(deliv.publish_date)
                    const isPast = date < new Date()
                    return (
                      <div key={`timeline-${deliv.id}`} style={{ 
                        flexShrink: 0, 
                        width: '180px', 
                        background: 'var(--bg-primary)', 
                        border: '1px solid',
                        borderColor: isPast ? 'var(--surface-border)' : 'var(--accent-primary)',
                        opacity: isPast ? 0.6 : 1,
                        borderRadius: '12px', 
                        padding: '16px',
                        position: 'relative'
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isPast ? 'var(--text-tertiary)' : 'var(--accent-primary)', marginBottom: '8px' }}>
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {deliv.title}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                          {deliv.projectTitle}
                        </div>
                        {idx !== timelineDeliverables.length - 1 && (
                          <div style={{ position: 'absolute', top: '50%', right: '-16px', width: '16px', height: '2px', background: 'var(--surface-border)', zIndex: -1 }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {allDeliverables.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed var(--surface-border)', borderRadius: '12px', color: 'var(--text-tertiary)' }}>
                No deliverables currently active. Create a project to begin.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allDeliverables.map((deliv: any) => (
                  <div key={deliv.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '16px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '12px', padding: '16px 20px' }}>
                    
                    {/* Deliverable Info */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {deliv.status_v2 === 'approved' || deliv.status_v2 === 'published' ? <CheckCircle2 size={16} color="var(--success)" /> : <Circle size={16} color="var(--text-tertiary)" />}
                        <Link href={`/dashboard/projects/${deliv.projectId}`} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                          {deliv.title}
                        </Link>
                        <span style={{ fontSize: '0.6875rem', background: 'var(--surface)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                          {deliv.projectTitle}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span>Status: <strong style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{deliv.status_v2.replace('_', ' ')}</strong></span>
                        {deliv.published_url && (
                          <a href={deliv.published_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--info)', textDecoration: 'none' }}>
                            <ExternalLink size={12} /> Live Link
                          </a>
                        )}
                        {deliv.publish_date && (
                          <span style={{ color: 'var(--accent-primary)' }}>Scheduled: {new Date(deliv.publish_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        onClick={() => setUploadDeliverable(deliv)}
                        className="btn btn-secondary btn-sm" 
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
                      >
                        <Upload size={14} /> Upload Final
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mini Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Account Manager To-Do List */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListTodo size={18} color="var(--info)" /> Account Tasks
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {todos.map((todo) => (
                <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <button onClick={() => handleToggleTodo(todo)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginTop: '2px' }}>
                    {todo.is_completed ? <CheckCircle2 size={18} color="var(--success)" /> : <Circle size={18} color="var(--text-tertiary)" />}
                  </button>
                  <span style={{ fontSize: '0.9375rem', color: todo.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: todo.is_completed ? 'line-through' : 'none' }}>
                    {todo.title}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Add a task..." 
                className="input" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTodo() }}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.875rem' }} 
              />
              <button onClick={handleAddTodo} className="btn btn-primary btn-sm"><Plus size={16} /></button>
            </div>
          </div>

          {/* Financial Mini-Dashboard */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} color="var(--success)" /> Financial Overview
              </h2>
              <button onClick={() => setIsCreatingInvoice(true)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FilePlus size={14} /> Quick Invoice
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gross Revenue</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${ltv.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Expenses (Costs)</span>
                <span style={{ fontWeight: 600, color: 'var(--error)' }}>-${totalExpenses.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Net Profit</span>
                <span style={{ fontWeight: 600, color: netProfit >= 0 ? 'var(--success)' : 'var(--error)' }}>${netProfit.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Unpaid Invoices</span>
                <span style={{ fontWeight: 600, color: unpaid > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>${unpaid.toLocaleString()}</span>
              </div>
            </div>
            <Link href="/dashboard/finances" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              Manage Billing
            </Link>
          </div>

          {/* Client Portal Controls */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
             <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="#a855f7" /> Portal Settings
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Manage the brand vault, strategy docs, and portal configurations.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => setIsEditingBrand(true)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                Edit Brand Identity Vault
              </button>
              <button onClick={() => setIsEditingNotes(true)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                Meeting Notes & Strategy
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isCreatingProject && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsCreatingProject(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '600px', padding: '32px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Create New Project</h2>
                <button onClick={() => setIsCreatingProject(false)} style={{ background: 'var(--surface)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button 
                  onClick={() => handleCreateProject('monthly_retainer')}
                  className="btn" 
                  disabled={saving}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '24px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    <LayoutTemplate size={18} color="var(--info)" /> Monthly Content Retainer
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Auto-generates 4 weekly short-form video deliverables.</div>
                </button>

                <button 
                  onClick={() => handleCreateProject('brand_build')}
                  className="btn" 
                  disabled={saving}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '24px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    <LayoutTemplate size={18} color="var(--accent-primary)" /> Brand Identity Build
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Generates moodboard, logo concepts, and guidelines PDF.</div>
                </button>

                <button 
                  onClick={() => handleCreateProject('blank')}
                  className="btn" 
                  disabled={saving}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '24px', background: 'var(--bg-primary)', border: '1px dashed var(--surface-border)', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.2s' }}
                >
                  <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Blank Project</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Start from scratch. No deliverables pre-loaded.</div>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Final Modal */}
      <AnimatePresence>
        {uploadDeliverable && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setUploadDeliverable(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Upload Final Delivery</h2>
                <button onClick={() => setUploadDeliverable(null)} style={{ background: 'var(--surface)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
              </div>

              <div style={{ marginBottom: '24px', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                Uploading final asset for: <strong style={{ color: 'var(--text-primary)' }}>{uploadDeliverable.title}</strong>
              </div>

              <div style={{ 
                border: '2px dashed var(--surface-border)', 
                borderRadius: '16px', 
                padding: '48px 24px', 
                textAlign: 'center',
                background: 'var(--bg-primary)',
                marginBottom: '24px'
              }}>
                <Upload size={32} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>Select Final File</div>
                <input 
                  type="file" 
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  style={{ display: 'block', margin: '0 auto', fontSize: '0.875rem' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setUploadDeliverable(null)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleUploadFinal} disabled={saving || !uploadFile} className="btn btn-primary">
                  {saving ? 'Uploading...' : 'Publish to Portal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Invoice Modal */}
      <AnimatePresence>
        {isCreatingInvoice && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsCreatingInvoice(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Create Quick Invoice</h2>
                <button onClick={() => setIsCreatingInvoice(false)} style={{ background: 'var(--surface)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Amount ($)</label>
                  <input type="number" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} placeholder="0.00" className="input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Description</label>
                  <input type="text" value={invoiceDescription} onChange={e => setInvoiceDescription(e.target.value)} placeholder="e.g. Monthly Retainer - Oct" className="input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Due Date</label>
                  <input type="date" value={invoiceDueDate} onChange={e => setInvoiceDueDate(e.target.value)} className="input" style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                <button onClick={handleCreateInvoice} disabled={saving || !invoiceAmount || !invoiceDueDate} className="btn btn-primary">
                  {saving ? 'Creating...' : 'Create Draft Invoice'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Brand Identity Modal */}
      <AnimatePresence>
        {isEditingBrand && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsEditingBrand(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Brand Identity Vault</h2>
                <button onClick={() => setIsEditingBrand(false)} style={{ background: 'var(--surface)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Color Palette</label>
                  {brandColors.map((color, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                      <input type="text" placeholder="Name (e.g. Primary)" value={color.name} onChange={(e) => { const nc = [...brandColors]; nc[idx].name = e.target.value; setBrandColors(nc) }} className="input" style={{ flex: 1 }} />
                      <input type="text" placeholder="Hex (e.g. #000000)" value={color.hex} onChange={(e) => { const nc = [...brandColors]; nc[idx].hex = e.target.value; setBrandColors(nc) }} className="input" style={{ width: '150px' }} />
                      <button onClick={() => setBrandColors(brandColors.filter((_, i) => i !== idx))} className="btn btn-secondary" style={{ padding: '0 12px' }}><Trash2 size={16} color="var(--error)" /></button>
                    </div>
                  ))}
                  <button onClick={() => setBrandColors([...brandColors, { name: '', hex: '' }])} className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}><Plus size={14} /> Add Color</button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Typography Stack</label>
                  {brandTypography.map((type, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                      <input type="text" placeholder="Usage (e.g. Headers)" value={type.usage} onChange={(e) => { const nt = [...brandTypography]; nt[idx].usage = e.target.value; setBrandTypography(nt) }} className="input" style={{ flex: 1 }} />
                      <input type="text" placeholder="Font (e.g. Inter)" value={type.font_family} onChange={(e) => { const nt = [...brandTypography]; nt[idx].font_family = e.target.value; setBrandTypography(nt) }} className="input" style={{ flex: 1 }} />
                      <input type="text" placeholder="Weight (e.g. 700)" value={type.weight} onChange={(e) => { const nt = [...brandTypography]; nt[idx].weight = e.target.value; setBrandTypography(nt) }} className="input" style={{ width: '100px' }} />
                      <button onClick={() => setBrandTypography(brandTypography.filter((_, i) => i !== idx))} className="btn btn-secondary" style={{ padding: '0 12px' }}><Trash2 size={16} color="var(--error)" /></button>
                    </div>
                  ))}
                  <button onClick={() => setBrandTypography([...brandTypography, { usage: '', font_family: '', weight: '' }])} className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}><Plus size={14} /> Add Font</button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Tone of Voice</label>
                  <textarea placeholder="Describe the brand's tone of voice..." value={brandTone} onChange={(e) => setBrandTone(e.target.value)} className="input" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Brand Strategy Deck URL</label>
                  <input type="url" placeholder="https://..." value={brandStrategyUrl} onChange={(e) => setBrandStrategyUrl(e.target.value)} className="input" style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                <button onClick={handleSaveBrandVault} disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : <><Save size={16} /> Save to Portal</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Meeting Notes Modal */}
      <AnimatePresence>
        {isEditingNotes && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsEditingNotes(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', padding: '32px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Meeting Notes & Client Needs</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Internal notes. Not visible to the client.</p>
                </div>
                <button onClick={() => setIsEditingNotes(false)} style={{ background: 'var(--surface)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <textarea 
                  value={meetingNotes} 
                  onChange={(e) => setMeetingNotes(e.target.value)} 
                  placeholder="Drop discovery call notes, active goals, and random thoughts here..."
                  className="input" 
                  style={{ flex: 1, width: '100%', resize: 'none', fontFamily: 'monospace', fontSize: '0.875rem', padding: '16px', lineHeight: 1.6 }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button onClick={handleSaveNotes} disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : <><Save size={16} /> Save Notes</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
