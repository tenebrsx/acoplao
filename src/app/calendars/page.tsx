import { createClient } from '@/utils/supabase/server'
import { CalendarsClient } from './CalendarsClient'
import type {
  CalendarPhase, CalendarTodo, CalendarEvent,
  CalendarInvoice, CalendarBusiness, CalendarTeamMember
} from '@/lib/types/calendar'

export default async function CalendarsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  const { data: team } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('is_active', true)

  return (
    <CalendarsClient
      initialPhases={(phasesRes.data as CalendarPhase[] | null) || []}
      initialTodos={(todosRes.data as CalendarTodo[] | null) || []}
      initialEvents={(eventsRes.data as CalendarEvent[] | null) || []}
      initialInvoices={(invoicesRes.data as CalendarInvoice[] | null) || []}
      businesses={(businessesRes.data as CalendarBusiness[] | null) || []}
      team={(team as CalendarTeamMember[] | null) || []}
      userId={user?.id || ''}
    />
  )
}
