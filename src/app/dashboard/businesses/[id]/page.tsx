import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { BusinessCommandCenter } from './BusinessCommandCenter'

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the business with full project and deliverable structure
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select(`
      *,
      projects (
        id, title, status, created_at,
        deliverables (
          id, title, status_v2, created_at,
          published_url, publish_date
        )
      )
    `)
    .eq('id', id)
    .single()

  if (bizError) {
    console.error('Business fetch error:', bizError.message)
  }

  if (!business) redirect('/dashboard/businesses')

  // Fetch Invoices for LTV and unpaid tracking
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount, status, due_date, created_at, description')
    .eq('business_id', id)

  // Fetch Expenses for Profit Tracking
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount, category, expense_date')
    .eq('business_id', id)

  // Fetch Account Management Todos
  const { data: todos } = await supabase
    .from('todos')
    .select('*')
    .eq('business_id', id)
    .order('created_at', { ascending: false })

  // Fetch Assets to show what's finalized
  const { data: assets } = await supabase
    .from('digital_assets')
    .select('id, file_name, file_url, file_size_bytes, created_at')
    .eq('business_id', id)

  // Fetch Calendar Events
  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('business_id', id)
    .order('start_time', { ascending: true })

  // Fetch Deliverable Phases (we have to do this via a join or fetch all and filter)
  // Easier to fetch all phases where deliverable.project.business_id = id
  const projectIds = business.projects?.map((p: any) => p.id) || []
  let phases: any[] = []
  if (projectIds.length > 0) {
    const { data: fetchedPhases } = await supabase
      .from('deliverable_phases')
      .select('id, phase_name, scheduled_date, is_completed, deliverables(id, title)')
      // Currently supabase js doesn't support filtering by deep nested relations easily in a single array without an inner join.
      // We will just fetch phases for the known deliverables.
      // Wait, `deliverables(projects!inner(business_id))` works, but let's just fetch all phases for deliverables in these projects.
  }
  // To avoid complex joins, we can just let BusinessCommandCenter process the deliverables we already fetched for the timeline.

  return (
    <div className="animate-in delay-100" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '64px' }}>
      <Link href="/dashboard/businesses" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '24px', textDecoration: 'none', transition: 'color 0.2s' }}>
        <ArrowLeft size={16} /> Back to CRM
      </Link>

      <BusinessCommandCenter 
        business={business} 
        invoices={invoices || []} 
        expenses={expenses || []}
        todos={todos || []}
        assets={assets || []}
        events={events || []}
      />
    </div>
  )
}
