'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Send, Loader2, Sparkles, Building2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type LineItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
}

export function InvoiceBuilderClient({ businesses }: { businesses: any[] }) {
  const router = useRouter()
  const [businessId, setBusinessId] = useState('')
  const [description, setDescription] = useState('Design & Development Services')
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: 'Web Application Development', quantity: 1, unit_price: 5000 }
  ])
  const [saving, setSaving] = useState(false)

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), description: '', quantity: 1, unit_price: 0 }])
  }

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  const handleCreateInvoice = async () => {
    if (!businessId) return alert('Please select a business.')
    
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Create Invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        business_id: businessId,
        amount: subtotal,
        status: 'draft',
        due_date: dueDate || null,
        description: description,
        created_by: user?.id
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      console.error(invoiceError)
      alert('Failed to create invoice')
      setSaving(false)
      return
    }

    // 2. Create Line Items
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))

      await supabase.from('invoice_items').insert(itemsToInsert)
    }

    // Redirect to finances page for now (later we can redirect to a specific invoice view)
    router.push('/dashboard/finances')
  }

  return (
    <div className="animate-in delay-100" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '64px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <Link href="/dashboard/finances" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.875rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Finances
        </Link>
        <button 
          onClick={handleCreateInvoice}
          disabled={saving || !businessId}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Save as Draft
        </button>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles size={32} color="var(--accent-primary)" />
          New Invoice
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Craft a beautiful, itemized invoice for your client.
        </p>
      </div>

      {/* The Invoice Document View */}
      <div className="glass-panel" style={{ padding: '40px', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Decorative Top Accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--accent-primary), var(--info))' }} />

        {/* Header Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '48px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Bill To</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <select 
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px 12px 36px',
                  background: 'var(--bg-primary)', border: '1px solid var(--surface-border)',
                  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
                  fontSize: '0.875rem', appearance: 'none', cursor: 'pointer'
                }}
              >
                <option value="" disabled>Select a Business...</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Due Date</label>
            <input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--bg-primary)', border: '1px solid var(--surface-border)',
                borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
                fontSize: '0.875rem', colorScheme: 'dark'
              }}
            />
          </div>
        </div>

        {/* Subject / Description */}
        <div style={{ marginBottom: '48px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Subject</label>
          <input 
            type="text" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Website Redesign Q3"
            style={{
              width: '100%', padding: '0',
              background: 'transparent', border: 'none',
              color: 'var(--text-primary)', outline: 'none',
              fontSize: '1.25rem', fontWeight: 500
            }}
          />
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: '40px' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 40px', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)', marginBottom: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div>Description</div>
            <div style={{ textAlign: 'right' }}>Qty</div>
            <div style={{ textAlign: 'right' }}>Price</div>
            <div></div>
          </div>

          {/* Table Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 40px', gap: '16px', alignItems: 'center' }}>
                <input 
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  placeholder="Item description"
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid transparent', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                />
                <input 
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid transparent', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem', textAlign: 'right', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>$</span>
                  <input 
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px 10px 24px', background: 'var(--bg-primary)', border: '1px solid transparent', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem', textAlign: 'right', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                  />
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', borderRadius: '6px' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--error)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={addItem}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', padding: '8px 12px', borderRadius: '6px' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <Plus size={16} /> Add Line Item
          </button>
        </div>

        {/* Totals */}
        <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
              <span>Total</span>
              <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
