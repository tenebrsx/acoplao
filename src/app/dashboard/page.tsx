import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CommandCenterClient } from './CommandCenterClient'

export default async function DashboardOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user name
  let userName = 'Commander'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', user.id)
      .single()
    userName = profile?.email?.split('@')[0] || 'Commander'
  }

  // Parallel data fetches for maximum speed
  const [invoicesRes, expensesRes, todosRes, leadsRes, projectsRes, phasesRes, notifsRes, eventsRes] = await Promise.all([
    supabase.from('invoices').select('id, amount, status, due_date, business_id'),
    supabase.from('expenses').select('id, amount, category'),
    supabase.from('todos').select('*').eq('assigned_to', user?.id || '').order('created_at', { ascending: false }).limit(20),
    supabase.from('leads').select('id, name, status, created_at'),
    supabase.from('projects').select('id, title, status, businesses(name), deliverables(id, status_v2)').order('created_at', { ascending: false }).limit(6),
    supabase.from('deliverable_phases').select('id, phase_name, scheduled_date, is_completed, deliverables(id, title, projects(id, title))').eq('is_completed', false).order('scheduled_date', { ascending: true }).limit(20),
    supabase.from('notifications').select('id, title, message, is_read, entity_type, created_at').eq('user_id', user?.id || '').order('created_at', { ascending: false }).limit(10),
    supabase.from('calendar_events').select('*').or(`assigned_to.eq.${user?.id},assigned_to.is.null`).order('start_time', { ascending: true })
  ])

  const dashboardData = {
    invoices: invoicesRes.data || [],
    expenses: expensesRes.data || [],
    todos: todosRes.data || [],
    leads: leadsRes.data || [],
    projects: projectsRes.data || [],
    phases: phasesRes.data || [],
    notifications: notifsRes.data || [],
    events: eventsRes.data || [],
    userName,
  }

  return (
    <div className="animate-in delay-100">
      <CommandCenterClient data={dashboardData} />
    </div>
  )
}
