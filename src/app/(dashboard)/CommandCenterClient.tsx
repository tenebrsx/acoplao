'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import {
  FolderKanban, CheckCircle2, Circle, Plus,
  ArrowUpRight, Users, Layers, ChevronLeft, ChevronRight
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, addMonths, subMonths, parseISO
} from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type DashboardData = {
  projects: any[]
  phases: any[]
  events: any[]
  tasks: any[]
  userName: string
  userEmail: string
  role: string
  healthDistribution: { on_track: number; waiting_client: number; waiting_team: number; blocked: number }
  clients: number
  activeDeliverables: number
  activeProjects: number
  totalProjects: number
}

export function CommandCenterClient({ data }: { data: DashboardData }) {
  const supabase = createClient()
  const [tasks, setTasks] = useState(data.tasks)
  const [newTask, setNewTask] = useState('')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const allCalendarItems: { id: string; title: string; subtitle: string; date: Date; type: string }[] = []
  data.phases.forEach((p: any) => {
    allCalendarItems.push({
      id: `phase-${p.id}`,
      title: p.phase_name,
      subtitle: p.projects?.title || 'Unknown Project',
      date: new Date(p.scheduled_date),
      type: 'phase'
    })
  })
  data.events.forEach((e: any) => {
    allCalendarItems.push({
      id: `event-${e.id}`,
      title: e.title,
      subtitle: 'Event',
      date: new Date(e.start_time),
      type: 'event'
    })
  })

  const sortedAgenda = allCalendarItems
    .filter(item => item.date >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  const toggleTask = async (id: string, current: boolean) => {
    const newStatus = current ? 'todo' : 'done'
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    }).eq('id', id)
  }

  const [currentMonth, setCurrentMonth] = useState(new Date())

  const addTask = async () => {
    if (!newTask.trim()) return
    const { data: row } = await supabase.from('tasks').insert({
      title: newTask,
      status: 'todo',
      user_email: data.userEmail,
      priority: 'medium'
    }).select('*').single()
    if (row) setTasks(prev => [row, ...prev])
    setNewTask('')
  }

  // Mini Calendar Logic
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  
  const calendarDays = []
  let currentDay = startDate
  while (currentDay <= endDate) {
    calendarDays.push(currentDay)
    currentDay = addDays(currentDay, 1)
  }

  return (
    <div className="flex flex-col gap-12">
      
      {/* HEADER & TOP STATS - NO BORDERS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-1.5">
            {greeting()}, {data.userName}.
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            Here's what's happening across your agency today.
          </p>
        </div>
        
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-full bg-background/50 backdrop-blur border-white/10" asChild>
             <Link href="/projects"><FolderKanban size={16} className="mr-2 text-muted-foreground" /> Projects</Link>
           </Button>
           <Button className="rounded-full" asChild>
             <Link href="/projects?action=new-project"><Plus size={16} className="mr-2" /> New Project</Link>
           </Button>
        </div>
      </div>

      {/* MINIMAL STRIP OF STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-white/[0.08]">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5"><FolderKanban size={14} /> Active Projects</span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{data.activeProjects}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5"><Users size={14} className="text-emerald-500" /> Clients</span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{data.clients}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5"><Layers size={14} className="text-amber-500" /> Active Deliverables</span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{data.activeDeliverables}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-500" /> Pending Tasks</span>
          <span className="text-3xl font-medium tracking-tight text-foreground">{tasks.filter(t => t.status !== 'done').length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* MAIN COLUMN */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* HEALTH DISTRIBUTION - GLASSMORPHIC */}
          <div>
             <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground/90">Project Health</h2>
             <div className="bg-[#141416]/50 border border-white/[0.08] rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {[
                    { label: 'On Track', count: data.healthDistribution.on_track, text: 'text-emerald-400' },
                    { label: 'Wait Client', count: data.healthDistribution.waiting_client, text: 'text-amber-400' },
                    { label: 'Wait Team', count: data.healthDistribution.waiting_team, text: 'text-blue-400' },
                    { label: 'Blocked', count: data.healthDistribution.blocked, text: 'text-red-400' }
                  ].map(h => (
                    <div key={h.label} className="flex flex-col items-center">
                      <div className={`text-4xl font-light tracking-tight mb-2 ${h.count > 0 ? h.text : 'text-muted-foreground/30'}`}>{h.count}</div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{h.label}</div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* PRODUCTION PULSE */}
          <div>
            <div className="flex justify-between items-end mb-4">
               <h2 className="text-lg font-medium flex items-center gap-2 text-foreground/90">Production Pulse</h2>
               <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">View All <ArrowUpRight size={14} /></Link>
            </div>
            
            <div className="flex flex-col gap-3">
              {data.projects.slice(0, 5).map((p: any) => {
                const phases = p.project_phases || []
                const done = phases.filter((ph: any) => ph.is_completed).length
                const progress = phases.length > 0 ? Math.round((done / phases.length) * 100) : 0
                const isBlocked = p.bottleneck_status === 'blocked'
                const isWaiting = p.bottleneck_status === 'waiting_client' || p.bottleneck_status === 'waiting_team'

                return (
                  <Link key={p.id} href={`/projects/${p.id}`} className="group relative overflow-hidden bg-[#141416]/50 hover:bg-[#1c1c1f]/80 border border-white/[0.06] hover:border-white/[0.12] transition-all rounded-xl p-4 flex items-center gap-4 shadow-sm">
                     <div className={`w-1 h-full absolute left-0 top-0 bottom-0 ${isBlocked ? 'bg-red-500' : isWaiting ? 'bg-amber-500' : 'bg-primary/50'}`} />
                     <div className="flex-1 min-w-0 pl-2">
                       <div className="flex items-center gap-2 mb-1.5">
                         <span className="font-medium text-foreground truncate">{p.title}</span>
                         {p.businesses?.name && <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.05]">{p.businesses.name}</span>}
                       </div>
                       <div className="text-xs text-muted-foreground flex items-center gap-3">
                         <span className="font-medium">{done}/{phases.length} Phases</span>
                         <div className="flex-1 max-w-[140px] h-1.5 bg-black/40 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${isBlocked ? 'bg-red-500' : isWaiting ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                         </div>
                       </div>
                     </div>
                     <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ArrowUpRight size={16} className="text-muted-foreground" />
                     </div>
                  </Link>
                )
              })}
              {data.projects.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                  No active projects right now.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - SLIM AND COMPACT */}
        <div className="space-y-10">
          
          {/* MINI CALENDAR */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center gap-2 text-foreground/90">Calendar</h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={14} /></Button>
                <span className="text-sm font-medium w-24 text-center">{format(currentMonth, 'MMM yyyy')}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={14} /></Button>
              </div>
            </div>
            <div className="bg-[#141416]/50 border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl shadow-lg">
              <div className="grid grid-cols-7 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                {calendarDays.map((day, i) => {
                  const dayEvents = allCalendarItems.filter(item => isSameDay(item.date, day))
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, new Date())
                  
                  return (
                    <div key={i} className="flex flex-col items-center justify-start h-8">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs transition-colors ${
                        isToday ? 'bg-primary text-primary-foreground font-bold' :
                        !isCurrentMonth ? 'text-muted-foreground/30' :
                        'text-foreground hover:bg-white/[0.05]'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="flex gap-0.5 mt-0.5 h-1">
                        {dayEvents.slice(0, 3).map((ev, ei) => (
                          <div key={ei} className={`w-1 h-1 rounded-full ${ev.type === 'phase' ? 'bg-primary' : 'bg-cyan-400'}`} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* UPCOMING AGENDA */}
          <div>
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground/90">Agenda</h2>
            <div className="bg-[#141416]/50 border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl shadow-lg">
              <div className="flex flex-col gap-5">
                {sortedAgenda.length === 0 && (
                   <p className="text-sm text-muted-foreground py-2">Your schedule is clear.</p>
                )}
                {sortedAgenda.map(item => (
                  <div key={item.id} className="flex gap-4 items-start group">
                    <div className="w-10 text-center shrink-0 pt-0.5">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-wider">{item.date.toLocaleDateString(undefined, { month: 'short' })}</div>
                      <div className="text-xl font-light text-foreground">{item.date.getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TASKS */}
          <div>
             <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground/90">My Tasks</h2>
             <div className="flex flex-col gap-1.5">
               {tasks.slice(0, 6).map(t => (
                 <div key={t.id} className="flex items-start gap-3 p-2.5 hover:bg-white/[0.03] rounded-lg transition-colors group">
                    <button onClick={() => toggleTask(t.id, t.status === 'done')} className="shrink-0 mt-0.5 focus:outline-none">
                      {t.status === 'done' ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <Circle size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </button>
                    <span className={`text-sm flex-1 leading-snug ${t.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground/90'}`}>
                      {t.title}
                    </span>
                 </div>
               ))}
               
               <div className="flex items-center gap-2 mt-2 px-2.5">
                 <Plus size={14} className="text-muted-foreground shrink-0" />
                 <Input 
                   placeholder="Add a new task..." 
                   className="h-8 text-sm bg-transparent border-0 border-b border-white/10 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/40 shadow-none"
                   value={newTask}
                   onChange={e => setNewTask(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && addTask()}
                 />
               </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  )
}
