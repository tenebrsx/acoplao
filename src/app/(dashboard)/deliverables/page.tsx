import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionCookie } from '@/lib/firebase-admin'
import { createAdminClient } from '@/utils/supabase/admin'
import { DeliverablesDashboardClient } from './DeliverablesDashboardClient'

export default async function DeliverablesDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('firebase-session')?.value
  if (!sessionToken) redirect('/login')

  const decoded = await verifySessionCookie(sessionToken)
  if (!decoded) redirect('/login')

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', decoded.email)
    .single()
  
  const role = profile?.role || 'admin'
  if (role === 'client') redirect('/') // Clients shouldn't see global deliverables tab

  // Parallel data fetching for businesses, projects, and deliverables
  const [businessesRes, projectsRes, deliverablesRes] = await Promise.all([
    supabase.from('businesses').select('id, name').neq('is_deleted', true).order('name'),
    supabase.from('projects').select('id, title, business_id').neq('is_deleted', true).order('title'),
    supabase.from('deliverables').select(`
      *,
      projects (
        id, title, business_id,
        businesses (id, name)
      )
    `).neq('is_deleted', true).order('created_at', { ascending: false }),
  ])

  return (
    <div className="animate-in delay-100">
      <DeliverablesDashboardClient 
        initialDeliverables={deliverablesRes.data || []} 
        businesses={businessesRes.data || []} 
        projects={projectsRes.data || []}
        role={role}
      />
    </div>
  )
}
