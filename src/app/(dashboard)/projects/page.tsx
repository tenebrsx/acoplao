import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionCookie } from '@/lib/firebase-admin'
import { createAdminClient } from '@/utils/supabase/admin'
import { ProjectsDashboardClient } from './ProjectsDashboardClient'

export default async function ProjectsPage() {
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

  const [businessesRes, projectsRes, blueprintsRes] = await Promise.all([
    supabase.from('businesses').select('id, name').order('name'),
    supabase.from('projects').select('*, businesses(name), deliverables(id, status_v2), project_phases(id, is_completed)').order('created_at', { ascending: false }),
    supabase.from('campaign_blueprints').select('*, blueprint_deliverables(*)').order('name'),
  ])

  return (
    <div className="animate-in delay-100">
      <ProjectsDashboardClient 
        initialProjects={projectsRes.data || []} 
        businesses={businessesRes.data || []} 
        role={role} 
        favoriteIds={[]}
        blueprints={blueprintsRes.data || []}
      />
    </div>
  )
}
