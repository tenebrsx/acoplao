import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionCookie } from '@/lib/firebase-admin'
import { createAdminClient } from '@/utils/supabase/admin'
import { BusinessesDashboardClient } from './BusinessesDashboardClient'

export default async function BusinessesPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('firebase-session')?.value
  if (!sessionToken) redirect('/login')

  const decoded = await verifySessionCookie(sessionToken)
  if (!decoded) redirect('/login')

  const supabase = createAdminClient()

  const [businessesRes, blueprintsRes] = await Promise.all([
    supabase
      .from('businesses')
      .select('*, projects(id, status, deliverables(id, status_v2))')
      .order('created_at', { ascending: false }),
    supabase.from('campaign_blueprints').select('*, blueprint_deliverables(*)').order('name'),
  ])


  // Server action: create business
  async function createBusiness() {
    'use server'
    const { createAdminClient } = await import('@/utils/supabase/admin')
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('businesses')
      .insert({ name: 'Untitled Client' })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    if (data) redirect(`/businesses/${data.id}`)
  }

  return (
    <div className="animate-in delay-100">
      <BusinessesDashboardClient
        initialBusinesses={businessesRes.data || []}
        invoices={[]}
        expenses={[]}
        createAction={createBusiness}
        favoriteIds={[]}
        blueprints={blueprintsRes.data || []}
      />
    </div>
  )
}
