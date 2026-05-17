export type ExpenseCategory = 'software' | 'contractor' | 'ad_spend' | 'other'

export type Expense = {
  id: string
  amount: number
  category: ExpenseCategory
  description?: string
  expense_date?: string
  receipt_url?: string
  businesses?: { name?: string }
}

export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid'

export type Invoice = {
  id: string
  amount: number
  status: InvoiceStatus
  due_date?: string
  business_id?: string
  businesses?: { id?: string; name?: string }
  created_at?: string
  is_recurring?: boolean
  recurring_interval?: string
}

export type KanbanColumn = {
  id: InvoiceStatus
  title: string
  color: string
  icon: string
}

export type MonthlyFinanceData = {
  month: string
  revenue: number
  expenses: number
  profit: number
}
