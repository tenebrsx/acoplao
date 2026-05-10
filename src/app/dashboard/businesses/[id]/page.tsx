import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { BusinessCommandCenter } from './BusinessCommandCenter'

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the business with full project and deliverable structure
  const { data: business } = await supabase
    .from('businesses')
    .select(`
      *,
      projects (
        id, title, status, created_at,
        deliverables (
          id, title, status_v2, type, created_at,
          published_url, publish_date
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!business) redirect('/dashboard/businesses')

  // Fetch Invoices for LTV and unpaid tracking
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount, status, due_date, created_at')
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
      />
    </div>
  )
}
