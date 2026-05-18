import { createClient } from '@/utils/supabase/server'
import { UpNoteClient } from './UpNoteClient'

export default async function UpNotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || ''

  const [notebooksRes, notesRes, tagsRes] = await Promise.all([
    supabase
      .from('upnote_notebooks')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('upnote_notes')
      .select('*, upnote_note_tags(tag_id)')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false }),
    supabase
      .from('upnote_tags')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true }),
  ])

  return (
    <UpNoteClient
      initialNotebooks={notebooksRes.data || []}
      initialNotes={notesRes.data || []}
      initialTags={tagsRes.data || []}
      userId={userId}
    />
  )
}
