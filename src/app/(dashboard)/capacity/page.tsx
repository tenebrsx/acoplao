import { createClient } from '@/utils/supabase/server'
import { CapacityGanttClient } from './CapacityGanttClient'

export default async function CapacityPage() {
  const supabase = await createClient()

  // Fetch all contractors/managers (ignoring clients)
  const { data: team } = await supabase
    .from('profiles')
    .select('id, email, role')
    .neq('role', 'client')
    .eq('is_active', true)

  // Fetch all active deliverables and their phases with start/due dates
  const { data: activeDeliverables } = await supabase
    .from('deliverables')
    .select(`
      id, title, status_v2, projects(title),
      deliverable_phases(id, phase_name, is_completed, scheduled_date, assigned_to, start_date, due_date)
    `)
    .neq('status_v2', 'approved')

  return (
    <div className="animate-in delay-100">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Capacity Planning</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Global timeline showing team availability and active phase assignments.</p>
      </div>

      <CapacityGanttClient team={team || []} activeDeliverables={activeDeliverables || []} />
    </div>
  )
}
