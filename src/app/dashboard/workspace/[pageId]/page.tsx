import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { WorkspaceClient } from './WorkspaceClient'

export default async function WorkspacePage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch page details
  const { data: page } = await supabase
    .from('workspace_pages')
    .select('*, workspace_sections(title)')
    .eq('id', pageId)
    .single()

  if (!page) {
    redirect('/dashboard')
  }

  // Fetch or initialize content
  let { data: contentRecord } = await supabase
    .from('workspace_page_content')
    .select('content')
    .eq('page_id', pageId)
    .single()

  if (!contentRecord) {
    const { data: newRecord } = await supabase
      .from('workspace_page_content')
      .insert({ page_id: pageId, content: {} })
      .select('content')
      .single()
    contentRecord = newRecord
  }

  return <WorkspaceClient page={page} initialContent={contentRecord?.content || {}} />
}
