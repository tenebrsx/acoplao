'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Building2, Plus, Mail, User, Search, FolderKanban, PackageCheck,
  ArrowUpRight, X, LayoutTemplate, CheckCircle2, Loader2, CircleDot
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'

export function BusinessesDashboardClient({
  initialBusinesses,
  invoices,
  expenses,
  createAction,
  favoriteIds = [],
  blueprints = []
}: {
  initialBusinesses: any[]
  invoices: any[]
  expenses: any[]
  createAction: any
  favoriteIds?: string[]
  blueprints?: any[]
  projects?: any[]
  deliverables?: any[]
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
      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .insert({ name: newBizName, created_by: user?.id })
        .select('id')
        .single()

      if (bizErr || !biz) throw bizErr

      for (const bpId of selectedBlueprints) {
        const blueprint = blueprints.find(b => b.id === bpId)
        if (!blueprint) continue

        const { data: project, error: projErr } = await supabase
          .from('projects')
          .insert({ title: blueprint.name, business_id: biz.id, status: 'active', created_by: user?.id })
          .select('id')
          .single()

        if (!projErr && project) {
          await supabase.from('project_members').insert({ project_id: project.id, user_id: user?.id })
          if (blueprint.blueprint_deliverables) {
            for (const bDeliv of blueprint.blueprint_deliverables) {
              const { data: deliverable, error: delivErr } = await supabase
                .from('deliverables')
                .insert({ project_id: project.id, title: bDeliv.title, status_v2: 'in_progress', type: bDeliv.type, created_by: user?.id })
                .select('id')
                .single()

              if (!delivErr && deliverable && Array.isArray(bDeliv.phases)) {
                await supabase.from('deliverable_phases').insert(
                  bDeliv.phases.map((pName: string, idx: number) => ({
                    deliverable_id: deliverable.id, phase_name: pName, sort_order: idx, is_completed: false
                  }))
                )
              }
            }
          }
        }
      }

      toast(`Onboarded ${newBizName} successfully!`, 'success')
      router.push(`/businesses/${biz.id}`)
    } catch (err) {
      console.error(err)
      toast('Failed to onboard client', 'error')
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
      const q = searchQuery.toLowerCase()
      return biz.name.toLowerCase().includes(q) ||
        biz.contact_name?.toLowerCase().includes(q) ||
        biz.contact_email?.toLowerCase().includes(q)
    })
  }, [initialBusinesses, searchQuery])

  // Aggregate cross-client stats — projects now include status + deliverables
  const allProjects = initialBusinesses.flatMap((b: any) => b.projects || [])
  const activeProjectCount = allProjects.filter((p: any) => p.status === 'active').length
  const totalProjectCount = allProjects.length
  const activeDeliverableCount = allProjects.reduce((acc: number, p: any) => {
    return acc + (p.deliverables?.filter((d: any) =>
      d.status_v2 !== 'approved' && d.status_v2 !== 'delivered' && d.status_v2 !== 'cancelled'
    )?.length || 0)
  }, 0)

  return (
    <div className="flex flex-col gap-12">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-1.5">Clients</h1>
          <p className="text-muted-foreground text-sm">
            {initialBusinesses.length} client{initialBusinesses.length !== 1 ? 's' : ''} · central operations hub
          </p>
        </div>
        <button
          onClick={() => setIsOnboarding(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> Onboard Client
        </button>
      </div>

      {/* SUMMARY STRIP */}
      <div className="grid grid-cols-3 gap-8 pb-8 border-b border-white/[0.08]">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Building2 size={14} /> Total Clients
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{initialBusinesses.length}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <FolderKanban size={14} className="text-emerald-500" /> Active Projects
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{activeProjectCount}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <PackageCheck size={14} className="text-blue-400" /> Deliverables In Progress
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{activeDeliverableCount}</span>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
        />
      </div>

      {/* CLIENT LIST */}
      {filteredBusinesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <Building2 size={32} className="text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">
            {searchQuery ? 'No clients match your search.' : 'No clients yet. Onboard your first one.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* List header */}
          <div className="grid grid-cols-12 px-4 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground/50 font-medium border-b border-white/[0.06]">
            <span className="col-span-4">Client</span>
            <span className="col-span-2">Contact</span>
            <span className="col-span-2">Active Projects</span>
            <span className="col-span-2">In Progress</span>
            <span className="col-span-2 text-right">Health</span>
          </div>

          <AnimatePresence>
            {filteredBusinesses.map((biz: any, i: number) => {
              const bizProjects = biz.projects || []
              const bizActiveProjects = bizProjects.filter((p: any) => p.status === 'active').length
              const bizTotalProjects = bizProjects.length
              const bizInProgressDeliverables = bizProjects.reduce((acc: number, p: any) => {
                return acc + (p.deliverables?.filter((d: any) =>
                  d.status_v2 !== 'approved' && d.status_v2 !== 'delivered' && d.status_v2 !== 'cancelled'
                )?.length || 0)
              }, 0)
              const healthColor =
                biz.health_status === 'red' ? 'text-red-400' :
                biz.health_status === 'yellow' ? 'text-amber-400' :
                'text-emerald-400'

              return (
                <motion.div
                  key={biz.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/businesses/${biz.id}`}
                    className="group grid grid-cols-12 items-center px-4 py-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Client name */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                        <Building2 size={14} className="text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{biz.name}</div>
                        <div className="text-xs text-muted-foreground">{bizTotalProjects} project{bizTotalProjects !== 1 ? 's' : ''} total</div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2">
                      {biz.contact_name ? (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                          <User size={11} className="shrink-0" />
                          <span className="truncate">{biz.contact_name}</span>
                        </div>
                      ) : biz.contact_email ? (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                          <Mail size={11} className="shrink-0" />
                          <span className="truncate">{biz.contact_email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </div>

                    {/* Active Projects */}
                    <div className="col-span-2">
                      {bizActiveProjects > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                          <FolderKanban size={13} />{bizActiveProjects} active
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">No active projects</span>
                      )}
                    </div>

                    {/* In-Progress Deliverables */}
                    <div className="col-span-2">
                      {bizInProgressDeliverables > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400">
                          <PackageCheck size={13} />{bizInProgressDeliverables} in progress
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </div>

                    {/* Health + arrow */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <CircleDot size={14} className={healthColor} />
                      <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ONBOARDING MODAL */}
      <AnimatePresence>
        {isOnboarding && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => !isCreating && setIsOnboarding(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-[#141416] border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
            >
              <button
                onClick={() => !isCreating && setIsOnboarding(false)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors text-muted-foreground"
              >
                <X size={16} />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Onboard Client</h2>
                <p className="text-sm text-muted-foreground">Create a new client environment and provision services instantly.</p>
              </div>

              <form onSubmit={handleOnboard} className="flex flex-col gap-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Client Name</label>
                  <input
                    autoFocus
                    required
                    placeholder="e.g. Acme Corp"
                    value={newBizName}
                    onChange={e => setNewBizName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.08] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/20 text-sm transition-colors"
                  />
                </div>

                {blueprints.length > 0 && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Initial Services</label>
                    <div className="grid grid-cols-2 gap-2">
                      {blueprints.map((bp) => (
                        <button
                          key={bp.id}
                          type="button"
                          onClick={() => toggleBlueprint(bp.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all border ${
                            selectedBlueprints.includes(bp.id)
                              ? 'bg-primary/10 border-primary/30 text-foreground'
                              : 'bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                          }`}
                        >
                          <LayoutTemplate size={14} className={selectedBlueprints.includes(bp.id) ? 'text-primary' : ''} />
                          <span className="flex-1 truncate font-medium">{bp.name}</span>
                          {selectedBlueprints.includes(bp.id) && <CheckCircle2 size={14} className="text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreating || !newBizName.trim()}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors mt-2"
                >
                  {isCreating ? (
                    <><Loader2 size={16} className="animate-spin" /> Provisioning…</>
                  ) : 'Launch Client Environment'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
