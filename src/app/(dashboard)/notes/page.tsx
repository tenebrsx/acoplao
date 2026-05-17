import { createClient } from '@/utils/supabase/server'
import { NotesClient } from './NotesClient'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user?.id || '')
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="animate-in delay-100">
      <NotesClient initialNotes={notes || []} userId={user?.id || ''} />
    </div>
  )
}
