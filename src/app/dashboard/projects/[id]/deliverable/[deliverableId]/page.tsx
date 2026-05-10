import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, Settings2 } from 'lucide-react'
import { VideoReviewClient } from './VideoReviewClient'

export default async function DeliverableDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string, deliverableId: string }> 
}) {
  const { id: projectId, deliverableId } = await params
  const supabase = await createClient()

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('*, deliverable_phases(*)')
    .eq('id', deliverableId)
    .single()

  if (!deliverable) redirect(`/dashboard/projects/${projectId}`)

  return (
    <div className="animate-in delay-100" style={{ maxWidth: '1200px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Link href={`/dashboard/projects/${projectId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '12px', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Matrix
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{deliverable.title}</h1>
            <span className="badge" style={{ background: 'var(--surface-hover)', textTransform: 'capitalize' }}>
              {(deliverable.status_v2 || 'in_progress').replace('_', ' ')}
            </span>
          </div>
          {deliverable.description && (
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9375rem' }}>
              {deliverable.description}
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" style={{ background: 'var(--surface)' }}>
            <Settings2 size={16} /> Settings
          </button>
        </div>
      </div>

      {/* Frame.io Replacement Engine */}
      <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: '600px' }}>
        {deliverable.file_url ? (
          <VideoReviewClient deliverableId={deliverable.id} fileUrl={deliverable.file_url} />
        ) : (
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid var(--surface-border)' }}>
              <Video size={32} color="var(--text-tertiary)" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No Asset Uploaded</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6, marginBottom: '24px' }}>
              The Video Review Engine requires an asset to be attached to this deliverable. Paste a video URL in the Matrix view to initialize the review session.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
