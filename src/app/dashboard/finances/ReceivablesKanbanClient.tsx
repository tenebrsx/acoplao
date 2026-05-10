'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { FileText, Building2, MoreHorizontal } from 'lucide-react'

export function ReceivablesKanbanClient({ initialInvoices }: { initialInvoices: any[] }) {
  const [invoices, setInvoices] = useState(initialInvoices)
  const supabase = createClient()

  const columns = [
    { id: 'draft', title: 'Draft' },
    { id: 'sent', title: 'Sent' },
    { id: 'overdue', title: 'Overdue' },
    { id: 'paid', title: 'Paid' }
  ]

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    // Optimistic UI update
    setInvoices(invoices.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
    
    // DB update
    await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId)
  }

  return (
    <div style={{ marginTop: '32px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>Outstanding Receivables Kanban</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', overflowX: 'auto', paddingBottom: '16px' }}>
        {columns.map(col => {
          const columnInvoices = invoices.filter(inv => inv.status === col.id)
          const columnTotal = columnInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)

          return (
            <div key={col.id} className="glass-panel" style={{ padding: '16px', background: 'var(--surface)', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
              
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  {col.title}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: col.id === 'paid' ? 'var(--success)' : (col.id === 'overdue' ? 'var(--error)' : 'var(--text-primary)') }}>
                  ${columnTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {columnInvoices.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: '24px' }}>No invoices</div>
                ) : (
                  columnInvoices.map(inv => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={inv.id} 
                      className="glass-panel hover-card-biz"
                      style={{ padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', cursor: 'grab' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9375rem' }}>
                          <FileText size={14} color="var(--accent-primary)" />
                          ${Number(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ position: 'relative' }}>
                           <select 
                             value={inv.status}
                             onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                             style={{ 
                               position: 'absolute', opacity: 0, width: '20px', height: '20px', 
                               right: 0, top: 0, cursor: 'pointer' 
                             }}
                           >
                             <option value="draft">Draft</option>
                             <option value="sent">Sent</option>
                             <option value="overdue">Overdue</option>
                             <option value="paid">Paid</option>
                           </select>
                           <MoreHorizontal size={16} color="var(--text-tertiary)" />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <Building2 size={12} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inv.businesses?.name || 'Unknown Business'}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}
