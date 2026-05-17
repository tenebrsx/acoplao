import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BusinessesDashboardClient } from './BusinessesDashboardClient'

export default async function BusinessesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*, projects(id)')
    .order('created_at', { ascending: false })

  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('entity_id')
    .eq('user_id', user?.id || '')
    .eq('entity_type', 'business')

  const favoriteIds = (favorites || []).map(f => f.entity_id)

  // Fetch invoices for income
  const { data: invoices } = await supabase.from('invoices').select('business_id, amount, status')
  // Fetch expenses
  const { data: expenses } = await supabase.from('expenses').select('business_id, amount')

  // Server action: create business
  async function createBusiness() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.from('businesses').insert({
      name: 'Untitled Client',
      created_by: user?.id || null,
    }).select('id').single()

    if (error) {
      console.error('Error creating client:', error)
      throw new Error(error.message)
    }

    if (data) {
      redirect(`/businesses/${data.id}`)
    }
  }

  // Fetch blueprints for onboarding
  const { data: blueprints } = await supabase
    .from('campaign_blueprints')
    .select('*, blueprint_deliverables(*)')
    .order('name')

  return (
    <div className="animate-in delay-100">
      <BusinessesDashboardClient 
        initialBusinesses={businesses || []}
        invoices={invoices || []}
        expenses={expenses || []}
        createAction={createBusiness}
        favoriteIds={favoriteIds}
        blueprints={blueprints || []}
      />
    </div>
  )
}

