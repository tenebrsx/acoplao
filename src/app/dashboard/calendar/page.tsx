import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarClient } from './CalendarClient'

export default async function GlobalCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Parallel fetch: phases, todos, calendar events, invoice due dates, businesses (for colors)
  const [phasesRes, todosRes, eventsRes, invoicesRes, businessesRes] = await Promise.all([
    supabase
      .from('deliverable_phases')
      .select('*, deliverables(id, title, projects(id, title, businesses(id, name)))')
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('todos')
      .select('*, profiles(email)')
      .order('due_date', { ascending: true }),
    supabase
      .from('calendar_events')
      .select('*')
      .order('start_time', { ascending: true }),
    supabase
      .from('invoices')
      .select('id, amount, status, due_date, description, businesses(id, name)')
      .in('status', ['draft', 'open'])
      .order('due_date', { ascending: true }),
    supabase
      .from('businesses')
      .select('id, name'),
  ])

  // Fetch team members for assignee dropdown
  const { data: team } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('is_active', true)

  return (
    <div className="animate-in delay-100">
      <CalendarClient
        initialPhases={phasesRes.data || []}
        initialTodos={todosRes.data || []}
        initialEvents={eventsRes.data || []}
        initialInvoices={(invoicesRes.data as any) || []}
        businesses={businessesRes.data || []}
        team={team || []}
        userId={user.id}
      />
    </div>
  )
}
