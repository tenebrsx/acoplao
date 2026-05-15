'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { FileText, Building2, MoreHorizontal, Trash2, CreditCard, RefreshCw, Clock, CheckCircle2 } from 'lucide-react'

export function ReceivablesKanbanClient({ initialInvoices }: { initialInvoices: any[] }) {
  const [invoices, setInvoices] = useState(initialInvoices)
  const supabase = createClient()

  const columns = [
    { id: 'draft', title: 'Draft', color: 'var(--text-tertiary)' },
    { id: 'sent', title: 'Sent', color: 'var(--info)' },
    { id: 'overdue', title: 'Overdue', color: 'var(--error)' },
    { id: 'paid', title: 'Paid', color: 'var(--success)' }
  ]

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    setInvoices(invoices.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
    await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId)
  }

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    setInvoices(invoices.filter(inv => inv.id !== invoiceId))
    await supabase.from('invoices').delete().eq('id', invoiceId)
  }

  const handleStripeMock = (invoiceId: string) => {
    alert(`Stripe Integration Flow Activated for invoice ${invoiceId}.`)
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Cashflow Pipeline</h2>
        <div style={{ padding: '4px 12px', background: 'var(--surface-hover)', borderRadius: '20px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
          {invoices.length} Total Invoices
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', minHeight: '500px' }}>
        {columns.map(col => {
          const columnInvoices = invoices.filter(inv => inv.status === col.id)
          const columnTotal = columnInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)

          return (
            <div key={col.id} style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                    {col.title}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ${columnTotal.toLocaleString()}
                </div>
              </div>

              {/* Cards Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '16px', border: '1px solid var(--surface-border)', flex: 1 }}>
                {columnInvoices.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '32px', border: '1px dashed var(--surface-border)', borderRadius: '12px', padding: '24px' }}>
                    Empty
                  </div>
                ) : (
                  columnInvoices.map(inv => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={inv.id} 
                      className="glass-panel"
                      style={{ padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', cursor: 'default' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                           <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                             ${Number(inv.amount).toLocaleString()}
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                              <Building2 size={12} />
                              <span style={{ fontWeight: 500 }}>{inv.businesses?.name || 'Client'}</span>
                           </div>
                        </div>
                        <div style={{ position: 'relative' }}>
                           <select 
                             value={inv.status}
                             onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                             style={{ 
                               position: 'absolute', opacity: 0, width: '24px', height: '24px', 
                               right: 0, top: 0, cursor: 'pointer' 
                             }}
                           >
                             <option value="draft">Move to Draft</option>
                             <option value="sent">Move to Sent</option>
                             <option value="overdue">Move to Overdue</option>
                             <option value="paid">Mark as Paid</option>
                           </select>
                           <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                             <MoreHorizontal size={14} color="var(--text-secondary)" />
                           </div>
                        </div>
                      </div>

                      {inv.is_recurring && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--info)', background: 'rgba(0,150,255,0.1)', padding: '2px 8px', borderRadius: '4px', marginBottom: '12px', width: 'fit-content', textTransform: 'uppercase' }}>
                          <RefreshCw size={10} /> {inv.recurring_interval} Retainer
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-tertiary)', borderTop: '1px solid var(--surface-border)', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={10} />
                          {inv.status === 'paid' ? 'Paid on time' : `Due ${new Date(inv.due_date).toLocaleDateString()}`}
                        </div>
                        {inv.status === 'paid' ? (
                          <CheckCircle2 size={12} color="var(--success)" />
                        ) : (
                          <button onClick={() => handleStripeMock(inv.id)} style={{ color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CreditCard size={12} /> Pay
                          </button>
                        )}
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
