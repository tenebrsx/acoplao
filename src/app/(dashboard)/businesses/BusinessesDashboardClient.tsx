'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Building2, Plus, ArrowRight, Mail, 
  User, Search, Activity, DollarSign, Star, X, LayoutTemplate, CheckCircle2, Loader2
} from 'lucide-react'
import { FavoriteButton } from '@/components/FavoriteButton'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'

export function BusinessesDashboardClient({ 
  initialBusinesses, 
  invoices,
  expenses,
  createAction, // Keep for backward compat if needed
  favoriteIds = [],
  blueprints = []
}: { 
  initialBusinesses: any[], 
  invoices: any[],
  expenses: any[],
  createAction: any,
  favoriteIds?: string[],
  blueprints?: any[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [newBizName, setNewBizName] = useState('')
  const [selectedBlueprints, setSelectedBlueprints] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBizName.trim()) return

    setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()

    try {
      // 1. Create Business
      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .insert({
          name: newBizName,
          created_by: user?.id,
        })
        .select('id')
        .single()

      if (bizErr || !biz) throw bizErr

      // 2. Create Selected Blueprint Projects
      for (const bpId of selectedBlueprints) {
        const blueprint = blueprints.find(b => b.id === bpId)
        if (!blueprint) continue

        const { data: project, error: projErr } = await supabase
          .from('projects')
          .insert({
            title: blueprint.name,
            business_id: biz.id,
            status: 'active',
            created_by: user?.id
          })
          .select('id')
          .single()

        if (!projErr && project) {
          // Auto-member
          await supabase.from('project_members').insert({ project_id: project.id, user_id: user?.id })

          // Create deliverables & phases
          if (blueprint.blueprint_deliverables) {
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
        }
      }

      toast(`Onboarded ${newBizName} successfully!`, "success")
      router.push(`/businesses/${biz.id}`)
    } catch (err) {
      console.error(err)
      toast("Failed to onboard client", "error")
      setIsCreating(false)
    }
  }

  const toggleBlueprint = (id: string) => {
    setSelectedBlueprints(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const filteredBusinesses = useMemo(() => {
    return initialBusinesses.filter(biz => {
      const query = searchQuery.toLowerCase()
      return biz.name.toLowerCase().includes(query) || 
             biz.contact_name?.toLowerCase().includes(query) ||
             biz.contact_email?.toLowerCase().includes(query)
    })
  }, [initialBusinesses, searchQuery])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>Clients & Basecamps</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Central operations for every brand and service in the agency.
          </p>
        </div>
        <button onClick={() => setIsOnboarding(true)} className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}>
          <Plus size={20} strokeWidth={3} /> Onboard New Client
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            type="text" 
            placeholder="Search clients..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: '10px',
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-hover)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Grid */}
      {filteredBusinesses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '64px 32px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid var(--surface-border)' }}>
            <Building2 size={28} color="var(--text-tertiary)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No Clients Found</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            {searchQuery ? "No results matching your search." : "Register your first brand to get started."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {filteredBusinesses.map((biz: any) => {
            const bizInvoices = invoices.filter(i => i.business_id === biz.id)
            const bizExpenses = expenses.filter(e => e.business_id === biz.id)
            
            const totalIncome = bizInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0)
            const totalSpent = bizExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
            
            const contractValue = biz.total_contract_value || 0
            const baselineValue = contractValue > 0 ? contractValue : (totalIncome > 0 ? totalIncome : 1)
            const progress = Math.min((totalSpent / baselineValue) * 100, 100)

            const healthColor = biz.health_status === 'red' ? 'var(--error)' : biz.health_status === 'yellow' ? 'var(--warning)' : 'var(--success)'

            return (
              <Link
                key={biz.id}
                href={`/businesses/${biz.id}`}
                className="glass-panel"
                style={{ 
                  padding: '24px', textDecoration: 'none', color: 'inherit', 
                  display: 'flex', flexDirection: 'column', gap: '20px',
                  transition: 'all 0.2s ease',
                  border: '1px solid var(--surface-border)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'var(--text-tertiary)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'var(--surface-border)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--surface-border)', position: 'relative' }}>
                      <Building2 size={20} color="var(--text-primary)" />
                      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: healthColor, border: '2px solid var(--surface)' }} />
                      <div style={{ position: 'absolute', top: '-8px', right: '-8px', zIndex: 5 }}>
                        <FavoriteButton entityId={biz.id} entityType="business" initialIsFavorite={favoriteIds.includes(biz.id)} />
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '4px' }}>{biz.name}</h3>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                        <span>{biz.projects?.length || 0} active campaigns</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(biz.contact_name || biz.contact_email) && (
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    {biz.contact_name && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} color="var(--text-tertiary)" /> {biz.contact_name}</span>}
                    {biz.contact_email && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} color="var(--text-tertiary)" /> {biz.contact_email}</span>}
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Expense Burn</span>
                    <span style={{ fontWeight: 600, color: progress > 80 ? 'var(--error)' : 'var(--text-primary)' }}>
                      ${totalSpent.toLocaleString()} / ${(contractValue > 0 ? contractValue : totalIncome).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: progress > 80 ? 'var(--error)' : 'var(--accent-primary)', borderRadius: '3px' }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
      {/* Onboarding Modal */}
      <AnimatePresence>
        {isOnboarding && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => !isCreating && setIsOnboarding(false)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="glass-panel" 
              style={{ position: 'relative', width: '100%', maxWidth: '600px', padding: '40px', borderRadius: '24px', background: 'var(--surface)', border: '1px solid var(--surface-border)' }}
            >
              <button 
                onClick={() => setIsOnboarding(false)} 
                disabled={isCreating}
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--surface-hover)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-tertiary)' }}
              >
                <X size={20} />
              </button>

              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>Onboard Client</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Launch a new client environment and provision services instantly.</p>
              </div>

              <form onSubmit={handleOnboard} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Client / Company Name</label>
                  <input 
                    autoFocus
                    required
                    placeholder="e.g. Acme Corp"
                    value={newBizName}
                    onChange={e => setNewBizName(e.target.value)}
                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', fontSize: '1rem', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Select Initial Services (Blueprints)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {blueprints.map((bp) => (
                      <button
                        key={bp.id}
                        type="button"
                        onClick={() => toggleBlueprint(bp.id)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                          background: selectedBlueprints.includes(bp.id) ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'var(--bg-primary)',
                          border: selectedBlueprints.includes(bp.id) ? '1px solid var(--accent-primary)' : '1px solid var(--surface-border)',
                        }}
                      >
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <LayoutTemplate size={16} color={selectedBlueprints.includes(bp.id) ? 'var(--accent-primary)' : 'var(--text-tertiary)'} />
                          {selectedBlueprints.includes(bp.id) && <CheckCircle2 size={14} color="var(--accent-primary)" />}
                        </div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: selectedBlueprints.includes(bp.id) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{bp.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isCreating || !newBizName.trim()} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 700, borderRadius: '12px', marginTop: '12px' }}
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Provisioning Environment...
                    </>
                  ) : (
                    'Provision & Launch Client Basecamp'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
