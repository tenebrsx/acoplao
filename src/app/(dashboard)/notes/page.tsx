import { createClient } from '@/utils/supabase/server'
import { NotesClient } from './NotesClient'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || ''

  const { data: notes } = await supabase
    .from('upnote_notes')
    .select('*, upnote_note_tags(tag_id)')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  return (
    <div className="animate-in delay-100">
      <NotesClient initialNotes={notes || []} userId={userId} />
    </div>
  )
}
