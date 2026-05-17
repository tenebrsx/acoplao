import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings2 } from 'lucide-react'
import { DeliverableWorkspaceClient } from './DeliverableWorkspaceClient'

export default async function DeliverableDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string, deliverableId: string }> 
}) {
  const { id: projectId, deliverableId } = await params
  const supabase = await createClient()

  // Fetch deliverable
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('*, deliverable_phases(*)')
    .eq('id', deliverableId)
    .single()

  if (!deliverable) redirect(`/projects/${projectId}`)

  return (
    <div className="animate-in delay-100 h-full flex flex-col px-6 pb-6 pt-4 max-w-[1600px] mx-auto">
      
      {/* Dynamic Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-[var(--text-tertiary)] text-sm mb-3 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Project Matrix
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">{deliverable.title || 'Untitled Asset'}</h1>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--surface-hover)] border border-[var(--surface-border)] capitalize text-[var(--text-secondary)]">
              {(deliverable.status_v2 || 'in_progress').replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="btn btn-secondary btn-sm bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] text-[var(--text-secondary)] hover:text-white transition-all">
            <Settings2 size={16} /> Asset Settings
          </button>
        </div>
      </div>

      {/* 🚀 The Unified Command Center Workspace */}
      <div className="flex-1 min-h-0">
        <DeliverableWorkspaceClient deliverable={deliverable} />
      </div>

    </div>
  )
}
