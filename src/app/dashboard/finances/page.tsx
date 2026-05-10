import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, Wallet, Receipt, CreditCard, Activity } from 'lucide-react'
import { ReceivablesKanbanClient } from './ReceivablesKanbanClient'

import { ExportDataClient } from './ExportDataClient'

export default async function FinancesDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard') // Only admins should see global finances
  }

  // --- Fetch Financial Data ---
  // 1. Invoices (Income)
  const { data: invoicesWithBusinesses } = await supabase
    .from('invoices')
    .select('*, businesses(name)')

  const invoices = invoicesWithBusinesses || []

  const totalIncome = (invoices || [])
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0)

  const outstandingReceivables = (invoices || [])
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0)

  // 2. Expenses (Fixed/Software/Ad Spend)
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category')

  const fixedExpenses = (expenses || [])
    .reduce((sum, exp) => sum + Number(exp.amount), 0)

  // 3. Timesheets (Contractor Costs)
  const { data: timesheets } = await supabase
    .from('contractor_timesheets')
    .select('hours_logged, hourly_rate')

  const contractorCosts = (timesheets || [])
    .reduce((sum, ts) => sum + (Number(ts.hours_logged) * Number(ts.hourly_rate)), 0)

  const totalExpenses = fixedExpenses + contractorCosts
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'

  return (
    <div className="animate-in delay-100">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wallet size={28} color="var(--accent-primary)" /> Global Finances
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Agency-wide accounting, profit margins, and cashflow pipeline.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/finances/invoices/new" className="btn btn-secondary">
            <Receipt size={16} /> New Invoice
          </Link>
          <Link href="/dashboard/finances/expenses/new" className="btn btn-primary">
            <CreditCard size={16} /> Log Expense
          </Link>
        </div>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-4" style={{ marginBottom: '32px' }}>
        <div className="metric-card hover-card-biz">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={14} color="var(--success)" /> Gross Revenue
          </div>
          <div className="metric-value">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        
        <div className="metric-card hover-card-biz">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={14} color="var(--error)" /> Total Expenses
          </div>
          <div className="metric-value">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>

        <div className="metric-card hover-card-biz">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} color="var(--info)" /> Net Profit Margin
          </div>
          <div className="metric-value" style={{ color: Number(profitMargin) >= 20 ? 'var(--success)' : 'var(--text-primary)' }}>
            {profitMargin}%
          </div>
        </div>

        <div className="metric-card hover-card-biz">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={14} color="var(--warning)" /> Outstanding Receivables
          </div>
          <div className="metric-value">${outstandingReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Main Breakdown */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Column: Recent Activity / Charts */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px' }}>The Profit Engine</h2>
          
          <div style={{ padding: '24px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
              {/* Mock Profit Engine Chart for visual perfection */}
              {[40, 65, 45, 80, 55, 90, 75, 100].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '4px', height: '100%' }}>
                  <div style={{ width: '100%', height: `${h}%`, background: 'var(--accent-primary)', borderRadius: '4px', opacity: 0.8, transition: 'opacity 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.opacity = '1'} onMouseOut={e => e.currentTarget.style.opacity = '0.8'} />
                  <div style={{ width: '100%', height: `${h * 0.7}%`, background: 'var(--info)', borderRadius: '4px', opacity: 0.8, transition: 'opacity 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.opacity = '1'} onMouseOut={e => e.currentTarget.style.opacity = '0.8'} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--accent-primary)' }}/> Gross Revenue</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--info)' }}/> Net Profit</span>
            </div>
          </div>
        </div>

        {/* Right Column: Expense Breakdown */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px' }}>Expense Breakdown</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Contractor Timesheets</span>
                <span style={{ fontWeight: 500 }}>${contractorCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--surface-border)', borderRadius: '3px' }}>
                <div style={{ height: '100%', width: totalExpenses > 0 ? `${(contractorCosts / totalExpenses) * 100}%` : '0%', background: 'var(--info)', borderRadius: '3px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Software & Fixed</span>
                <span style={{ fontWeight: 500 }}>${fixedExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--surface-border)', borderRadius: '3px' }}>
                <div style={{ height: '100%', width: totalExpenses > 0 ? `${(fixedExpenses / totalExpenses) * 100}%` : '0%', background: 'var(--warning)', borderRadius: '3px' }} />
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '32px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Executive Reporting</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Download a perfectly formatted CSV of all income and expenses for your accountant or tax records.
            </p>
            <ExportDataClient invoices={invoices} expenses={expenses || []} />
          </div>
        </div>

      </div>

      {/* Receivables Kanban */}
      <ReceivablesKanbanClient initialInvoices={invoicesWithBusinesses || []} />
    </div>
  )
}
