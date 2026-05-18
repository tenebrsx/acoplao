import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DocEditorClient } from './DocEditorClient'

async function getAncestors(supabase: any, parentId: string | null, ancestors: any[] = []): Promise<any[]> {
  if (!parentId) return ancestors.reverse()
  const { data: parent } = await supabase
    .from('documents')
    .select('id, title, parent_id')
    .eq('id', parentId)
    .single()
  if (!parent) return ancestors.reverse()
  ancestors.push(parent)
  return getAncestors(supabase, parent.parent_id, ancestors)
}

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: doc } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (!doc) redirect('/docs')

  const ancestors = await getAncestors(supabase, doc.parent_id)

  const { data: allDocs } = await supabase
    .from('documents')
    .select('id, title, parent_id, icon, is_public, created_by, tags, updated_at, created_at')
    .order('title', { ascending: true })

  return <DocEditorClient doc={doc} ancestors={ancestors} allDocuments={allDocs || []} />
}
