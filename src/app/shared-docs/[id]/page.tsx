import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DocEditorClient } from './DocEditorClient'

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // if (!user) redirect('/login')

  const { data: document, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !document) {
    redirect('/docs')
  }

  return (
    <div className="animate-in delay-100 h-full">
      <DocEditorClient docId={id} initialDoc={document} />
    </div>
  )
}
