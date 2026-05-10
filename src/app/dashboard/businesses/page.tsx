import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Plus, ArrowRight, Mail, User, FileText } from 'lucide-react'

export default async function BusinessesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch businesses
  let businesses: any[] = []
  try {
    const { data } = await supabase
      .from('businesses')
      .select('*, projects(id)')
      .order('created_at', { ascending: false })
    businesses = data || []
  } catch (e) {}

  // Fetch invoices for income
  const { data: invoices } = await supabase.from('invoices').select('business_id, amount, status')
  // Fetch expenses
  const { data: expenses } = await supabase.from('expenses').select('business_id, amount')

  // Server action: create business
  async function createBusiness() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.from('businesses').insert({
      name: 'Untitled Business',
      created_by: user?.id || null,
    }).select('id').single()

    if (error) {
      console.error('Error creating business:', error)
      throw new Error(error.message)
    }

    if (data) {
      redirect(`/dashboard/businesses/${data.id}`)
    }
  }

  return (
    <div className="animate-in delay-100">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Executive Command: Businesses</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Monitor client health, financial burn rate, and active project velocity.
          </p>
        </div>
        <form action={createBusiness}>
          <button type="submit" className="btn btn-primary">
            <Plus size={16} /> New Business
          </button>
        </form>
      </div>

      <div>
        {businesses.length === 0 ? (
          <div className="glass-panel" style={{ padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid var(--surface-border)' }}>
              <Building2 size={28} color="var(--text-primary)" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No Businesses Yet</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
              Register your first client business by clicking the button above. 
              Once registered, you can track their financial health and projects.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
            {businesses.map((biz: any) => {
              
              // Calculate actual finances
              const bizInvoices = (invoices || []).filter(i => i.business_id === biz.id)
              const bizExpenses = (expenses || []).filter(e => e.business_id === biz.id)
              
              const totalIncome = bizInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0)
              const totalSpent = bizExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
              
              const contractValue = biz.total_contract_value || 0
              
              // Burn rate logic: if we have a contract value, compare expenses against it. Otherwise use total income.
              const baselineValue = contractValue > 0 ? contractValue : (totalIncome > 0 ? totalIncome : 1)
              const progress = Math.min((totalSpent / baselineValue) * 100, 100)

              const isGreen = biz.health_status !== 'red' && biz.health_status !== 'yellow'
              const healthColor = biz.health_status === 'red' ? 'var(--error)' : biz.health_status === 'yellow' ? 'var(--warning)' : 'var(--success)'

              return (
                <Link
                  key={biz.id}
                  href={`/dashboard/businesses/${biz.id}`}
                  className="glass-panel hover-card-biz"
                  style={{ 
                    padding: '24px', textDecoration: 'none', color: 'inherit', 
                    display: 'flex', flexDirection: 'column', gap: '20px',
                    position: 'relative', overflow: 'hidden'
                  }}
                >
                  {/* Top Row: Info & Health */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--surface-border)', position: 'relative' }}>
                        <Building2 size={20} color="var(--text-primary)" />
                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: healthColor, border: '2px solid var(--surface)' }} title={`Health: ${biz.health_status}`} />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '4px' }}>{biz.name}</h3>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                          <span>{biz.projects?.length || 0} active projects</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Row */}
                  {(biz.contact_name || biz.contact_email) && (
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                      {biz.contact_name && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} color="var(--text-tertiary)" /> {biz.contact_name}</span>}
                      {biz.contact_email && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} color="var(--text-tertiary)" /> {biz.contact_email}</span>}
                    </div>
                  )}

                  {/* Financial Burn Rate */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Expense Burn vs Budget</span>
                      <span style={{ fontWeight: 600, color: progress > 80 ? 'var(--error)' : 'var(--text-primary)' }}>
                        ${totalSpent.toLocaleString()} / ${(contractValue > 0 ? contractValue : totalIncome).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: progress > 80 ? 'var(--error)' : 'var(--accent-primary)', borderRadius: '3px' }} />
                    </div>
                  </div>

                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

