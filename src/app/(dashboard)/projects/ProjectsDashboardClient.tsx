'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Building2, FolderKanban, ArrowRight, Search, Plus, Star, X, CheckCircle2, LayoutTemplate } from 'lucide-react'
import { FavoriteButton } from '@/components/FavoriteButton'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Projects Hub</h1>
          <p className="text-muted-foreground">
            Manage client engagements, workflows, and deliverables across all projects.
          </p>
        </div>
        {role === 'admin' && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} className="mr-2" /> New Project
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-5 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <Input
               type="text"
               placeholder="Search projects..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10 bg-secondary/30"
             />
          </div>

          <select 
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-secondary/30 px-3 text-sm text-muted-foreground"
          >
            <option value="all">All Clients</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus)}
            className="h-9 rounded-md border border-input bg-secondary/30 px-3 text-sm text-muted-foreground capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filteredProjects.length === 0 ? (
        <div className="glass-panel p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-5 border border-border">
            <FolderKanban size={28} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No projects found</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || businessFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Create your first project to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project: any) => {
            const totalDeliverables = project.deliverables?.length || 0
            const approvedDeliverables = project.deliverables?.filter((d: any) => d.status_v2 === 'approved' || d.status_v2 === 'delivered').length || 0

            const projectPhases = project.project_phases || []
            const totalPhases = projectPhases.length
            const completedPhases = projectPhases.filter((p: any) => p.is_completed).length
            const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

            const statusColor = 
              project.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
              project.status === 'paused' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
              project.status === 'completed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
              'bg-muted text-muted-foreground border-border'

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="glass-panel p-6 flex flex-col gap-5 no-underline text-foreground border border-border transition-all hover:border-primary/50 hover:-translate-y-1 group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 border border-border relative">
                      <FolderKanban size={20} className="text-foreground" />
                      <div className="absolute -top-2 -right-2">
                        <FavoriteButton entityId={project.id} entityType="project" initialIsFavorite={favoriteIds.includes(project.id)} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 size={14} />
                        <span>{project.businesses?.name}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`capitalize ${statusColor}`}>
                    {project.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background/50 rounded-lg border border-border p-3 flex flex-col gap-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Content Assets</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold">{approvedDeliverables}/{totalDeliverables}</span>
                      <span className="text-xs text-muted-foreground">Done</span>
                    </div>
                  </div>
                  <div className="bg-background/50 rounded-lg border border-border p-3 flex flex-col gap-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Timeline</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold">{progress}%</span>
                      <span className="text-xs text-muted-foreground">Phase</span>
                    </div>
                  </div>
                </div>

                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-in-out" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>

                <div className="flex justify-end items-center text-muted-foreground text-sm font-semibold gap-1.5 group-hover:text-primary transition-colors">
                  View Project <ArrowRight size={14} />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl z-50 p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">New Project</h2>
                <button onClick={handleCloseModal} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Campaign Name</label>
                  <Input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Q2 Nike Brand Awareness"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Client</label>
                  <select
                    value={selectedBusiness}
                    onChange={(e) => setSelectedBusiness(e.target.value)}
                    required
                    className="w-full h-9 rounded-md border border-input bg-secondary/30 px-3 text-sm"
                  >
                    <option value="">Select a client...</option>
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                    <option value="new">+ Create New Client</option>
                  </select>
                </div>

                {selectedBusiness === 'new' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium">New Client Name</label>
                    <Input
                      value={newBizName}
                      onChange={(e) => setNewBizName(e.target.value)}
                      placeholder="e.g. Nike, Apple, Spotify..."
                      required={selectedBusiness === 'new'}
                    />
                  </motion.div>
                )}

                {blueprints.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <LayoutTemplate size={14} /> Template (Optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBlueprint('')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          !selectedBlueprint 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        Blank
                      </button>
                      {blueprints.map((bp: any) => (
                        <button
                          key={bp.id}
                          type="button"
                          onClick={() => setSelectedBlueprint(bp.id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            selectedBlueprint === bp.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {bp.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="ghost" className="flex-1" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isCreating || !newTitle.trim() || !selectedBusiness}>
                    {isCreating ? (
                      <span className="flex items-center gap-2"><CheckCircle2 size={14} className="animate-spin" /> Creating...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Plus size={14} /> Create Project</span>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
