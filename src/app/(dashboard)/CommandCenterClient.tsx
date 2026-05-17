'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import {
  DollarSign, CheckCircle2, Circle, Plus, FolderKanban, Building2,
  Calendar, Activity, LayoutGrid, Bell, AlertTriangle, Clock,
  TrendingUp, TrendingDown, Briefcase, Users, Zap, ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'

type DashboardData = {
  invoices: any[]
  expenses: any[]
  projects: any[]
  phases: any[]
  activity: any[]
  notifications: any[]
  events: any[]
  businesses: any[]
  tasks: any[]
  userName: string
  role: string
  healthDistribution: { on_track: number; waiting_client: number; waiting_team: number; blocked: number }
  overduePhases: number
  outstandingReceivables: number
  monthlyRevenue: number
  unreadNotifications: number
}

export function CommandCenterClient({ data }: { data: DashboardData }) {
  const supabase = createClient()
  const [tasks, setTasks] = useState(data.tasks)
  const [newTask, setNewTask] = useState('')

  const activeProjects = data.projects.filter((p: any) => p.status === 'active').length
  const totalProjects = data.projects.length

  const upcomingItems: { id: string; title: string; subtitle: string; date: Date; type: string }[] = []
  data.phases.slice(0, 6).forEach((p: any) => {
    upcomingItems.push({
      id: `phase-${p.id}`,
      title: p.phase_name,
      subtitle: p.projects?.title || 'Unknown Project',
      date: new Date(p.scheduled_date),
      type: 'phase'
    })
  })
  data.events?.slice(0, 4).forEach((e: any) => {
    upcomingItems.push({
      id: `event-${e.id}`,
      title: e.title,
      subtitle: 'Calendar Event',
      date: new Date(e.start_time),
      type: 'event'
    })
  })

  const sortedAgenda = upcomingItems
    .filter(item => item.date >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6)

  const toggleTask = async (id: string, current: boolean) => {
    const newStatus = current ? 'todo' : 'done'
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    }).eq('id', id)
  }

  const addTask = async () => {
    if (!newTask.trim()) return
    const { data: userData } = await supabase.auth.getUser()
    const { data: row } = await supabase.from('tasks').insert({
      title: newTask,
      status: 'todo',
      user_id: userData.user?.id,
      priority: 'medium'
    }).select('*').single()
    if (row) setTasks(prev => [row, ...prev])
    setNewTask('')
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const alerts = []
  if (data.overduePhases > 0) alerts.push({ type: 'warning', message: `${data.overduePhases} overdue phase${data.overduePhases > 1 ? 's' : ''}`, icon: AlertTriangle, href: '/projects' })
  if (data.healthDistribution.blocked > 0) alerts.push({ type: 'error', message: `${data.healthDistribution.blocked} blocked project${data.healthDistribution.blocked > 1 ? 's' : ''}`, icon: AlertTriangle, href: '/projects' })
  if (data.outstandingReceivables > 0) alerts.push({ type: 'info', message: `$${data.outstandingReceivables.toLocaleString()} outstanding`, icon: DollarSign, href: '/finances' })
  if (data.unreadNotifications > 0) alerts.push({ type: 'default', message: `${data.unreadNotifications} unread notification${data.unreadNotifications > 1 ? 's' : ''}`, icon: Bell, href: '/inbox' })

  return (
    <div className="flex flex-col gap-8 animate-in delay-100">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            {greeting()}, {data.userName}
          </h1>
          <p className="text-muted-foreground">
            {activeProjects} active · {totalProjects} total projects
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/inbox"><Bell size={14} className="mr-1.5" /> Inbox</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/projects?action=new-project"><Plus size={14} className="mr-1.5" /> New Project</Link>
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert, i) => (
            <Link
              key={i}
              href={alert.href}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                alert.type === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-600 hover:bg-red-500/10' :
                alert.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 hover:bg-amber-500/10' :
                alert.type === 'info' ? 'bg-blue-500/5 border-blue-500/20 text-blue-600 hover:bg-blue-500/10' :
                'bg-secondary border-border text-foreground hover:bg-secondary/80'
              }`}
            >
              <alert.icon size={14} />
              {alert.message}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Projects</span>
              <FolderKanban size={16} className="text-primary" />
            </div>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <div className="text-xs text-muted-foreground">of {totalProjects} total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Revenue</span>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">${data.monthlyRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">this month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding</span>
              <TrendingDown size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold">${data.outstandingReceivables.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">in receivables</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Tasks</span>
              <CheckCircle2 size={16} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <div className="text-xs text-muted-foreground">due this week</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity size={16} className="text-primary" /> Project Health
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/projects" className="text-xs">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'On Track', count: data.healthDistribution.on_track, color: 'bg-emerald-500', text: 'text-emerald-600' },
                  { label: 'Waiting Client', count: data.healthDistribution.waiting_client, color: 'bg-amber-500', text: 'text-amber-600' },
                  { label: 'Waiting Team', count: data.healthDistribution.waiting_team, color: 'bg-blue-500', text: 'text-blue-600' },
                  { label: 'Blocked', count: data.healthDistribution.blocked, color: 'bg-red-500', text: 'text-red-600' }
                ].map(h => (
                  <div key={h.label} className="p-3 rounded-lg border bg-card text-center">
                    <div className={`text-2xl font-bold ${h.text}`}>{h.count}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{h.label}</div>
                    <div className={`h-1 rounded-full mt-2 ${h.color} opacity-20`}>
                      <div className={`h-full rounded-full ${h.color}`} style={{ width: totalProjects > 0 ? `${(h.count / totalProjects) * 100}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Zap size={18} className="text-primary" /> Production Pulse
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects" className="text-xs">View All Projects</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.projects.slice(0, 4).map((p: any) => {
                const phases = p.project_phases || []
                const done = phases.filter((ph: any) => ph.is_completed).length
                const progress = phases.length > 0 ? Math.round((done / phases.length) * 100) : 0
                const isBlocked = p.bottleneck_status === 'blocked'
                const isWaiting = p.bottleneck_status === 'waiting_client' || p.bottleneck_status === 'waiting_team'

                return (
                  <Link key={p.id} href={`/projects/${p.id}`} className="block">
                    <Card className={`h-full border-border/50 hover:border-primary/50 hover:-translate-y-0.5 transition-all cursor-pointer ${isBlocked ? 'border-red-500/30' : isWaiting ? 'border-amber-500/30' : ''}`}>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{p.title}</div>
                            <div className="text-xs text-muted-foreground">{p.businesses?.name}</div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] h-5 ${
                            p.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            p.status === 'paused' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-muted'
                          }`}>
                            {p.status}
                          </Badge>
                        </div>
                        <Progress value={progress} className="h-1.5 mb-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{done} / {phases.length} phases</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" /> Upcoming
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/calendar" className="text-xs">Calendar</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedAgenda.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
                )}
                {sortedAgenda.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === 'phase' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {item.type === 'phase' ? <Briefcase size={14} /> : <Calendar size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {item.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-500" /> My Tasks
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/tasks" className="text-xs">All Tasks</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-3">
                {tasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-2.5 group">
                    <button onClick={() => toggleTask(t.id, t.status === 'done')} className="shrink-0">
                      {t.status === 'done' ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <Circle size={16} className="text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>
                    <span className={`text-sm flex-1 truncate ${t.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                      {t.title}
                    </span>
                    {t.priority === 'urgent' && <Badge variant="destructive" className="text-[10px] h-4">Urgent</Badge>}
                    {t.priority === 'high' && <Badge variant="default" className="text-[10px] h-4">High</Badge>}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">No pending tasks.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="Add a task..."
                  className="flex-1 text-sm h-8"
                />
                <Button size="icon" className="h-8 w-8" onClick={addTask}><Plus size={14} /></Button>
              </div>
            </CardContent>
          </Card>

          {data.activity.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity size={16} className="text-primary" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.activity.slice(0, 5).map((act: any) => (
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
                             act.action === 'phase_completed' ? 'completed' :
                             act.action === 'broadcast_sent' ? 'sent broadcast for' : 'updated'}
                            {' '}
                            {act.target_name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
