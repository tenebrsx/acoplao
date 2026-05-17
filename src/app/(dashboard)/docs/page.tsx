import { createClient } from '@/utils/supabase/server'
import { DocsDashboardClient } from './DocsDashboardClient'

export default async function DocsDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  const { data: documents } = await supabase
    .from('documents')
    .select('*, profiles:created_by(email)')
    .order('updated_at', { ascending: false })

  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('entity_id')
    .eq('user_id', user?.id || '')
    .eq('entity_type', 'document')

  const favoriteIds = (favorites || []).map(f => f.entity_id)

  return (
    <DocsDashboardClient 
      initialDocuments={documents || []} 
      userId={user?.id || null} 
      favoriteIds={favoriteIds}
    />
  )
}
