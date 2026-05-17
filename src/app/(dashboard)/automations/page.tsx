import { createClient } from '@/utils/supabase/server'
import { AutomationBuilderClient } from './AutomationBuilderClient'

export default async function AutomationsPage() {
  const supabase = await createClient()

  // Fetch all existing automations and recent logs
  const { data: automations } = await supabase
    .from('automations')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: logs } = await supabase
    .from('automation_logs')
    .select('*, automations(name)')
    .order('executed_at', { ascending: false })
    .limit(20)

  return (
    <div className="animate-in delay-100">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Automation Engine</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Design custom rules to automate your agency's workflows and eliminate manual tasks.</p>
      </div>

      <AutomationBuilderClient initialAutomations={automations || []} recentLogs={logs || []} />
    </div>
  )
}
