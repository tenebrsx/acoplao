import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionCookie } from '@/lib/firebase-admin'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { DollarSign, TrendingUp, TrendingDown, Receipt, Activity, Zap, Landmark, Plus } from 'lucide-react'
import { InvoiceListClient } from './InvoiceListClient'
import { ExpenseListClient } from './ExpenseListClient'
import { ExportDataClient } from './ExportDataClient'
import { ProfitEngineChart } from './ProfitEngineChart'
import type { Expense } from '@/lib/types/finance'

export default async function FinancesDashboard() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('firebase-session')?.value
  if (!sessionToken) redirect('/login')

  const decoded = await verifySessionCookie(sessionToken)
  if (!decoded) redirect('/login')

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', decoded.email)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'manager') {
    redirect('/')
  }

  const [invoicesRes, expensesRes, timesheetsRes] = await Promise.all([
    supabase.from('invoices').select('*, businesses(name)'),
    supabase.from('expenses').select('id, amount, category, description, expense_date, receipt_url, businesses(name)').order('expense_date', { ascending: false }),
    supabase.from('contractor_timesheets').select('hours_logged, hourly_rate'),
  ])

  const invoices = invoicesRes.data || []
  const expenses = expensesRes.data || []

  const totalIncome = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const outstandingReceivables = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const fixedExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const contractorCosts = (timesheetsRes.data || []).reduce((s, ts) => s + (Number(ts.hours_logged) * Number(ts.hourly_rate)), 0)
  const totalExpenses = fixedExpenses + contractorCosts
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'
  const averageMonthlyExpenses = totalExpenses / 12 || 1
  const forecast30Days = outstandingReceivables - averageMonthlyExpenses

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date()
    month.setMonth(month.getMonth() - (5 - i))
    const monthStr = month.toLocaleString('default', { month: 'short' })
    const monthRevenue = invoices
      .filter(inv => inv.status === 'paid' && new Date(inv.created_at || '').getMonth() === month.getMonth())
      .reduce((s, inv) => s + Number(inv.amount), 0)
    const monthExpenses = expenses
      .filter(exp => new Date(exp.expense_date || '').getMonth() === month.getMonth())
      .reduce((s, exp) => s + Number(exp.amount), 0)
    return { month: monthStr, revenue: monthRevenue, expenses: monthExpenses, profit: monthRevenue - monthExpenses }
  })

  return (
    <div className="flex flex-col gap-12 animate-in delay-100">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-1.5">Finances</h1>
          <p className="text-muted-foreground text-sm">Agency-wide profitability, invoices, and expenses.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/finances/expenses/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-sm font-medium text-foreground hover:bg-white/[0.1] transition-colors"
          >
            <Plus size={15} /> Log Expense
          </Link>
          <Link
            href="/finances/invoices/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Receipt size={15} /> New Invoice
          </Link>
        </div>
      </div>

      {/* STAT STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 pb-8 border-b border-white/[0.08]">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-500" /> Gross Revenue
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">${totalIncome.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <TrendingDown size={14} className="text-red-400" /> Total Expenses
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">${totalExpenses.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Activity size={14} className="text-blue-400" /> Net Margin
          </span>
          <span className={`text-3xl font-medium tracking-tight ${Number(profitMargin) >= 20 ? 'text-emerald-400' : 'text-foreground'}`}>{profitMargin}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <DollarSign size={14} className="text-amber-500" /> Receivables
          </span>
          <span className="text-3xl font-medium tracking-tight text-foreground">${outstandingReceivables.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Zap size={14} className="text-primary" /> 30d Forecast
          </span>
          <span className={`text-3xl font-medium tracking-tight ${forecast30Days >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${forecast30Days.toLocaleString()}
          </span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT: Invoice List + Expense List */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          <InvoiceListClient initialInvoices={invoices} />
          <ExpenseListClient initialExpenses={expenses as Expense[]} />
        </div>

        {/* RIGHT: Chart + Burn composition + Export */}
        <div className="flex flex-col gap-8">

          {/* Profit Chart */}
          <div>
            <h2 className="text-lg font-medium mb-4 text-foreground/90">Profit Engine</h2>
            <div className="bg-[#141416]/50 border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl">
              <ProfitEngineChart data={monthlyData} />
            </div>
          </div>

          {/* Burn Composition */}
          <div>
            <h2 className="text-lg font-medium mb-4 text-foreground/90">Burn Composition</h2>
            <div className="bg-[#141416]/50 border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-6">
              {[
                { label: 'Contractors', value: contractorCosts, color: 'bg-blue-500' },
                { label: 'Tools & Overhead', value: fixedExpenses, color: 'bg-amber-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">${item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: totalExpenses > 0 ? `${(item.value / totalExpenses) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-white/[0.06] text-sm text-muted-foreground">
                Targeting <strong className="text-foreground">35% margin</strong> · currently at{' '}
                <strong className={Number(profitMargin) >= 35 ? 'text-emerald-400' : 'text-amber-400'}>{profitMargin}%</strong>
              </div>
            </div>
          </div>

          {/* Export */}
          <div>
            <h2 className="text-lg font-medium mb-4 text-foreground/90">Accounting Tools</h2>
            <div className="bg-[#141416]/50 border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl">
              <p className="text-sm text-muted-foreground mb-4">Export records for tax preparation or internal auditing.</p>
              <ExportDataClient invoices={invoices} expenses={expenses} />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
