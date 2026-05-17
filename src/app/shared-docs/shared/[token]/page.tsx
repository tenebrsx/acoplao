import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { DocEditorClient } from '@/app/(dashboard)/docs/[id]/DocEditorClient'
import { Sparkles } from 'lucide-react'

export default async function SharedDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  
  // We use a service role client here or normal client depending on RLS.
  // Since we haven't set up service role in the client utils, we'll just use the default.
  // The document needs to be accessible by anon if is_public is true.
  const supabase = await createClient()
  
  // Try to fetch the document
  const { data: document, error } = await supabase
    .from('documents')
    .select('*')
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (error || !document) {
    notFound()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Public Header */}
      <div style={{ 
        height: '64px', borderBottom: '1px solid var(--surface-border)',
        background: 'var(--glass-bg)', backdropFilter: 'blur(24px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 40px', position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: 'var(--accent-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Sparkles size={12} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Aura Docs</span>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <DocEditorClient doc={document} isPublicView={true} />
      </div>
    </div>
  )
}
