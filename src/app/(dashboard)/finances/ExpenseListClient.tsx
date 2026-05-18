'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/ToastProvider'
import { Expense, ExpenseCategory } from '@/lib/types/finance'
import { Search, Code, Briefcase, Sparkles, Tag, Receipt, ExternalLink, Trash2 } from 'lucide-react'

interface ExpenseListClientProps {
  initialExpenses: Expense[]
}

const CATEGORY_ICONS = {
  software: Code,
  contractor: Briefcase,
  ad_spend: Sparkles,
  other: Tag
} as const

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  software: 'Software',
  contractor: 'Contractor',
  ad_spend: 'Ad Spend',
  other: 'Other'
}

const CATEGORY_FILTERS: { value: ExpenseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'software', label: 'Software' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'ad_spend', label: 'Ad Spend' },
  { value: 'other', label: 'Other' }
]

export function ExpenseListClient({ initialExpenses }: ExpenseListClientProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all')
  const [showAll, setShowAll] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = searchQuery === '' ||
        expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.businesses?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [expenses, searchQuery, categoryFilter])

  const displayedExpenses = showAll ? filteredExpenses : filteredExpenses.slice(0, 10)

  const handleDelete = async (expenseId: string) => {
    const previousExpenses = expenses
    setExpenses(prev => prev.filter(exp => exp.id !== expenseId))
    
    const { error } = await supabase.from('expenses').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', expenseId)
    
    if (error) {
      setExpenses(previousExpenses)
      toast('Failed to delete expense', 'error')
    } else {
      toast('Expense deleted', 'success')
    }
  }

  const formatAmount = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (initialExpenses.length === 0) {
    return null
  }

  return (
    <div className="glass-panel" style={{ padding: '28px' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Receipt size={18} color="var(--error)" /> Recent Expenditures
      </h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--surface-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {CATEGORY_FILTERS.map(filter => (
          <button
            key={filter.value}
            onClick={() => setCategoryFilter(filter.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: categoryFilter === filter.value ? 'var(--accent-primary)' : 'var(--surface-border)',
              background: categoryFilter === filter.value ? 'var(--accent-primary)' : 'transparent',
              color: categoryFilter === filter.value ? 'white' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filteredExpenses.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Receipt size={28} color="var(--text-tertiary)" />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '16px' }}>
            No expenses match your filters
          </p>
          <Link
            href="/finances/expenses/new"
            style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}
          >
            Create a new expense
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayedExpenses.map(expense => {
              const CategoryIcon = CATEGORY_ICONS[expense.category as ExpenseCategory]
              return (
                <div
                  key={expense.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px solid var(--surface-border)',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'}
                  onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-primary)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--surface-border)' }}>
                      <CategoryIcon size={16} color="var(--text-tertiary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{expense.description || 'General Expense'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', gap: '8px', marginTop: '2px', alignItems: 'center' }}>
                        <span style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.05em', padding: '2px 6px', borderRadius: '4px', background: 'var(--surface)' }}>{CATEGORY_LABELS[expense.category]}</span>
                        <span>•</span>
                        <span>{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : 'No date'}</span>
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
                      {formatAmount(expense.amount)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {expense.receipt_url && (
                        <a
                          href={expense.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', border: '1px solid var(--surface-border)', textDecoration: 'none' }}
                          title="View Receipt"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(expense.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                        title="Delete Expense"
                        onMouseOver={e => (e.currentTarget as HTMLElement).style.color = 'var(--error)'}
                        onMouseOut={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredExpenses.length > 10 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              style={{
                marginTop: '16px',
                padding: '10px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--surface-border)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
            >
              Show all {filteredExpenses.length} expenses
            </button>
          )}
        </>
      )}
    </div>
  )
}