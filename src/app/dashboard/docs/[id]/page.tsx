import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DocEditorClient } from './DocEditorClient'

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: doc } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (!doc) redirect('/dashboard/docs')

  return <DocEditorClient doc={doc} />
}
