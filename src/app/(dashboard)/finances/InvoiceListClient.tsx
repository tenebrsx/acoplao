'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/ToastProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Clock, CheckCircle2, RefreshCw, FileText, MoreHorizontal, Trash2, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid'

type Invoice = {
  id: string
  amount: number
  status: InvoiceStatus
  due_date?: string | null
  is_recurring?: boolean
  recurring_interval?: string | null
  created_at?: string | null
  businesses?: { name: string } | null
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  draft:   { label: 'Draft',   color: 'text-muted-foreground',  bg: 'bg-white/[0.05] border-white/[0.08]' },
  sent:    { label: 'Sent',    color: 'text-blue-400',           bg: 'bg-blue-500/10 border-blue-500/20' },
  overdue: { label: 'Overdue', color: 'text-red-400',            bg: 'bg-red-500/10 border-red-500/20' },
  paid:    { label: 'Paid',    color: 'text-emerald-400',        bg: 'bg-emerald-500/10 border-emerald-500/20' },
}

const ALL_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'overdue', 'paid']

export function InvoiceListClient({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const handleStatusChange = useCallback(async (invoiceId: string, newStatus: InvoiceStatus) => {
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
    setOpenMenu(null)
    const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId)
    if (error) {
      setInvoices(initialInvoices)
      toast(`Failed to update: ${error.message}`, 'error')
    } else {
      toast(`Invoice marked as ${newStatus}`, 'success')
    }
  }, [supabase, initialInvoices, toast])

  const handleDelete = useCallback(async (invoiceId: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId))
    setOpenMenu(null)
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
    if (error) {
      setInvoices(initialInvoices)
      toast('Failed to delete invoice', 'error')
    } else {
      toast('Invoice deleted', 'success')
    }
  }, [supabase, initialInvoices, toast])

  const filtered = invoices.filter(inv => statusFilter === 'all' || inv.status === statusFilter)

  return (
    <div className="glass-panel" style={{ padding: '28px' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }} className="text-foreground/90">
          <FileText size={18} className="text-primary" /> Invoices
        </h2>
        <Link href="/finances/invoices/new" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          New <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all', ...ALL_STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              statusFilter === s
                ? 'bg-primary/10 border-primary/30 text-foreground'
                : 'bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.06]'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            {s !== 'all' && (
              <span className="ml-1.5 opacity-50">{invoices.filter(i => i.status === s).length}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl">
          <FileText size={28} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No invoices found.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Header row */}
          <div className="grid grid-cols-12 px-4 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground/50 font-medium border-b border-white/[0.06]">
            <span className="col-span-4">Client</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-3">Due Date</span>
            <span className="col-span-2 text-right">Amount</span>
            <span className="col-span-1" />
          </div>

          <AnimatePresence>
            {filtered.map((inv, i) => {
              const cfg = STATUS_CONFIG[inv.status]
              const isOverdue = inv.status === 'overdue'
              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ delay: i * 0.025 }}
                  className="group grid grid-cols-12 items-center px-4 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  {/* Client */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                      <Building2 size={12} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {inv.businesses?.name || 'Unknown Client'}
                      </div>
                      {inv.is_recurring && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-400 mt-0.5">
                          <RefreshCw size={9} /> {inv.recurring_interval} retainer
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Due date */}
                  <div className="col-span-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock size={12} className={isOverdue ? 'text-red-400' : ''} />
                    <span className={isOverdue ? 'text-red-400' : ''}>
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-medium text-foreground">${Number(inv.amount).toLocaleString()}</span>
                  </div>

                  {/* Actions menu */}
                  <div className="col-span-1 flex justify-end relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {openMenu === inv.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-0 top-full mt-1 z-20 bg-[#1c1c1f] border border-white/[0.1] rounded-xl p-1.5 min-w-[160px] shadow-2xl shadow-black/60">
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => handleStatusChange(inv.id, 'paid')}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-emerald-400 hover:bg-white/[0.06] transition-colors text-left"
                            >
                              <CheckCircle2 size={14} /> Mark as Paid
                            </button>
                          )}
                          {ALL_STATUSES.filter(s => s !== inv.status && s !== 'paid').map(s => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(inv.id, s)}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors text-left"
                            >
                              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].color.replace('text-', 'bg-').replace('-400', '-500')}`} />
                              {STATUS_CONFIG[s].label}
                            </button>
                          ))}
                          <div className="h-px bg-white/[0.06] my-1" />
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-white/[0.06] transition-colors text-left"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
