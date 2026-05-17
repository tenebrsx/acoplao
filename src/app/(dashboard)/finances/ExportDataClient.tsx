'use client'

import { Download } from 'lucide-react'

export function ExportDataClient({ invoices, expenses }: { invoices: any[], expenses: any[] }) {
  
  const handleExport = () => {
    // 1. Prepare CSV headers
    const headers = ['Type', 'Date', 'Amount', 'Status/Category', 'Description', 'Business ID']
    
    // 2. Map Invoices (Income)
    const incomeRows = invoices.map(inv => [
      'Income',
      inv.created_at ? new Date(inv.created_at).toISOString().split('T')[0] : '',
      inv.amount,
      inv.status,
      inv.description || 'Invoice',
      inv.business_id || ''
    ])

    // 3. Map Expenses
    const expenseRows = expenses.map(exp => [
      'Expense',
      exp.expense_date ? new Date(exp.expense_date).toISOString().split('T')[0] : '',
      `-${exp.amount}`,
      exp.category,
      exp.description || 'Expense',
      exp.business_id || ''
    ])

    // 4. Combine and format as CSV
    const allRows = [headers, ...incomeRows, ...expenseRows]
    const csvContent = allRows.map(row => row.join(',')).join('\n')
    
    // 5. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `financial_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button 
      onClick={handleExport}
      className="btn btn-secondary btn-sm" 
      style={{ display: 'flex', gap: '8px', width: '100%' }}
    >
      <Download size={14} /> Accountant CSV Export
    </button>
  )
}
