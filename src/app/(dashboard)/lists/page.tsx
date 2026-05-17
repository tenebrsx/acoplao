import { createClient } from '@/utils/supabase/server'
import { ListsClient } from './ListsClient'

export default async function ListsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lists } = await supabase
    .from('lists')
    .select('*')
    .eq('user_id', user?.id || '')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="animate-in delay-100">
      <ListsClient initialLists={lists || []} userId={user?.id || ''} />
    </div>
  )
}
