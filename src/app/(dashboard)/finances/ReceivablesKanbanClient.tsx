'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/ToastProvider'
import { motion } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Building2,
  MoreHorizontal,
  CreditCard,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileText,
  Trash2,
} from 'lucide-react'
import { Invoice, InvoiceStatus, KanbanColumn } from '@/lib/types/finance'

const COLUMNS: KanbanColumn[] = [
  { id: 'draft', title: 'Draft', color: 'var(--text-tertiary)', icon: 'draft' },
  { id: 'sent', title: 'Sent', color: 'var(--info)', icon: 'sent' },
  { id: 'overdue', title: 'Overdue', color: 'var(--error)', icon: 'overdue' },
  { id: 'paid', title: 'Paid', color: 'var(--success)', icon: 'paid' },
]

interface SortableInvoiceCardProps {
  invoice: Invoice
  onStatusChange: (invoiceId: string, newStatus: InvoiceStatus) => Promise<void>
  onDelete: (invoiceId: string) => void
  onStripeMock: (invoiceId: string) => void
}

function SortableInvoiceCard({
  invoice,
  onStatusChange,
  onDelete,
  onStripeMock,
}: SortableInvoiceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: invoice.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '16px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--surface-border)',
          cursor: 'grab',
        }}
        {...attributes}
        {...listeners}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              ${Number(invoice.amount).toLocaleString()}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '4px',
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
              }}
            >
              <Building2 size={12} />
              <span style={{ fontWeight: 500 }}>
                {invoice.businesses?.name || 'Client'}
              </span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'var(--surface-hover)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MoreHorizontal size={14} color="var(--text-secondary)" />
            </button>

            {menuOpen && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10,
                  }}
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '4px',
                    zIndex: 20,
                    background: 'var(--surface)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: '8px',
                    padding: '4px',
                    minWidth: '140px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  }}
                >
                  {COLUMNS.filter((c) => c.id !== invoice.status).map((col) => (
                    <button
                      key={col.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(false)
                        onStatusChange(invoice.id, col.id)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        color: 'var(--text-primary)',
                        borderRadius: '6px',
                        textAlign: 'left',
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = 'var(--surface-hover)')
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = 'none')
                      }
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: col.color,
                        }}
                      />
                      Move to {col.title}
                    </button>
                  ))}
                  <div
                    style={{
                      height: '1px',
                      background: 'var(--surface-border)',
                      margin: '4px 0',
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onDelete(invoice.id)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      color: 'var(--error)',
                      borderRadius: '6px',
                      textAlign: 'left',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = 'var(--surface-hover)')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = 'none')
                    }
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {invoice.is_recurring && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--info)',
              background: 'rgba(0,150,255,0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
              marginBottom: '12px',
              width: 'fit-content',
              textTransform: 'uppercase',
            }}
          >
            <RefreshCw size={10} /> {invoice.recurring_interval} Retainer
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.7rem',
            color: 'var(--text-tertiary)',
            borderTop: '1px solid var(--surface-border)',
            paddingTop: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={10} />
            {invoice.status === 'paid'
              ? 'Paid on time'
              : `Due ${new Date(invoice.due_date ?? '').toLocaleDateString()}`}
          </div>
          {invoice.status === 'paid' ? (
            <CheckCircle2 size={12} color="var(--success)" />
          ) : (
            <button
              onClick={() => onStripeMock(invoice.id)}
              style={{
                color: 'var(--accent-primary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CreditCard size={12} /> Pay
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

interface InvoiceColumnProps {
  column: KanbanColumn
  invoices: Invoice[]
  onStatusChange: (invoiceId: string, newStatus: InvoiceStatus) => Promise<void>
  onDelete: (invoiceId: string) => void
  onStripeMock: (invoiceId: string) => void
}

function InvoiceColumn({
  column,
  invoices,
  onStatusChange,
  onDelete,
  onStripeMock,
}: InvoiceColumnProps) {
  const columnTotal = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)

  return (
    <div
      style={{
        width: '300px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: column.color,
            }}
          />
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)',
            }}
          >
            {column.title}
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              color: 'var(--text-tertiary)',
              fontWeight: 500,
            }}
          >
            ({invoices.length})
          </span>
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          ${columnTotal.toLocaleString()}
        </div>
      </div>

      <SortableContext
        items={invoices.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(255,255,255,0.02)',
            padding: '12px',
            borderRadius: '16px',
            border: '1px solid var(--surface-border)',
            flex: 1,
            minHeight: '200px',
          }}
        >
          {invoices.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '0.75rem',
                marginTop: '32px',
                border: '1px dashed var(--surface-border)',
                borderRadius: '12px',
                padding: '24px',
                gap: '8px',
              }}
            >
              <FileText size={24} style={{ opacity: 0.5 }} />
              <span>No {column.title.toLowerCase()} invoices</span>
            </div>
          ) : (
            invoices.map((inv) => (
              <SortableInvoiceCard
                key={inv.id}
                invoice={inv}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                onStripeMock={onStripeMock}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

interface DragOverlayCardProps {
  invoice: Invoice
}

function DragOverlayCard({ invoice }: DragOverlayCardProps) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--accent-primary)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        cursor: 'grabbing',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            ${Number(invoice.amount).toLocaleString()}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '4px',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
            }}
          >
            <Building2 size={12} />
            <span style={{ fontWeight: 500 }}>
              {invoice.businesses?.name || 'Client'}
            </span>
          </div>
        </div>
      </div>

      {invoice.is_recurring && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'var(--info)',
            background: 'rgba(0,150,255,0.1)',
            padding: '2px 8px',
            borderRadius: '4px',
            marginBottom: '12px',
            width: 'fit-content',
            textTransform: 'uppercase',
          }}
        >
          <RefreshCw size={10} /> {invoice.recurring_interval} Retainer
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.7rem',
          color: 'var(--text-tertiary)',
          borderTop: '1px solid var(--surface-border)',
          paddingTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={10} />
          {invoice.status === 'paid'
            ? 'Paid on time'
            : `Due ${new Date(invoice.due_date ?? '').toLocaleDateString()}`}
        </div>
      </div>
    </div>
  )
}

export function ReceivablesKanbanClient({
  initialInvoices,
}: {
  initialInvoices: Invoice[]
}) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const handleStatusChange = useCallback(
    async (invoiceId: string, newStatus: InvoiceStatus) => {
      const prevInvoices = [...invoices]
      setInvoices(
        invoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: newStatus } : inv
        )
      )

      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId)

      if (error) {
        setInvoices(prevInvoices)
        toast(`Failed to update status: ${error.message}`, 'error')
      } else {
        toast(`Invoice moved to ${newStatus}`, 'success')
      }
    },
    [invoices, supabase, toast]
  )

  const handleDelete = useCallback(
    async (invoiceId: string) => {
      const prevInvoices = [...invoices]
      setInvoices(invoices.filter((inv) => inv.id !== invoiceId))

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

      if (error) {
        setInvoices(prevInvoices)
        toast(`Failed to delete: ${error.message}`, 'error')
      } else {
        toast('Invoice deleted', 'success')
      }
    },
    [invoices, supabase, toast]
  )

  const handleStripeMock = useCallback((invoiceId: string) => {
    toast(`Stripe flow for invoice ${invoiceId}`, 'info')
  }, [toast])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const invoice = invoices.find((i) => i.id === event.active.id)
    if (invoice) setActiveInvoice(invoice)
  }, [invoices])

  const handleDragOver = useCallback((_event: DragOverEvent) => {
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveInvoice(null)

      const { active, over } = event
      if (!over) return

      const invoiceId = active.id as string
      const overId = over.id as string

      const overColumn = COLUMNS.find((c) => c.id === overId)
      if (overColumn) {
        handleStatusChange(invoiceId, overColumn.id)
        return
      }

      const invoice = invoices.find((i) => i.id === invoiceId)
      const overInvoice = invoices.find((i) => i.id === overId)

      if (invoice && overInvoice && invoice.status !== overInvoice.status) {
        handleStatusChange(invoiceId, overInvoice.status)
      }
    },
    [invoices, handleStatusChange]
  )

  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Cashflow Pipeline</h2>
        <div
          style={{
            padding: '4px 12px',
            background: 'var(--surface-hover)',
            borderRadius: '20px',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            fontWeight: 600,
          }}
        >
          {invoices.length} Total Invoices
        </div>
      </div>

      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
      >
        <div
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            paddingBottom: '20px',
            minHeight: '500px',
          }}
        >
          {COLUMNS.map((col) => {
            const columnInvoices = invoices.filter((inv) => inv.status === col.id)

            return (
              <InvoiceColumn
                key={col.id}
                column={col}
                invoices={columnInvoices}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onStripeMock={handleStripeMock}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeInvoice ? <DragOverlayCard invoice={activeInvoice} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}