import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, Wallet, Receipt, CreditCard, Activity, CalendarClock, Zap, Target, PieChart, Landmark } from 'lucide-react'
import { ReceivablesKanbanClient } from './ReceivablesKanbanClient'
import { ProfitEngineChart } from './ProfitEngineChart'

import { ExportDataClient } from './ExportDataClient'
import { ExpenseListClient } from './ExpenseListClient'

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

  if (profile?.role !== 'admin' && profile?.role !== 'manager') {
    redirect('/dashboard')
  }

  // --- Fetch Financial Data ---
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

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount, category, description, expense_date, receipt_url, businesses(name)')
    .order('expense_date', { ascending: false })

  const fixedExpenses = (expenses || [])
    .reduce((sum, exp) => sum + Number(exp.amount), 0)

  const { data: timesheets } = await supabase
    .from('contractor_timesheets')
    .select('hours_logged, hourly_rate')

  const contractorCosts = (timesheets || [])
    .reduce((sum, ts) => sum + (Number(ts.hours_logged) * Number(ts.hourly_rate)), 0)

  const totalExpenses = fixedExpenses + contractorCosts
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'

  const averageMonthlyExpenses = totalExpenses / 12 || 1
  const forecast30Days = outstandingReceivables - averageMonthlyExpenses

  return (
    <div className="animate-in delay-100">
      
      {/* Executive Financial Header */}
      <div style={{ position: 'relative', height: '200px', borderRadius: '16px', marginBottom: '32px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(0, 225, 255, 0.1) 100%)', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, padding: '40px 32px', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px', letterSpacing: '-0.02em' }}>
              <Landmark size={32} color="var(--success)" /> Financial Command
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Monitor agency-wide profitability, cashflow velocity, and tax-ready accounting.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/dashboard/finances/invoices/new" className="btn btn-secondary" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'var(--surface-border)' }}>
              <Receipt size={18} /> New Invoice
            </Link>
            <Link href="/dashboard/finances/expenses/new" className="btn btn-primary" style={{ boxShadow: '0 4px 15px rgba(0,225,255,0.2)' }}>
              <CreditCard size={18} /> Log Expense
            </Link>
          </div>
        </div>
      </div>

      {/* Financial Pulse Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel hover-card-biz" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={12} color="var(--success)" /> Gross Revenue
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
        </div>
        
        <div className="glass-panel hover-card-biz" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={12} color="var(--error)" /> Burn Rate
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
        </div>

        <div className="glass-panel hover-card-biz" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={12} color="var(--info)" /> Net Margin
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: Number(profitMargin) >= 20 ? 'var(--success)' : 'var(--text-primary)' }}>{profitMargin}%</div>
        </div>

        <div className="glass-panel hover-card-biz" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={12} color="var(--warning)" /> Receivables
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>${outstandingReceivables.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
        </div>

        <div className="glass-panel hover-card-biz" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={12} color="var(--accent-primary)" /> Forecast
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: forecast30Days >= 0 ? 'var(--success)' : 'var(--error)' }}>
            ${forecast30Days.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Main Financial Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Flow & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Chart Area */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PieChart size={18} color="var(--accent-primary)" /> Profit Engine
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', gap: '16px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} /> Revenue</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error)' }} /> Expenses</div>
              </div>
            </div>
            <ProfitEngineChart />
          </div>

          {/* Receivables Kanban Integrated */}
          <ReceivablesKanbanClient initialInvoices={invoicesWithBusinesses || []} />

          <ExpenseListClient initialExpenses={expenses || []} />
        </div>

        {/* Right Column: Breakdown & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px' }}>
          
          {/* Category Breakdown */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px' }}>Burn Composition</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>External Contractors</span>
                  <span style={{ fontWeight: 600 }}>${contractorCosts.toLocaleString()}</span>
                </div>
                <div style={{ height: '8px', background: 'var(--surface-border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: totalExpenses > 0 ? `${(contractorCosts / totalExpenses) * 100}%` : '0%', background: 'var(--info)', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Tools & Overhead</span>
                  <span style={{ fontWeight: 600 }}>${fixedExpenses.toLocaleString()}</span>
                </div>
                <div style={{ height: '8px', background: 'var(--surface-border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: totalExpenses > 0 ? `${(fixedExpenses / totalExpenses) * 100}%` : '0%', background: 'var(--warning)', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(0, 225, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Target size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profit Goal</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0' }}>
                Targeting a <strong style={{ color: 'var(--text-primary)' }}>35% margin</strong>. You are currently at <strong style={{ color: Number(profitMargin) >= 35 ? 'var(--success)' : 'var(--warning)' }}>{profitMargin}%</strong>.
              </p>
            </div>
          </div>

          {/* Export & Actions */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Accounting Tools</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Export financial records for your tax preparation or internal auditing.
            </p>
            <ExportDataClient invoices={invoices} expenses={expenses || []} />
          </div>

        </div>

      </div>
    </div>
  )
}
