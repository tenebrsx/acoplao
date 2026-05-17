import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import {
  ArrowLeft, UserPlus, UserMinus, Calendar, Globe, Layout, Save,
  Plus, Briefcase, Zap, Clock, Activity, Target, BarChart3, Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import ProjectEditorClient from './ProjectEditorClient'
import { ProjectPhasesClient } from './ProjectPhasesClient'
import { DeliverablesClient } from './DeliverablesClient'
import { CampaignStrategyBrief } from './CampaignStrategyBrief'
import { CampaignActivityFeed } from './CampaignActivityFeed'
import { ClientPortalView } from './ClientPortalView'

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = 'overview' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role = 'admin'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id || '')
      .single()
    if (profile?.role) role = profile.role
  }

  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isClient = role === 'client'

  const { data: project } = await supabase
    .from('projects')
    .select('*, businesses(name, contact_email)')
    .eq('id', id)
    .single()

  if (!project) redirect('/projects')

  const { data: members } = await supabase
    .from('project_members')
    .select('id, user_id, profiles(email, role)')
    .eq('project_id', id)

  const { data: projectPhases } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*, deliverable_phases(*), review_links(id, token, is_active)')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  const { data: recentActivity } = await supabase
    .from('campaign_activity')
    .select('*, profiles(email)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  let projectExpenses = 0
  let projectContractorCosts = 0
  if (isAdmin || isManager) {
    const { data: expenses } = await supabase.from('expenses').select('amount').eq('project_id', id)
    projectExpenses = (expenses || []).reduce((sum, exp) => sum + Number(exp.amount), 0)

    const { data: timesheets } = await supabase.from('contractor_timesheets').select('hours_logged, hourly_rate').eq('project_id', id)
    projectContractorCosts = (timesheets || []).reduce((sum, ts) => sum + (Number(ts.hours_logged) * Number(ts.hourly_rate)), 0)
  }
  const totalProjectCosts = projectExpenses + projectContractorCosts

  const totalPhases = projectPhases?.length || 0
  const completedPhases = projectPhases?.filter((p: any) => p.is_completed).length || 0
  const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingPhases = (projectPhases || [])
    .filter((p: any) => !p.is_completed && p.scheduled_date && new Date(p.scheduled_date) >= today)
    .sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
  const nextMilestone = upcomingPhases[0]
  const daysUntilMilestone = nextMilestone
    ? Math.ceil((new Date(nextMilestone.scheduled_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const totalAssets = deliverables?.length || 0
  const completedAssets = deliverables?.filter((d: any) => d.status_v2 === 'approved' || d.status_v2 === 'delivered').length || 0

  const allocatedBudget = project.strategy_data?.allocated_budget || 0
  const budgetProgress = allocatedBudget > 0 ? Math.round((totalProjectCosts / allocatedBudget) * 100) : 0
  const budgetRemaining = allocatedBudget - totalProjectCosts
  const isOverBudget = totalProjectCosts > allocatedBudget && allocatedBudget > 0

  let allProfiles: any[] = []
  if (isAdmin) {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('is_active', true)
      .order('email')
    allProfiles = data || []
  }

  const memberUserIds = members?.map((m: any) => m.user_id) || []

  async function addMember(formData: FormData) {
    'use server'
    const userId = formData.get('userId') as string
    if (!userId) return
    const supabase = await createClient()
    await supabase.from('project_members').insert({ project_id: id, user_id: userId })
    revalidatePath(`/projects/${id}`)
  }

  async function removeMember(formData: FormData) {
    'use server'
    const memberId = formData.get('memberId') as string
    if (!memberId) return
    const supabase = await createClient()
    await supabase.from('project_members').delete().eq('id', memberId)
    revalidatePath(`/projects/${id}`)
  }

  async function updateCampaignStatus(formData: FormData) {
    'use server'
    const bottleneck = formData.get('bottleneck') as any
    const broadcast = formData.get('broadcast') as string
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('projects').update({
      bottleneck_status: bottleneck,
      client_broadcast_message: broadcast
    }).eq('id', id)

    if (broadcast !== project.client_broadcast_message) {
      await supabase.from('campaign_activity').insert({
        project_id: id,
        user_id: user?.id,
        action: 'broadcast_sent',
        target_name: 'Client Portal'
      })
    }
    revalidatePath(`/projects/${id}`)
  }

  if (isClient) {
    return <ClientPortalView project={project} deliverables={deliverables || []} />
  }

  const bottleneckConfig: Record<string, { color: string; bg: string; border: string }> = {
    on_track: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    waiting_client: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    waiting_team: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    blocked: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  }

  const bConfig = bottleneckConfig[project.bottleneck_status || 'on_track']

  const deliverableCounts = {
    approved: deliverables?.filter((d: any) => d.status_v2 === 'approved').length || 0,
    delivered: deliverables?.filter((d: any) => d.status_v2 === 'delivered').length || 0,
    in_progress: deliverables?.filter((d: any) => d.status_v2 === 'in_progress').length || 0,
    review: deliverables?.filter((d: any) => d.status_v2 === 'review').length || 0
  }

  return (
    <div className="animate-in delay-100 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={12} /> Back to Projects
          </Link>
          <ProjectEditorClient project={project} />
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`capitalize text-xs ${bConfig.bg} ${bConfig.color} ${bConfig.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${bConfig.color.replace('text-', 'bg-')}`} />
              {(project.bottleneck_status || 'on_track').replace('_', ' ')}
            </Badge>
            {project.project_type && project.project_type !== 'other' && (
              <Badge variant="secondary" className="capitalize text-xs">
                {project.project_type.replace('_', ' ')}
              </Badge>
            )}
            {project.businesses?.name && (
              <span className="text-sm text-muted-foreground">{project.businesses.name}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {(isAdmin || isManager) && allocatedBudget > 0 && (
            <div className="text-right">
              <div className={`text-sm font-bold ${isOverBudget ? 'text-red-500' : ''}`}>
                ${totalProjectCosts.toLocaleString()}
                <span className="text-xs text-muted-foreground font-medium"> / ${allocatedBudget.toLocaleString()}</span>
              </div>
              <Progress value={Math.min(budgetProgress, 100)} className="h-1 w-32 mt-1" />
            </div>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/portal/${project.id}`} target="_blank" className="gap-1.5">
              <Globe size={14} /> Portal
            </Link>
          </Button>
        </div>
      </div>

      {isAdmin && (
        <form action={updateCampaignStatus} className="flex gap-2 items-center p-3 rounded-lg border bg-card">
          <select
            name="bottleneck"
            defaultValue={project.bottleneck_status}
            className="h-8 px-2 text-xs bg-background border border-input rounded-md"
          >
            <option value="on_track">On Track</option>
            <option value="waiting_client">Waiting on Client</option>
            <option value="waiting_team">Waiting on Team</option>
            <option value="blocked">Blocked</option>
          </select>
          <input
            name="broadcast"
            placeholder="Client broadcast message..."
            defaultValue={project.client_broadcast_message || ''}
            className="flex-1 h-8 px-3 text-xs bg-background border border-input rounded-md"
          />
          <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Save size={14} />
          </Button>
        </form>
      )}
      {project.client_broadcast_message && !isAdmin && (
        <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20 text-sm text-amber-700">
          <span className="font-semibold">Broadcast:</span> {project.client_broadcast_message}
        </div>
      )}

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" asChild>
            <Link href={`/projects/${id}?tab=overview`}>Overview</Link>
          </TabsTrigger>
          <TabsTrigger value="pipeline" asChild>
            <Link href={`/projects/${id}?tab=pipeline`}>Pipeline</Link>
          </TabsTrigger>
          <TabsTrigger value="deliverables" asChild>
            <Link href={`/projects/${id}?tab=deliverables`}>Deliverables</Link>
          </TabsTrigger>
          <TabsTrigger value="team" asChild>
            <Link href={`/projects/${id}?tab=team`}>Team</Link>
          </TabsTrigger>
          <TabsTrigger value="activity" asChild>
            <Link href={`/projects/${id}?tab=activity`}>Activity</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {nextMilestone && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider">Current Focus</div>
                    <div className="text-lg font-bold">{nextMilestone.phase_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {daysUntilMilestone === 0 ? 'Due today' : daysUntilMilestone === 1 ? 'Due tomorrow' : `Due in ${daysUntilMilestone} days`}
                      {nextMilestone.scheduled_date && ` · ${new Date(nextMilestone.scheduled_date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-3xl font-extrabold">{progress}%</div>
                    <div className="text-xs text-muted-foreground">{completedPhases} of {totalPhases} phases complete</div>
                  </div>
                </div>
                <Progress value={progress} className="h-2 mt-4" />
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CampaignStrategyBrief projectId={id} initialData={project.strategy_data} isAdmin={isAdmin} />

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase size={16} className="text-primary" /> Deliverables
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                      <div className="text-2xl font-bold text-emerald-600">{deliverableCounts.approved + deliverableCounts.delivered}</div>
                      <div className="text-xs text-muted-foreground">Approved</div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-center">
                      <div className="text-2xl font-bold text-blue-600">{deliverableCounts.in_progress}</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
                      <div className="text-2xl font-bold text-amber-600">{deliverableCounts.review}</div>
                      <div className="text-xs text-muted-foreground">In Review</div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary border text-center">
                      <div className="text-2xl font-bold">{totalAssets}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/projects/${id}?tab=deliverables`}>View All Deliverables</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity size={16} className="text-primary" /> Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity && recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.map((act: any) => (
                        <div key={act.id} className="flex items-start gap-3">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-secondary">
                              {act.profiles?.email?.charAt(0).toUpperCase() || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">
                              <span className="font-medium">{act.profiles?.email?.split('@')[0] || 'System'}</span>
                              {' '}
                              <span className="text-muted-foreground">
                                {act.action === 'asset_created' ? 'created' :
                                 act.action === 'status_change' ? 'updated' :
                                 act.action === 'phase_completed' ? 'completed' : 'updated'}
                                {' '}
                                {act.target_name}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(act.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
                  )}
                  <Button variant="ghost" className="w-full mt-3 text-xs" asChild>
                    <Link href={`/projects/${id}?tab=activity`}>View All Activity</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users size={16} className="text-primary" /> Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex -space-x-2">
                    {members?.slice(0, 5).map((m: any) => (
                      <Avatar key={m.id} className="h-8 w-8 border-2 border-background">
                        <AvatarFallback className="text-xs bg-secondary">
                          {m.profiles?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {members && members.length > 5 && (
                      <div className="h-8 w-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                        +{members.length - 5}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" className="w-full mt-3 text-xs" asChild>
                    <Link href={`/projects/${id}?tab=team`}>Manage Team</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-6">
          <ProjectPhasesClient projectId={id} initialPhases={projectPhases || []} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="deliverables" className="mt-6">
          <DeliverablesClient projectId={id} initialDeliverables={deliverables || []} />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users size={18} className="text-primary" /> Assigned Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!members || members.length === 0) ? (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              ) : (
                members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] font-bold bg-secondary">
                          {m.profiles?.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium">{m.profiles?.email.split('@')[0]}</span>
                        <span className="text-xs text-muted-foreground ml-2">({m.profiles?.role})</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <form action={removeMember}>
                        <input type="hidden" name="memberId" value={m.id} />
                        <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500">
                          <UserMinus size={14} />
                        </Button>
                      </form>
                    )}
                  </div>
                ))
              )}

              {isAdmin && (
                <form action={addMember} className="flex gap-2 pt-3 border-t">
                  <select
                    name="userId"
                    required
                    className="flex-1 h-9 px-3 text-sm bg-background border border-input rounded-md"
                  >
                    <option value="">Add member...</option>
                    {allProfiles
                      .filter(p => !memberUserIds.includes(p.id))
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.email} ({p.role})</option>
                      ))}
                  </select>
                  <Button type="submit" size="sm" className="h-9 w-9 p-0">
                    <Plus size={14} />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <CampaignActivityFeed projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
