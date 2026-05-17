'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, MessageSquare, Send, XCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import confetti from 'canvas-confetti'
import { useToast } from '@/components/ToastProvider'

export function DeliverableReviewClient({ deliverable, businessId }: { deliverable: any, businessId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const isApproved = deliverable.status_v2 === 'approved'

  // Because the client is anonymous on the portal, we use an edge function or the service role 
  // via a Server Action to update the status. For UI purposes, we'll use a direct supabase update 
  // ONLY if RLS allows, but earlier we saw RLS doesn't allow anon updates to deliverables. 
  // Wait! In '0003', public.deliverables requires you to be a project member to update. 
  // So we MUST use a server action to perform the update as a service role!

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    setSaving(true)
    
    try {
      // Execute the Server Action via fetch
      const res = await fetch(`/api/portal/deliverable/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverableId: deliverable.id,
          businessId: businessId,
          decision,
          feedback: decision === 'rejected' ? feedback : null
        })
      })

      if (!res.ok) throw new Error('Failed to update')

      if (decision === 'approved') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00FF88', '#00E1FF', '#FFFFFF']
        })
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      toast('Failed to submit decision', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', flexWrap: 'wrap' }}>
      
      {/* Left: Media Vault */}
      <div style={{ flex: 1, padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {deliverable.file_url ? (
          <div style={{ width: '100%', maxWidth: '800px', aspectRatio: '16/9', background: 'var(--surface)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--surface-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
             {/* If video */}
             {deliverable.file_url.includes('.mp4') || deliverable.file_url.includes('.webm') ? (
               <video src={deliverable.file_url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             ) : (
               <img src={deliverable.file_url} alt={deliverable.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
             )}
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '800px', aspectRatio: '16/9', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px dashed var(--surface-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '8px' }}>No media attached</span>
            <span style={{ fontSize: '0.875rem' }}>The agency has not uploaded the final file yet.</span>
          </div>
        )}
      </div>

      {/* Right: Interaction Panel */}
      <div style={{ width: 'min(400px, 100vw)', background: 'var(--bg-primary)', borderLeft: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--surface-border)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--accent-primary)" /> Feedback & Approval
          </h2>
        </div>

        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {isApproved ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0, 255, 136, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={32} color="var(--success)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Approved & Finalized</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>This asset has been approved and moved to your master drive.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Request Revisions</label>
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Drop timestamped feedback or revision notes here..."
                  style={{
                    width: '100%', minHeight: '120px', padding: '16px',
                    background: 'var(--surface)', border: '1px solid var(--surface-border)',
                    borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
                    fontSize: '0.875rem', resize: 'vertical'
                  }}
                />
                <button 
                  onClick={() => handleDecision('rejected')}
                  disabled={saving || !feedback.trim()}
                  className="btn btn-secondary btn-sm" 
                  style={{ width: '100%', marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '8px' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Submit Revisions
                </button>
              </div>

              <div style={{ position: 'relative', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--surface-border)' }} />
                <span style={{ position: 'relative', background: 'var(--bg-primary)', padding: '0 12px', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>OR</span>
              </div>

              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '16px' }}>
                  If everything looks perfect, approve the asset to finalize the milestone.
                </p>
                <button 
                  onClick={() => handleDecision('approved')}
                  disabled={saving}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '8px', background: 'var(--success)', color: 'var(--bg-main)' }}
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  Approve Deliverable
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
