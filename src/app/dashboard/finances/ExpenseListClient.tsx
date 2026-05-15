'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, ExternalLink, Receipt, CreditCard, Tag } from 'lucide-react'

export function ExpenseListClient({ initialExpenses }: { initialExpenses: any[] }) {
  const [expenses, setExpenses] = useState(initialExpenses)
  const supabase = createClient()

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    setExpenses(expenses.filter(exp => exp.id !== expenseId))
    await supabase.from('expenses').delete().eq('id', expenseId)
  }

  if (expenses.length === 0) return null

  return (
    <div className="glass-panel" style={{ padding: '28px' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Receipt size={18} color="var(--error)" /> Recent Expenditures
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {expenses.slice(0, 10).map((expense) => (
          <div key={expense.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg-primary)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--surface-border)' }}>
                 <Tag size={16} color="var(--text-tertiary)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{expense.description || 'General Expense'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', gap: '8px', marginTop: '2px', alignItems: 'center' }}>
                  <span style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.05em' }}>{expense.category.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                  {expense.businesses?.name && (
                    <>
                      <span>•</span>
                      <span style={{ color: 'var(--accent-secondary)', fontWeight: 500 }}>{expense.businesses.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                ${Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {expense.receipt_url && (
                  <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', border: '1px solid var(--surface-border)' }} title="View Receipt">
                    <ExternalLink size={14} />
                  </a>
                )}
                <button 
                  onClick={() => handleDelete(expense.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                  title="Delete Expense"
                  onMouseOver={e => e.currentTarget.style.color = 'var(--error)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
