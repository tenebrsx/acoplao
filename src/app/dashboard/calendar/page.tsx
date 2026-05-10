import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarClient } from './CalendarClient'

export default async function GlobalCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all active phases across all projects
  const { data: phases } = await supabase
    .from('deliverable_phases')
    .select('*, deliverables(id, title, projects(id, title, businesses(name)))')
    .order('scheduled_date', { ascending: true })

  // Fetch todos
  let todos: any[] = []
  try {
    const { data } = await supabase
      .from('todos')
      .select('*, profiles(email)')
      .order('due_date', { ascending: true })
    todos = data || []
  } catch (e) {
    // Graceful fail if the table doesn't exist yet
  }

  return (
    <div className="animate-in delay-100">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Workspace Calendar</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage project deadlines, global tasks, and metadata across your entire agency.
        </p>
      </div>

      <CalendarClient initialPhases={phases || []} initialTodos={todos} />
    </div>
  )
}
