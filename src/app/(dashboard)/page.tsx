import { cookies } from 'next/headers'
import { verifySessionCookie } from '@/lib/firebase-admin'
import { createAdminClient } from '@/utils/supabase/admin'
import { CommandCenterClient } from './CommandCenterClient'

export default async function DashboardOverview() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('firebase-session')?.value

  let userEmail = 'commander'
  let userName = 'Commander'
  let role = 'admin'

  if (sessionToken) {
    const decoded = await verifySessionCookie(sessionToken)
    if (decoded?.email) {
      userEmail = decoded.email
      userName = decoded.email.split('@')[0]
      const supabase = createAdminClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', decoded.email)
        .single()
      role = profile?.role || 'admin'
    }
  }

  const supabase = createAdminClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const today = now.toISOString().split('T')[0]

  const [
    projectsRes,
    projectPhasesRes,
    eventsRes,
    tasksRes,
    clientsRes,
    deliverablesRes
  ] = await Promise.all([
    supabase.from('projects').select('id, title, status, bottleneck_status, businesses(name), project_phases(id, is_completed, scheduled_date)').order('created_at', { ascending: false }).limit(8),
    supabase.from('project_phases').select('id, phase_name, scheduled_date, is_completed, projects(id, title)').eq('is_completed', false).order('scheduled_date', { ascending: true }).limit(50),
    supabase.from('calendar_events').select('id, title, start_time').gte('start_time', startOfMonth).order('start_time', { ascending: true }).limit(50),
    supabase.from('tasks').select('*').eq('user_email', userEmail).neq('status', 'done').order('due_date', { ascending: true }).limit(10),
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('project_phases').select('*', { count: 'exact', head: true }).eq('is_completed', false)
  ])

  const projects = projectsRes.data || []
  const projectPhases = projectPhasesRes.data || []

  const healthDistribution = {
    on_track: projects.filter((p: any) => !p.bottleneck_status || p.bottleneck_status === 'on_track').length,
    waiting_client: projects.filter((p: any) => p.bottleneck_status === 'waiting_client').length,
    waiting_team: projects.filter((p: any) => p.bottleneck_status === 'waiting_team').length,
    blocked: projects.filter((p: any) => p.bottleneck_status === 'blocked').length,
  }

  const dashboardData = {
    projects,
    phases: projectPhases,
    events: eventsRes.data || [],
    tasks: tasksRes.data || [],
    userName,
    userEmail,
    role,
    healthDistribution,
    clients: clientsRes.count || 0,
    activeDeliverables: deliverablesRes.count || 0,
    activeProjects: projects.filter((p: any) => p.status === 'active').length,
    totalProjects: projects.length,
    outstandingReceivables: 0,
    monthlyRevenue: 0,
  }

  return (
    <div className="animate-in delay-100">
      <CommandCenterClient data={dashboardData} />
    </div>
  )
}
