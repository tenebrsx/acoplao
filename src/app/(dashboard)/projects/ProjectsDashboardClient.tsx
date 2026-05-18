'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { 
  FolderKanban, ArrowUpRight, Search, Plus, X, 
  CheckCircle2, LayoutTemplate, Building2, PackageCheck, AlertCircle, PlayCircle, Loader2 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

type ProjectStatus = 'all' | 'planning' | 'active' | 'paused' | 'review' | 'completed'

export function ProjectsDashboardClient({ 
  initialProjects, 
  businesses,
  role,
  favoriteIds = [],
  blueprints = []
}: { 
  initialProjects: any[], 
  businesses: any[],
  role: string,
  favoriteIds?: string[],
  blueprints?: any[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus>('all')
  const [businessFilter, setBusinessFilter] = useState<string>('all')
  
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [selectedBlueprint, setSelectedBlueprint] = useState('')
  const [newBizName, setNewBizName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    if (searchParams.get('action') === 'new-project') {
      setShowCreate(true)
    }
  }, [searchParams])

  const handleCloseModal = () => {
    setShowCreate(false)
    if (searchParams.get('action')) {
      router.replace('/projects', { scroll: false })
    }
  }

  const filteredProjects = useMemo(() => {
    return initialProjects.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.businesses?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      const matchesBusiness = businessFilter === 'all' || p.business_id === businessFilter
      return matchesSearch && matchesStatus && matchesBusiness
    })
  }, [initialProjects, searchQuery, statusFilter, businessFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !selectedBusiness) return

    setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()

    try {
      let businessId = selectedBusiness
      
      if (selectedBusiness === 'new' && newBizName.trim()) {
        const { data: biz, error: bizErr } = await supabase
          .from('businesses')
          .insert({ name: newBizName.trim(), created_by: user?.id })
          .select('id')
          .single()
        if (bizErr || !biz) throw bizErr
        businessId = biz.id
      }

      const blueprint = blueprints.find(b => b.id === selectedBlueprint)

      const { data: project, error: projErr } = await supabase
        .from('projects')
        .insert({
          title: newTitle.trim(),
          business_id: businessId,
          status: 'planning',
          project_type: blueprint?.category || 'other',
          created_by: user?.id
        })
        .select('id')
        .single()

      if (projErr || !project) throw projErr

      await supabase.from('project_members').insert({ project_id: project.id, user_id: user?.id })

      if (blueprint?.blueprint_deliverables) {
        let globalSortOrder = 0
        const baseDate = new Date()
        const phasesToInsert: any[] = []

        for (const bDeliv of blueprint.blueprint_deliverables) {
          if (Array.isArray(bDeliv.phases)) {
            for (const pName of bDeliv.phases) {
              const d = new Date(baseDate)
              d.setDate(d.getDate() + globalSortOrder)
              phasesToInsert.push({
                project_id: project.id,
                phase_name: pName,
                sort_order: globalSortOrder,
                scheduled_date: d.toISOString().split('T')[0],
                is_completed: false
              })
              globalSortOrder++
            }
          }
        }

        if (phasesToInsert.length > 0) {
          await supabase.from('project_phases').insert(phasesToInsert)
        }
      }

      router.refresh()
      setShowCreate(false)
      setNewTitle('')
      setSelectedBusiness('')
      setSelectedBlueprint('')
      setNewBizName('')
    } catch (err: any) {
      alert('Failed to create campaign: ' + err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const totalProjects = initialProjects.length
  const activeProjects = initialProjects.filter(p => p.status === 'active').length
  const planningProjects = initialProjects.filter(p => p.status === 'planning').length
  const completedProjects = initialProjects.filter(p => p.status === 'completed').length

  return (
    <div className="flex flex-col gap-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-1.5">Projects</h1>
          <p className="text-muted-foreground text-sm">
            {activeProjects} active project{activeProjects !== 1 ? 's' : ''} across your agency.
          </p>
        </div>
        {role === 'admin' && (
          <button 
            onClick={() => setShowCreate(true)} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} /> New Project
          </button>
        )}
      </div>

      {/* SUMMARY STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-white/[0.08]">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <FolderKanban size={14} /> Total Projects
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{totalProjects}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <PlayCircle size={14} className="text-emerald-500" /> Active Projects
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{activeProjects}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-500" /> Planning
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{planningProjects}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <PackageCheck size={14} className="text-blue-500" /> Completed
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{completedProjects}</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <select 
          value={businessFilter}
          onChange={(e) => setBusinessFilter(e.target.value)}
          className="px-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-foreground focus:outline-none focus:border-white/20 transition-colors cursor-pointer appearance-none"
        >
          <option value="all" className="bg-background text-foreground">All Clients</option>
          {businesses.map(b => <option key={b.id} value={b.id} className="bg-background text-foreground">{b.name}</option>)}
        </select>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-foreground capitalize focus:outline-none focus:border-white/20 transition-colors cursor-pointer appearance-none"
        >
          <option value="all" className="bg-background text-foreground">All Statuses</option>
          <option value="planning" className="bg-background text-foreground">Planning</option>
          <option value="active" className="bg-background text-foreground">Active</option>
          <option value="paused" className="bg-background text-foreground">Paused</option>
          <option value="review" className="bg-background text-foreground">Review</option>
          <option value="completed" className="bg-background text-foreground">Completed</option>
        </select>
      </div>

      {/* LIST */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <FolderKanban size={32} className="text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">
            {searchQuery || statusFilter !== 'all' || businessFilter !== 'all'
              ? 'No projects match your filters.'
              : 'No projects found. Create your first one.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* List header */}
          <div className="grid grid-cols-12 px-4 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground/50 font-medium border-b border-white/[0.06]">
            <span className="col-span-5">Project Name</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2">Timeline</span>
            <span className="col-span-2">Content</span>
            <span className="col-span-1 text-right"></span>
          </div>

          <AnimatePresence>
            {filteredProjects.map((project: any, i: number) => {
              const totalDeliverables = project.deliverables?.length || 0
              const approvedDeliverables = project.deliverables?.filter((d: any) => d.status_v2 === 'approved' || d.status_v2 === 'delivered').length || 0
              
              const projectPhases = project.project_phases || []
              const totalPhases = projectPhases.length
              const completedPhases = projectPhases.filter((p: any) => p.is_completed).length
              const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

              const statusColors: Record<string, string> = {
                active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                planning: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                paused: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                review: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                completed: 'bg-muted text-muted-foreground border-white/10'
              }
              const statusColor = statusColors[project.status] || statusColors.planning
              
              const isBlocked = project.bottleneck_status === 'blocked'
              const isWaiting = project.bottleneck_status === 'waiting_client' || project.bottleneck_status === 'waiting_team'

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/projects/${project.id}`}
                    className="group relative grid grid-cols-12 items-center px-4 py-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Left edge indicator */}
                    <div className={`w-[3px] h-[calc(100%-16px)] absolute left-0 top-2 bottom-2 rounded-r-full ${isBlocked ? 'bg-red-500' : isWaiting ? 'bg-amber-500' : 'bg-transparent'}`} />
                    
                    {/* Project Name + Client */}
                    <div className="col-span-5 flex items-center gap-3 pl-2">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                        <FolderKanban size={14} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0 pr-4">
                        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{project.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate mt-0.5">
                          <Building2 size={10} className="shrink-0" />
                          <span className="truncate">{project.businesses?.name || 'No Client'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${statusColor}`}>
                        {project.status}
                      </span>
                    </div>

                    {/* Timeline Progress */}
                    <div className="col-span-2 flex flex-col justify-center gap-1.5 pr-6">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{completedPhases}/{totalPhases}</span>
                        <span className="font-medium text-foreground/90">{progress}%</span>
                      </div>
                      <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Content Count */}
                    <div className="col-span-2 flex items-center">
                      <div className="text-sm">
                        <span className="font-medium text-foreground">{approvedDeliverables}</span>
                        <span className="text-muted-foreground"> / {totalDeliverables} done</span>
                      </div>
                    </div>

                    {/* Action Arrow */}
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

      {/* CREATE PROJECT MODAL */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-[#141416] border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors text-muted-foreground"
              >
                <X size={16} />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">New Project</h2>
                <p className="text-sm text-muted-foreground">Start a new campaign and assign it to a client.</p>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Campaign Name</label>
                  <input
                    autoFocus
                    required
                    placeholder="e.g. Q2 Brand Awareness"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.08] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/20 text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Client Basecamp</label>
                  <div className="relative">
                    <select
                      required
                      value={selectedBusiness}
                      onChange={e => setSelectedBusiness(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.08] text-foreground focus:outline-none focus:border-white/20 text-sm transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-background">Select a client...</option>
                      {businesses.map(b => (
                        <option key={b.id} value={b.id} className="bg-background">{b.name}</option>
                      ))}
                      <option value="new" className="bg-background text-primary">+ Create New Client</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                       <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>

                {selectedBusiness === 'new' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">New Client Name</label>
                    <input
                      required={selectedBusiness === 'new'}
                      placeholder="e.g. Nike, Apple..."
                      value={newBizName}
                      onChange={e => setNewBizName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-primary/30 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 text-sm transition-colors"
                    />
                  </motion.div>
                )}

                {blueprints.length > 0 && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-2">
                       <LayoutTemplate size={12} /> Start from Template
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBlueprint('')}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all border ${
                          !selectedBlueprint
                            ? 'bg-primary/10 border-primary/30 text-foreground'
                            : 'bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${!selectedBlueprint ? 'border-primary' : 'border-muted-foreground'}`}>
                          {!selectedBlueprint && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        Blank Project
                      </button>
                      {blueprints.map((bp: any) => (
                        <button
                          key={bp.id}
                          type="button"
                          onClick={() => setSelectedBlueprint(bp.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all border ${
                            selectedBlueprint === bp.id
                              ? 'bg-primary/10 border-primary/30 text-foreground'
                              : 'bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${selectedBlueprint === bp.id ? 'border-primary' : 'border-muted-foreground'}`}>
                            {selectedBlueprint === bp.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          </div>
                          <span className="truncate">{bp.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim() || !selectedBusiness}
                  className="flex items-center justify-center gap-2 w-full py-3 mt-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  {isCreating ? (
                    <><Loader2 size={16} className="animate-spin" /> Creating Project…</>
                  ) : 'Create Project'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
