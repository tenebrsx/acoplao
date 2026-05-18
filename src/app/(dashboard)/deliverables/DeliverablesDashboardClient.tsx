'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Package, Search, ArrowUpRight, Building2, FolderKanban,
  CheckCircle2, PlayCircle, Eye, AlertCircle, PackageCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Phase = {
  id: string
  phase_name: string
  is_completed: boolean
}

type Deliverable = {
  id: string
  title: string
  description: string | null
  status_v2: string
  file_url: string | null
  is_client_visible: boolean
  project_id: string
  projects?: {
    id: string
    title: string
    business_id: string
    businesses?: {
      id: string
      name: string
    }
  }
  deliverable_phases?: Phase[]
}

const STATUS_COLORS: Record<string, string> = {
  in_progress:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  review:       'bg-amber-500/10 text-amber-500 border-amber-500/20',
  approved:     'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  delivered:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  not_started:  'bg-white/5 text-muted-foreground border-white/10',
}

export function DeliverablesDashboardClient({
  initialDeliverables,
  businesses,
  projects,
  role,
}: {
  initialDeliverables: Deliverable[]
  businesses: { id: string; name: string }[]
  projects: { id: string; title: string; business_id: string }[]
  role: string
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredProjects = useMemo(
    () => selectedBusiness === 'all'
      ? projects
      : projects.filter(p => p.business_id === selectedBusiness),
    [projects, selectedBusiness]
  )

  const filteredDeliverables = useMemo(() => {
    return initialDeliverables.filter(d => {
      const q = searchQuery.toLowerCase()
      const matchSearch =
        d.title.toLowerCase().includes(q) ||
        d.projects?.title?.toLowerCase().includes(q) ||
        d.projects?.businesses?.name?.toLowerCase().includes(q)
      const matchBusiness = selectedBusiness === 'all' || d.projects?.business_id === selectedBusiness
      const matchProject  = selectedProject === 'all'  || d.project_id === selectedProject
      const matchStatus   = statusFilter === 'all'     || (d.status_v2 || 'in_progress') === statusFilter
      return matchSearch && matchBusiness && matchProject && matchStatus
    })
  }, [initialDeliverables, searchQuery, selectedBusiness, selectedProject, statusFilter])

  // Stats
  const total       = initialDeliverables.length
  const inProgress  = initialDeliverables.filter(d => (d.status_v2 || 'in_progress') === 'in_progress').length
  const inReview    = initialDeliverables.filter(d => d.status_v2 === 'review').length
  const done        = initialDeliverables.filter(d => d.status_v2 === 'approved' || d.status_v2 === 'delivered').length

  return (
    <div className="flex flex-col gap-12">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-1.5">Deliverables</h1>
          <p className="text-muted-foreground text-sm">
            {inProgress} in progress · global deliverable tracker
          </p>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-white/[0.08]">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Package size={14} /> Total
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{total}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <PlayCircle size={14} className="text-blue-400" /> In Progress
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{inProgress}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-500" /> In Review
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{inReview}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <PackageCheck size={14} className="text-emerald-500" /> Approved / Delivered
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{done}</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Search deliverables, projects, clients..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <select
          value={selectedBusiness}
          onChange={e => { setSelectedBusiness(e.target.value); setSelectedProject('all') }}
          className="px-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-foreground focus:outline-none focus:border-white/20 transition-colors cursor-pointer appearance-none"
        >
          <option value="all" className="bg-background">All Clients</option>
          {businesses.map(b => <option key={b.id} value={b.id} className="bg-background">{b.name}</option>)}
        </select>

        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          className="px-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-foreground focus:outline-none focus:border-white/20 transition-colors cursor-pointer appearance-none"
        >
          <option value="all" className="bg-background">All Projects</option>
          {filteredProjects.map(p => <option key={p.id} value={p.id} className="bg-background">{p.title}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-foreground focus:outline-none focus:border-white/20 transition-colors cursor-pointer appearance-none"
        >
          <option value="all" className="bg-background">All Statuses</option>
          <option value="in_progress" className="bg-background">In Progress</option>
          <option value="review" className="bg-background">In Review</option>
          <option value="approved" className="bg-background">Approved</option>
          <option value="delivered" className="bg-background">Delivered</option>
        </select>
      </div>

      {/* LIST */}
      {filteredDeliverables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <Package size={32} className="text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">
            {searchQuery || selectedBusiness !== 'all' || selectedProject !== 'all' || statusFilter !== 'all'
              ? 'No deliverables match your filters.'
              : 'No deliverables found.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* List header */}
          <div className="grid grid-cols-12 px-4 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground/50 font-medium border-b border-white/[0.06]">
            <span className="col-span-5">Deliverable</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2">Client</span>
            <span className="col-span-2">Phases</span>
            <span className="col-span-1 text-right"></span>
          </div>

          <AnimatePresence>
            {filteredDeliverables.map((d, i) => {
              const phases       = d.deliverable_phases || []
              const totalPhases  = phases.length
              const donePhases   = phases.filter(p => p.is_completed).length
              const status       = d.status_v2 || 'in_progress'
              const statusColor  = STATUS_COLORS[status] || STATUS_COLORS.not_started
              const clientName   = d.projects?.businesses?.name
              const projectName  = d.projects?.title

              // At-risk: any incomplete phase with a past date (lightweight check — phases may not carry dates here)
              const isAtRisk = false // can be wired up later if phase dates are fetched

              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Link
                    href={`/projects/${d.project_id}?tab=deliverables`}
                    className="group relative grid grid-cols-12 items-center px-4 py-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    {/* At-risk left edge */}
                    {isAtRisk && (
                      <div className="w-[3px] h-[calc(100%-16px)] absolute left-0 top-2 bottom-2 rounded-r-full bg-red-500" />
                    )}

                    {/* Deliverable name + project */}
                    <div className="col-span-5 flex items-center gap-3 pl-2">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                        <Package size={14} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0 pr-4">
                        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate flex items-center gap-2">
                          {d.title}
                          {d.is_client_visible && <Eye size={11} className="text-primary shrink-0" />}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate mt-0.5">
                          <FolderKanban size={10} className="shrink-0" />
                          <span className="truncate">{projectName || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${statusColor}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Client */}
                    <div className="col-span-2">
                      {clientName ? (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                          <Building2 size={11} className="shrink-0" />
                          <span className="truncate">{clientName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </div>

                    {/* Phase progress */}
                    <div className="col-span-2 flex flex-col justify-center gap-1.5 pr-6">
                      {totalPhases > 0 ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{donePhases}/{totalPhases}</span>
                            <span className="font-medium text-foreground/90">
                              {Math.round((donePhases / totalPhases) * 100)}%
                            </span>
                          </div>
                          <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${Math.round((donePhases / totalPhases) * 100)}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">No phases</span>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="col-span-1 flex items-center justify-end">
                      <ArrowUpRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
