'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
  DollarSign, TrendingUp, AlertCircle, CheckCircle2, Circle, 
  Plus, ArrowRight, FolderKanban, Users, Calendar, Activity,
  Clock, Zap, FileText
} from 'lucide-react'

type DashboardData = {
  invoices: any[]
  expenses: any[]
  todos: any[]
  leads: any[]
  projects: any[]
  phases: any[]
  notifications: any[]
  events: any[]
  userName: string
}

export function CommandCenterClient({ data }: { data: DashboardData }) {
  const supabase = createClient()
  const [todos, setTodos] = useState(data.todos)
  const [newTask, setNewTask] = useState('')

  // Financials
  const totalRevenue = data.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const unpaidInvoices = data.invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalExpenses = data.expenses.reduce((s, e) => s + Number(e.amount), 0)
  const netProfit = totalRevenue - totalExpenses
  const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'

  // Pipeline
  const leadsByStage: Record<string, number> = {}
  data.leads.forEach(l => { leadsByStage[l.status || 'new'] = (leadsByStage[l.status || 'new'] || 0) + 1 })
  const totalLeads = data.leads.length

  // Upcoming 7 days (Unified Agenda)
  const now = new Date()
  const in7 = new Date(now.getTime() + 7 * 86400000)
  
  const upcomingItems: {id: string, title: string, subtitle: string, date: Date, type: string, color: string, icon: any}[] = []
  
  data.phases.forEach(p => {
    const d = new Date(p.scheduled_date)
    if (d >= now && d <= in7 && !p.is_completed) {
      upcomingItems.push({
        id: `phase-${p.id}`, title: `${p.deliverables?.title} — ${p.phase_name}`, subtitle: p.deliverables?.projects?.title,
        date: d, type: 'phase', color: 'var(--accent-secondary)', icon: FolderKanban
      })
    }
  })

  data.events?.forEach(e => {
    const d = new Date(e.start_time)
    if (d >= now && d <= in7) {
      upcomingItems.push({
        id: `event-${e.id}`, title: e.title, subtitle: 'Calendar Event',
        date: d, type: 'event', color: e.color || 'var(--accent-primary)', icon: Calendar
      })
    }
  })

  todos.forEach(t => {
    if (t.due_date && !t.is_completed) {
      const d = new Date(t.due_date)
      if (d >= now && d <= in7) {
        upcomingItems.push({
          id: `todo-${t.id}`, title: t.title, subtitle: 'Task',
          date: d, type: 'todo', color: 'var(--info)', icon: CheckCircle2
        })
      }
    }
  })

  const upcoming = upcomingItems.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6)

  // Active projects with progress
  const projectCards = data.projects.slice(0, 6).map(p => {
    const delivs = p.deliverables || []
    const done = delivs.filter((d: any) => d.status_v2 === 'approved' || d.status_v2 === 'published').length
    return { ...p, total: delivs.length, done }
  })

  // Tasks
  const activeTodos = todos.filter(t => !t.is_completed)
  const completedTodos = todos.filter(t => t.is_completed)

  const toggleTodo = async (id: string, current: boolean) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: !current } : t))
    await supabase.from('todos').update({ is_completed: !current }).eq('id', id)
  }

  const addTask = async () => {
    if (!newTask.trim()) return
    const { data: userData } = await supabase.auth.getUser()
    const { data: row } = await supabase.from('todos').insert({
      title: newTask, is_completed: false,
      created_by: userData.user?.id, assigned_to: userData.user?.id
    }).select('*').single()
    if (row) setTodos(prev => [row, ...prev])
    setNewTask('')
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const stageColors: Record<string, string> = {
    new: 'var(--info)', contacted: 'var(--accent-primary)',
    qualified: 'var(--warning)', proposal: '#a855f7',
    won: 'var(--success)', lost: 'var(--error)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>
            {greeting()}, {data.userName}
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/businesses" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            <Plus size={16} /> New Client
          </Link>
          <Link href="/dashboard/leads" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Users size={16} /> View Pipeline
          </Link>
        </div>
      </div>

      {/* Row 1: Financial Pulse + Active Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Financial Pulse */}
        <Link href="/dashboard/finances" className="glass-panel" style={{ padding: '28px', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="var(--success)" />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Financial Pulse</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Revenue</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalRevenue.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Net Profit</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: netProfit >= 0 ? 'var(--success)' : 'var(--error)' }}>
                ${netProfit.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Margin</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{margin}%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Unpaid</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: unpaidInvoices > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                ${unpaidInvoices.toLocaleString()}
              </div>
            </div>
          </div>
        </Link>

        {/* Active Tasks */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 225, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} color="var(--accent-primary)" />
              </div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>My Tasks</h2>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              {activeTodos.length} active · {completedTodos.length} done
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '180px', marginBottom: '12px' }}>
            {activeTodos.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                All clear — no open tasks.
              </div>
            )}
            {activeTodos.slice(0, 8).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', transition: 'background 0.15s', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <button onClick={() => toggleTodo(t.id, t.is_completed)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}>
                  <Circle size={16} />
                </button>
                <span style={{ fontSize: '0.875rem', flex: 1 }}>{t.title}</span>
                {t.due_date && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                    {new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Quick-add */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTask() }}
              placeholder="Add a quick task..."
              style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
            />
            <button onClick={addTask} className="btn btn-primary btn-sm"><Plus size={16} /></button>
          </div>
        </div>
      </div>

      {/* Row 2: Pipeline Health + Upcoming 7 Days */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Pipeline Health */}
        <Link href="/dashboard/leads" className="glass-panel" style={{ padding: '28px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#a855f7" />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Pipeline Health</h2>
            <span style={{ marginLeft: 'auto', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalLeads}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(leadsByStage).map(([stage, count]) => (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stageColors[stage] || 'var(--text-tertiary)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'capitalize', flex: 1 }}>{stage.replace('_', ' ')}</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{count}</span>
                <div style={{ width: '60px', height: '4px', background: 'var(--surface-border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalLeads > 0 ? (count / totalLeads) * 100 : 0}%`, background: stageColors[stage] || 'var(--text-tertiary)', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
            {totalLeads === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                No leads yet. Start prospecting!
              </div>
            )}
          </div>
        </Link>

        {/* Upcoming 7 Days Agenda */}
        <Link href="/dashboard/calendar" className="glass-panel" style={{ padding: '28px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="var(--warning)" />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Next 7 Days Agenda</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcoming.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                Clear skies — nothing due this week.
              </div>
            )}
            {upcoming.map(item => {
              const Icon = item.icon
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ color: item.color, flexShrink: 0 }}><Icon size={14} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{item.subtitle}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
                    {item.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              )
            })}
          </div>
        </Link>
      </div>

      {/* Row 3: Active Campaigns Strip */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 225, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderKanban size={18} color="var(--accent-primary)" />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Active Campaigns</h2>
          </div>
          <Link href="/dashboard/projects" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.8125rem', textDecoration: 'none' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {projectCards.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No active campaigns. Create one from a client profile.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {projectCards.map(p => {
              const progress = p.total > 0 ? (p.done / p.total) * 100 : 0
              return (
                <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="glass-panel" style={{ padding: '20px', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s, transform 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{p.businesses?.name || 'No client'}</div>
                    </div>
                    <span className="badge" style={{ background: 'var(--surface)', color: 'var(--text-secondary)', textTransform: 'capitalize', fontSize: '0.6875rem' }}>{p.status}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '4px', background: 'var(--surface-border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? 'var(--success)' : 'var(--accent-primary)', borderRadius: '2px', transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, flexShrink: 0 }}>{p.done}/{p.total}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Row 4: Recent Activity */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} color="var(--warning)" />
          </div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Activity</h2>
          <Link href="/dashboard/inbox" style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            View inbox <ArrowRight size={14} />
          </Link>
        </div>

        {data.notifications.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            No recent activity. The agency is quiet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {data.notifications.slice(0, 8).map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', transition: 'background 0.15s' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: n.is_read ? 'var(--surface-border)' : 'var(--accent-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: n.is_read ? 400 : 600 }}>{n.title}</span>
                  {n.message && <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>{n.message.substring(0, 60)}</span>}
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
