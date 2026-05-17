import { createClient } from '@/utils/supabase/server'
import { ProjectsDashboardClient } from './ProjectsDashboardClient'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role = 'admin'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id || '')
      .single()
    role = profile?.role || 'admin'
  }

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name')
    .order('name')

  const { data: projects } = await supabase
    .from('projects')
    .select('*, businesses(name), deliverables(id, status_v2), project_phases(id, is_completed)')
    .order('created_at', { ascending: false })

  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('entity_id')
    .eq('user_id', user?.id || '')
    .eq('entity_type', 'project')

  const favoriteIds = (favorites || []).map(f => f.entity_id)

  const { data: blueprints } = await supabase
    .from('campaign_blueprints')
    .select('*, blueprint_deliverables(*)')
    .order('name')

  return (
    <div className="animate-in delay-100">
      <ProjectsDashboardClient 
        initialProjects={projects || []} 
        businesses={businesses || []} 
        role={role} 
        favoriteIds={favoriteIds}
        blueprints={blueprints || []}
      />
    </div>
  )
}
