import { createAdminClient } from '@/utils/supabase/admin'
import { ClientPortalView } from './ClientPortalView'
import { notFound } from 'next/navigation'

export default async function ClientPortalPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
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

  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      id, name, contact_name, contact_email, brand_colors, brand_typography, brand_tone_of_voice, brand_strategy_url,
      projects(id, title, status, deliverables(id, title, status_v2, published_url, publish_date, deliverable_phases(is_completed)))
    `)
    .eq('id', businessId)
    .single()

  if (error) {
    console.error('PORTAL FETCH ERROR:', error)
  }

  if (!business) {
    return notFound()
  }

  // Fetch assets specific to this business
  const { data: assets } = await supabase
    .from('digital_assets')
    .select('*')
    .eq('business_id', business.id)
    .limit(10)

  // Fetch invoices specific to this business
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount, status, due_date')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Ultra-minimal header just for the client */}
      <header style={{ padding: '24px 48px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Aura <span style={{ color: 'var(--text-tertiary)' }}>×</span> {business.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Client Portal</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-border)' }} />
        </div>
      </header>

      <main style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
        <ClientPortalView business={business} assets={assets || []} invoices={invoices || []} />
      </main>
    </div>
  )
}
