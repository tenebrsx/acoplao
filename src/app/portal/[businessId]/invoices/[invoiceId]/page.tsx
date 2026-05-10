import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download, CreditCard, Sparkles, Building2 } from 'lucide-react'
import Link from 'next/link'

export default async function ClientInvoiceView({ params }: { params: Promise<{ businessId: string, invoiceId: string }> }) {
  const { businessId, invoiceId } = await params
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

  // Fetch the invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      businesses(name),
      invoice_items(*)
    `)
    .eq('id', invoiceId)
    .eq('business_id', businessId)
    .single()

  if (!invoice) {
    return notFound()
  }

  const isPaid = invoice.status === 'paid'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Portal Header */}
      <header style={{ padding: '24px 48px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href={`/portal/${businessId}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Portal
          </Link>
          <div style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Aura <span style={{ color: 'var(--text-tertiary)' }}>×</span> {invoice.businesses.name}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary btn-sm" style={{ display: 'flex', gap: '8px' }}>
            <Download size={14} /> Download PDF
          </button>
          {!isPaid && (
            <button className="btn btn-primary btn-sm" style={{ display: 'flex', gap: '8px', background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
              <CreditCard size={14} /> Pay Now
            </button>
          )}
        </div>
      </header>

      {/* Invoice Document Wrapper */}
      <main style={{ flex: 1, padding: '64px 24px', display: 'flex', justifyContent: 'center', background: 'var(--bg-main)' }}>
        
        {/* The Actual Invoice "Paper" */}
        <div 
          className="glass-panel" 
          style={{ 
            width: '100%', maxWidth: '800px', padding: '64px', 
            background: 'var(--surface)', position: 'relative', overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)', border: '1px solid var(--surface-border)'
          }}
        >
          {/* Status Ribbon */}
          <div style={{ 
            position: 'absolute', top: '32px', right: '-32px', 
            background: isPaid ? 'var(--success)' : (invoice.status === 'overdue' ? 'var(--error)' : 'var(--warning)'), 
            color: 'white', padding: '8px 48px', transform: 'rotate(45deg)', 
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            {invoice.status}
          </div>

          {/* Decorative Top Accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, var(--text-primary), var(--text-tertiary))' }} />

          {/* Agency Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '64px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--text-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="var(--bg-primary)" />
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Aura.</span>
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                123 Innovation Drive<br/>
                San Francisco, CA 94103<br/>
                hello@aura-agency.com
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '3rem', fontWeight: 200, color: 'var(--text-tertiary)', letterSpacing: '-0.04em', lineHeight: 1 }}>INVOICE</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'monospace' }}>
                #{invoice.id.split('-')[0].toUpperCase()}
              </div>
            </div>
          </div>

          {/* Bill To & Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '64px', padding: '32px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Bill To</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--text-secondary)" /> {invoice.businesses.name}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {invoice.description || 'Consulting & Deliverables'}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Date</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div style={{ height: '1px', background: 'var(--surface-border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Due on Receipt'}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: '64px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '4fr 1fr 1fr 1.5fr', gap: '16px', paddingBottom: '16px', borderBottom: '2px solid var(--surface-border)', marginBottom: '16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div>Description</div>
              <div style={{ textAlign: 'right' }}>Qty</div>
              <div style={{ textAlign: 'right' }}>Rate</div>
              <div style={{ textAlign: 'right' }}>Amount</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {(invoice.invoice_items || []).map((item: any) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '4fr 1fr 1fr 1.5fr', gap: '16px', padding: '16px 0', borderBottom: '1px solid var(--surface-border)', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.description}</div>
                  <div style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.quantity}</div>
                  <div style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>${Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <div style={{ textAlign: 'right', fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: 600 }}>${(item.quantity * item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '64px' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)', marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <span>Subtotal</span>
                <span>${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>
                <span>Total</span>
                <span>${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', paddingTop: '32px', borderTop: '1px solid var(--surface-border)' }}>
            Thank you for your business. For any questions regarding this invoice, please contact hello@aura-agency.com.
          </div>

        </div>
      </main>
    </div>
  )
}
