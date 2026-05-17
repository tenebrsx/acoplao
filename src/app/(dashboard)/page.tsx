import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CommandCenterClient } from './CommandCenterClient'

export default async function DashboardOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = 'Commander'
  let role = 'admin'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', user?.id || '')
      .single()
    userName = profile?.email?.split('@')[0] || 'Commander'
    role = profile?.role || 'admin'
  }

  const isAdmin = role === 'admin'
  const isManager = role === 'manager'

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const today = now.toISOString().split('T')[0]

  const [
    invoicesRes,
    expensesRes,
    projectsRes,
    projectPhasesRes,
    activityRes,
    notificationsRes,
    eventsRes,
    businessesRes,
    tasksRes
  ] = await Promise.all([
    supabase.from('invoices').select('id, amount, status, due_date, business_id'),
    supabase.from('expenses').select('id, amount, category, expense_date').gte('expense_date', startOfMonth),
    supabase.from('projects').select('id, title, status, bottleneck_status, businesses(name), project_phases(id, is_completed, scheduled_date), deliverables(id, status_v2)').order('created_at', { ascending: false }).limit(10),
    supabase.from('project_phases').select('id, phase_name, scheduled_date, is_completed, projects(id, title)').eq('is_completed', false).order('scheduled_date', { ascending: true }).limit(15),
    supabase.from('campaign_activity').select('*, profiles(email)').order('created_at', { ascending: false }).limit(10),
    supabase.from('notifications').select('*').eq('user_id', user?.id || '').eq('is_read', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('calendar_events').select('*').or(`assigned_to.eq.${user?.id},assigned_to.is.null`).gte('start_time', today).order('start_time', { ascending: true }).limit(10),
    supabase.from('businesses').select('id, name'),
    supabase.from('tasks').select('*').eq('user_id', user?.id || '').neq('status', 'done').order('due_date', { ascending: true }).limit(10)
  ])

  const projects = projectsRes.data || []
  const projectPhases = projectPhasesRes.data || []

  const healthDistribution = {
    on_track: projects.filter((p: any) => p.bottleneck_status === 'on_track' || !p.bottleneck_status).length,
    waiting_client: projects.filter((p: any) => p.bottleneck_status === 'waiting_client').length,
    waiting_team: projects.filter((p: any) => p.bottleneck_status === 'waiting_team').length,
    blocked: projects.filter((p: any) => p.bottleneck_status === 'blocked').length
  }

  const overduePhases = projectPhases.filter((p: any) => {
    if (!p.scheduled_date) return false
    return new Date(p.scheduled_date) < new Date(today)
  })

  const outstandingInvoices = (invoicesRes.data || []).filter((i: any) => i.status !== 'paid')
  const monthlyRevenue = (invoicesRes.data || [])
    .filter((i: any) => i.status === 'paid')
    .reduce((s: number, i: any) => s + Number(i.amount), 0)

  const dashboardData = {
    invoices: invoicesRes.data || [],
    expenses: expensesRes.data || [],
    projects,
    phases: projectPhases,
    activity: activityRes.data || [],
    notifications: notificationsRes.data || [],
    events: eventsRes.data || [],
    businesses: businessesRes.data || [],
    tasks: tasksRes.data || [],
    userName,
    role,
    healthDistribution,
    overduePhases: overduePhases.length,
    outstandingReceivables: outstandingInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0),
    monthlyRevenue,
    unreadNotifications: (notificationsRes.data || []).length
  }

  return (
    <div className="animate-in delay-100">
      <CommandCenterClient data={dashboardData} />
    </div>
  )
}
