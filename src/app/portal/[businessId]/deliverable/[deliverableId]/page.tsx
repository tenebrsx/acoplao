import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, MessageSquare, Clock } from 'lucide-react'
import { DeliverableReviewClient } from './DeliverableReviewClient'

export default async function PortalDeliverableView({ params }: { params: Promise<{ businessId: string, deliverableId: string }> }) {
  const { businessId, deliverableId } = await params
  let supabase;
  try {
    supabase = createAdminClient()
  } catch (err: any) {
    if (err.message === 'MISSING_SERVICE_ROLE_KEY') {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
          <div className="glass-panel" style={{ padding: '48px', maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)', marginBottom: '16px' }}>Configuration Error</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              The Client Portal requires the Supabase Service Role Key to bypass authentication securely for your clients.
            </p>
            <div style={{ textAlign: 'left', background: 'var(--bg-primary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <ol style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li>Go to your Supabase Dashboard.</li>
                <li>Navigate to <strong>Project Settings &gt; API</strong>.</li>
                <li>Copy the `service_role` secret.</li>
                <li>Add it to your `.env.local` file as `SUPABASE_SERVICE_ROLE_KEY=your_key`.</li>
                <li>Restart your Next.js server.</li>
              </ol>
            </div>
          </div>
        </div>
      )
    }
    throw err;
  }

  // Fetch deliverable with project to ensure it belongs to the business
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('*, projects!inner(business_id, title)')
    .eq('id', deliverableId)
    .eq('projects.business_id', businessId)
    .single()

  if (!deliverable) {
    return notFound()
  }

  // Fetch feedback history if we had a dedicated feedback table, but for now we'll pass the deliverable
  // Wait, in 0003 we created `review_responses` linked to `review_links`.
  // If we are native in the portal, we should be able to fetch responses if they exist,
  // but let's just let the client component handle the interactive part.

  const isDone = deliverable.status_v2 === 'approved'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '24px 48px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href={`/portal/${businessId}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Portal
          </Link>
          <div style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
              {deliverable.projects.title}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {deliverable.title || 'Review Deliverable'}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isDone ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600, padding: '8px 16px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '24px' }}>
              <CheckCircle2 size={16} /> Approved
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontSize: '0.875rem', fontWeight: 600, padding: '8px 16px', background: 'rgba(255, 170, 0, 0.1)', borderRadius: '24px' }}>
              <Clock size={16} /> Needs Review
            </div>
          )}
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex' }}>
        <DeliverableReviewClient deliverable={deliverable} businessId={businessId} />
      </main>

    </div>
  )
}
