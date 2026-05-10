import { createClient } from '@/utils/supabase/server'
import { LeadsKanbanClient } from './LeadsKanbanClient'

export default async function LeadsPage() {
  const supabase = await createClient()

  // Fetch all leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="animate-in delay-100">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>CRM & Leads</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage inbound leads from your marketing site and convert them into active projects.</p>
      </div>

      <LeadsKanbanClient initialLeads={leads || []} />
    </div>
  )
}
